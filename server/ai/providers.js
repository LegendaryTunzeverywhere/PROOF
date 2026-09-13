/**
 * LLM providers — Google Gemini and Groq
 *
 * Groq is used first (fast and free), with Gemini as fallback.
 * JSON mode via responseMimeType (Gemini) or response_format (Groq).
 */
import { config } from '../config.js';

const TIMEOUT_MS = 60_000; // Increased to 60 seconds for document analysis

export const llmEnabled = () =>
  (config.ai.provider === 'gemini' || config.ai.provider === 'groq' || config.ai.provider === 'auto') &&
  (!!config.ai.apiKey || !!config.ai.groqApiKey);

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

const GROQ_MODELS = [
  'groq/compound',              // Primary model - high token limit, no rate limit
  'qwen/qwen3.8-27b',          // Backup if compound fails
  'openai/gpt-oss-120b',       // Additional backup
];

function modelCandidates() {
  const primary = config.ai.model;
  const rest = GEMINI_FALLBACK_MODELS.filter((m) => m !== primary);
  return primary ? [primary, ...rest] : rest;
}

export async function llmJson({ system, prompt, maxTokens = 900 }) {
  if (!llmEnabled()) throw new Error('LLM_NOT_CONFIGURED');
  
  // Only use Groq - with retry logic for rate limits
  if (config.ai.groqApiKey) {
    console.log('[LLM] Using Groq only (no fallback)');
    
    // Retry up to 3 times with exponential backoff for rate limits
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await callGroq({ system, prompt, maxTokens });
      } catch (e) {
        lastError = e;
        const isRateLimit = /rate.limit|429/i.test(e.message);
        
        if (isRateLimit && attempt < 3) {
          // Extract wait time from error message or use exponential backoff
          const waitMatch = e.message.match(/try again in ([\d.]+)s/);
          const waitTime = waitMatch 
            ? Math.ceil(parseFloat(waitMatch[1]) * 1000) 
            : Math.pow(2, attempt) * 5000; // 10s, 20s
          
          console.warn(`[LLM] Rate limit hit (attempt ${attempt}/3), waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // For non-rate-limit errors or final attempt, throw immediately
        throw e;
      }
    }
    
    throw lastError;
  }

  if (config.ai.apiKey) {
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

async function callGroq({ system, prompt, maxTokens }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  
  try {
    const model = GROQ_MODELS[0]; // Use the best model
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const requestBody = {
      model,
      messages: [
        { role: 'system', content: system + '\n\nRespond with ONLY valid JSON matching the requested schema.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' } // Force JSON output
    };
    
    console.log('[Groq] Request:', { model, url, hasApiKey: !!config.ai.groqApiKey });
    
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.groqApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[Groq] Error response:', detail.slice(0, 500));
      throw new Error(`GROQ_HTTP_${res.status}: ${detail.slice(0, 160)}`);
    }
    
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    
    if (!text) {
      console.error('[Groq] Empty response:', data);
      throw new Error('GROQ_EMPTY_RESPONSE');
    }
    
    console.log('[Groq] Success! Response length:', text.length);
    
    // Parse JSON
    const cleanedJson = extractJson(text);
    try {
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[Groq] JSON parse failed. Raw:', text.slice(0, 500));
      throw new Error(`GROQ_INVALID_JSON: ${parseError.message}`);
    }
  } finally {
    clearTimeout(timer);
  }
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

