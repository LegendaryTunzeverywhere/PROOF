import { languageSpeechTargets } from '../server/ai/engine.js';

const baseUrl = String(process.env.TTS_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const speeds = [1, 0.65];
const targets = languageSpeechTargets();
const jobs = [...new Map(
  targets.flatMap(({ language, text }) => speeds.map((speed) => [`${language}\0${speed}\0${text}`, { language, text, speed }]))
).values()];

console.log(`Prewarming ${jobs.length} Piper files at ${baseUrl}`);
let completed = 0;
for (const job of jobs) {
  const url = `${baseUrl}/api/tts?text=${encodeURIComponent(job.text)}&lang=${encodeURIComponent(job.language)}&speed=${job.speed}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${job.language} ${job.speed} ${job.text}`);
  const bytes = (await response.arrayBuffer()).byteLength;
  completed += 1;
  console.log(`[${completed}/${jobs.length}] ${job.language} speed=${job.speed} ${bytes} bytes ${job.text}`);
}

console.log(`Prewarmed ${completed} files.`);