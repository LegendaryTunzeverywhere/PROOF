/**
 * LLM providers — Google Gemini and Cohere
 *
 * Cohere is used first in auto mode, with Gemini as fallback.
 * JSON mode is requested from both providers and parsed defensively.
 */
import { config } from '../config.js';

const TIMEOUT_MS = 60_000; // Increased to 60 seconds for document analysis
let cohereKeyCursor = 0;

function selectedProvider() {
  if (config.ai.provider === 'cohere') return config.ai.cohereApiKeys.length ? 'cohere' : '';
  if (config.ai.provider === 'gemini') return config.ai.apiKey ? 'gemini' : '';
  if (config.ai.provider === 'auto') {
    if (config.ai.cohereApiKeys.length) return 'cohere';
    if (config.ai.apiKey) return 'gemini';
  }
  return '';
}

export const llmEnabled = () => !!selectedProvider();
export const cohereEmbeddingsEnabled = () =>
  config.ai.cohereEmbeddingsEnabled && selectedProvider() === 'cohere';

const GEMINI_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

function modelCandidates() {
  const primary = config.ai.model;
  const rest = GEMINI_FALLBACK_MODELS.filter((m) => m !== primary);
  return primary ? [primary, ...rest] : rest;
}

export async function llmJson({ system, prompt, maxTokens = 900, task = 'tutor' }) {
  if (!llmEnabled()) throw new Error('LLM_NOT_CONFIGURED');

  if (selectedProvider() === 'cohere') {
    const keys = config.ai.cohereApiKeys;
    let lastError;
    const start = cohereKeyCursor % keys.length;

    // Trial-friendly failover: each key gets one attempt, with no repeated
    // retries that could burn quota during a provider outage.
    for (let offset = 0; offset < keys.length; offset++) {
      const keyIndex = (start + offset) % keys.length;
      try {
        const result = await callCohere({ system, prompt, maxTokens, task, apiKey: keys[keyIndex] });
        cohereKeyCursor = keyIndex;
        return result;
      } catch (error) {
        lastError = error;
        if (!isRateLimitError(error) || offset === keys.length - 1) throw error;
        console.warn(`[Cohere] Key ${keyIndex + 1}/${keys.length} is rate-limited; switching keys.`);
      }
    }
    throw lastError || new Error('COHERE_UNAVAILABLE');
  }

  if (selectedProvider() === 'gemini') {
    let lastError;
    for (const model of modelCandidates()) {
      try {
        return await callGemini({ system, prompt, maxTokens, model });
      } catch (e) {
        lastError = e;
        console.warn(`[LLM] Gemini model ${model} failed:`, e.message);
      }
    }
    throw lastError || new Error('GEMINI_UNAVAILABLE');
  }

  throw new Error('LLM_NOT_CONFIGURED');
}

export async function cohereEmbed(texts, inputType) {
  if (!cohereEmbeddingsEnabled()) throw new Error('COHERE_EMBEDDINGS_DISABLED');

  const keys = config.ai.cohereApiKeys;
  let lastError;
  const start = cohereKeyCursor % keys.length;
  for (let offset = 0; offset < keys.length; offset++) {
    const keyIndex = (start + offset) % keys.length;
    try {
      const result = await callCohereEmbed({ texts, inputType, apiKey: keys[keyIndex] });
      cohereKeyCursor = keyIndex;
      return result;
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || offset === keys.length - 1) throw error;
      console.warn(`[Cohere] Embedding key ${keyIndex + 1}/${keys.length} is rate-limited; switching keys.`);
    }
  }
  throw lastError || new Error('COHERE_EMBED_UNAVAILABLE');
}

async function callCohere({ system, prompt, maxTokens, task, apiKey }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const model = task === 'curriculum' ? config.ai.cohereCurriculumModel : config.ai.cohereTutorModel;
    const url = 'https://api.cohere.com/v2/chat';
    const requestBody = {
      model,
      messages: [
        { role: 'system', content: system + '\n\nRespond with ONLY valid JSON matching the requested schema.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };

    console.log('[Cohere] Request:', { model, task, url, keyPoolSize: config.ai.cohereApiKeys.length });
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[Cohere] Error response:', detail.slice(0, 500));
      throw new Error(`COHERE_HTTP_${res.status}: ${detail.slice(0, 160)}`);
    }

    const data = await res.json();
    const text = data?.message?.content?.map((part) => part.text || '').join('') || '';
    if (!text) {
      console.error('[Cohere] Empty response:', data);
      throw new Error('COHERE_EMPTY_RESPONSE');
    }

    console.log('[Cohere] Success! Response length:', text.length);
    const cleanedJson = extractJson(text);
    try {
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[Cohere] JSON parse failed. Raw:', text.slice(0, 500));
      throw new Error(`COHERE_INVALID_JSON: ${parseError.message}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function callCohereEmbed({ texts, inputType, apiKey }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('https://api.cohere.com/v2/embed', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.cohereEmbedModel,
        texts,
        input_type: inputType,
        embedding_types: ['float'],
        output_dimension: config.ai.cohereEmbedDimension,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`COHERE_HTTP_${response.status}: ${detail.slice(0, 160)}`);
    }
    const data = await response.json();
    const embeddings = data?.embeddings?.float;
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error('COHERE_INVALID_EMBEDDINGS');
    }
    return embeddings;
  } finally {
    clearTimeout(timer);
  }
}

function isRateLimitError(error) {
  return /COHERE_HTTP_(408|409|429)\b|rate.?limit|too many requests/i.test(error?.message || '');
}

async function callGemini({ system, prompt, maxTokens, model }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const base = config.ai.baseUrl.replace(/\/$/, '');
    const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.ai.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system + '\nRespond with ONLY valid JSON matching the requested schema — no prose, no code fences.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`GEMINI_HTTP_${res.status}${detail ? ': ' + detail.slice(0, 160) : ''}`);
    }
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('');
    if (!text) throw new Error(`GEMINI_EMPTY${candidate?.finishReason ? '_' + candidate.finishReason : ''}`);
    
    // Extract and clean JSON
    const cleanedJson = extractJson(text);
    
    try {
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      // Log the problematic JSON for debugging
      console.error('[Gemini] JSON parse failed. Raw response:', text.slice(0, 1000));
      console.error('[Gemini] Cleaned JSON:', cleanedJson.slice(0, 1000));
      throw new Error(`GEMINI_INVALID_JSON: ${parseError.message}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text) {
  // Remove code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = fenced ? fenced[1] : text;
  
  // Find the first JSON object or array
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('LLM_NO_JSON');
  raw = raw.slice(start);
  
  // Try to find the matching closing bracket
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  
  if (end === -1) {
    // Couldn't find proper end, just return from start
    return raw;
  }
  
  return raw.slice(0, end);
}

