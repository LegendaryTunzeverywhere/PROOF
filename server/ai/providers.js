/**
 * LLM provider — Google Gemini (Generative Language API).
 *
 * Used only when AI_API_KEY is configured (AI_PROVIDER=auto|gemini).
 * JSON mode via responseMimeType, hard timeout, errors thrown to the
 * caller (AIService falls back to the local ProofEngine on ANY failure).
 */
import { config } from '../config.js';

const TIMEOUT_MS = 20_000;

export const llmEnabled = () =>
  (config.ai.provider === 'gemini' || config.ai.provider === 'auto') &&
  !!config.ai.apiKey;

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

function modelCandidates() {
  const primary = config.ai.model;
  const rest = FALLBACK_MODELS.filter((m) => m !== primary);
  return primary ? [primary, ...rest] : rest;
}

export async function llmJson({ system, prompt, maxTokens = 900 }) {
  if (!llmEnabled()) throw new Error('LLM_NOT_CONFIGURED');
  const models = modelCandidates();
  let lastErr;
  for (const model of models) {
    try {
      return await callGemini({ system, prompt, maxTokens, model });
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      // 404 = retired/unknown model id — try the next candidate.
      if (/GEMINI_HTTP_404|not found|NOT_FOUND/i.test(msg)) {
        console.warn(`[gemini] model ${model} 404 — trying fallback`);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error('GEMINI_NO_MODEL');
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
    return JSON.parse(extractJson(text));
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('LLM_NO_JSON');
  return raw.slice(start);
}
