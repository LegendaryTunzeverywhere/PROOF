import { useEffect, useRef, useState } from 'react';

interface LanguageSpeechPracticeProps {
  target: string;
  meaning?: string;
  language: string;
  value?: string;
  onChange?: (transcript: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const localeFor = (language: string) => ({
  fr: 'fr-FR', es: 'es-ES', de: 'de-DE', pt: 'pt-PT', zh: 'zh-CN',
}[language] || language || 'en-US');

export interface SpeechPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  onAudio?: (audio: HTMLAudioElement | null) => void;
}

const waitForVoices = (synthesis: SpeechSynthesis, timeoutMs = 350) => new Promise<SpeechSynthesisVoice[]>((resolve) => {
  const initial = synthesis.getVoices();
  if (initial.length > 0) {
    resolve(initial);
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    synthesis.removeEventListener('voiceschanged', finish);
    window.clearTimeout(timeout);
    resolve(synthesis.getVoices());
  };
  const timeout = window.setTimeout(finish, timeoutMs);
  synthesis.addEventListener('voiceschanged', finish, { once: true });
});

const playServerAudio = async (text: string, lang: string, speed: number, callbacks: SpeechPlaybackCallbacks) => {
  const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&speed=${speed}`);
  audio.preload = 'auto';
  callbacks.onAudio?.(audio);

  return new Promise<void>((resolve, reject) => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      callbacks.onStart?.();
    };
    audio.onplay = start;
    audio.onended = () => {
      callbacks.onAudio?.(null);
      callbacks.onEnd?.();
      resolve();
    };
    audio.onerror = (event) => {
      callbacks.onAudio?.(null);
      reject(event);
    };

    audio.play().then(() => {
      // Some WebViews resolve play() without dispatching play immediately.
      start();
    }).catch((error) => {
      callbacks.onAudio?.(null);
      reject(error);
    });
  });
};

const speakNativeLanguageText = async (text: string, language: string, speed: number, callbacks: SpeechPlaybackCallbacks) => {
  const locale = localeFor(language);
  const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  if (!synthesis || typeof window.SpeechSynthesisUtterance !== 'function') throw new Error('Native speech is unavailable.');
  const voices = await waitForVoices(synthesis);
  const voice = voices.find((candidate) => candidate.lang.toLowerCase() === locale.toLowerCase())
    || voices.find((candidate) => candidate.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()));
  if (!voice) throw new Error(`No native voice is available for ${locale}.`);

  synthesis.cancel();
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let started = false;
    let watchdog = 0;
    const settle = (error?: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      if (error) reject(error);
      else resolve();
    };
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.voice = voice;
    utterance.rate = 0.78 * speed;
    utterance.pitch = 1;
    utterance.onstart = () => {
      started = true;
      callbacks.onStart?.();
      window.clearTimeout(watchdog);
    };
    utterance.onend = () => {
      callbacks.onEnd?.();
      settle();
    };
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') settle(event);
    };
    if (synthesis.paused) synthesis.resume();
    synthesis.speak(utterance);
    watchdog = window.setTimeout(() => {
      if (!started) settle(new Error('Native speech did not start.'));
    }, 900);
  });
};

export async function speakLanguageText(text: string, language: string, speed = 1, callbacks: SpeechPlaybackCallbacks = {}) {
  const locale = localeFor(language);
  try {
    await playServerAudio(text, locale, speed, callbacks);
  } catch (piperError) {
    try {
      await speakNativeLanguageText(text, language, speed, callbacks);
    } catch (nativeError) {
      callbacks.onError?.(nativeError || piperError);
      throw nativeError || piperError;
    }
  }
}

const normalizeSpeech = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019'`]/g, ' ')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/["“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSpeechStatus = (target: string, transcript: string) => {
  const targetText = normalizeSpeech(target);
  const spokenText = normalizeSpeech(transcript);

  if (!spokenText) return { status: 'idle', message: 'Your transcript will appear here.' };
  if (targetText === spokenText) {
    return { status: 'correct', message: 'Correct — you matched the target phrase.' };
  }

  const targetWords = targetText.split(' ').filter(Boolean);
  const spokenWords = spokenText.split(' ').filter(Boolean);
  if (!targetWords.length || !spokenWords.length) {
    return { status: 'incorrect', message: 'Not quite — try the phrase one more time.' };
  }

  const overlap = targetWords.filter((word) => spokenWords.includes(word)).length;
  const score = overlap / Math.max(targetWords.length, spokenWords.length);

  if (score >= 0.9) {
    return { status: 'correct', message: 'Correct — close match.' };
  }
  if (score >= 0.6) {
    return { status: 'close', message: 'Close — listen again and match the phrase more closely.' };
  }

  return { status: 'incorrect', message: 'Not quite — try the phrase one more time.' };
};

export function LanguageSpeechPractice({
  target,
  meaning,
  language,
  value = '',
  onChange,
  disabled = false,
  compact = false,
}: LanguageSpeechPracticeProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localTranscript, setLocalTranscript] = useState(value);
  const [displayedTranscript, setDisplayedTranscript] = useState(value);
  const transcript = onChange ? value : localTranscript;
  const speechFeedback = transcript ? getSpeechStatus(target, transcript) : { status: 'idle', message: 'Your transcript will appear here.' };

  useEffect(() => {
    setLocalTranscript(value);
  }, [value]);

  useEffect(() => {
    if (!transcript) {
      setDisplayedTranscript('');
      return;
    }

    let frame = 0;
    setDisplayedTranscript('');
    const timeout = window.setInterval(() => {
      frame += 1;
      setDisplayedTranscript(transcript.slice(0, frame));
      if (frame >= transcript.length) {
        window.clearInterval(timeout);
      }
    }, 24);

    return () => window.clearInterval(timeout);
  }, [transcript]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
  }, []);

  const listen = async (speed = 1) => {
    setError(null);
    audioRef.current?.pause();
    try {
      await speakLanguageText(target, language, speed, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false);
          setError('Audio playback failed. Tap the speaker button again.');
        },
        onAudio: (audio) => {
          audioRef.current = audio;
        },
      });
    } catch {
      setSpeaking(false);
      setError('Audio playback failed. Tap the speaker button again.');
    }
  };

  const speak = () => {
    setError(null);
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor | undefined;
    if (!Recognition) {
      setSupported(false);
      setError('Speech recognition is not supported here. Try Chrome or Edge on a secure connection.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = localeFor(language);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const spoken = Array.from(event.results || []).map((result: any) => result[0]?.transcript || '').join(' ').trim();
      setLocalTranscript(spoken);
      onChange?.(spoken);
    };
    recognition.onerror = (event: any) => {
      setError(event.error === 'not-allowed' ? 'Microphone access was blocked. Allow it and try again.' : 'We could not hear that clearly. Try once more.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <div className={`rounded-2xl border border-brand/20 bg-brand-soft/30 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Listen & speak</p>
          <p className="mt-1 text-lg font-bold text-ink">{target}</p>
          {meaning && <p className="mt-1 text-sm text-muted">{meaning}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => listen()}
            disabled={disabled}
            aria-label={speaking ? 'Stop audio' : 'Listen to the phrase'}
            title={speaking ? 'Stop audio' : 'Listen to the phrase'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brand/30 bg-surface text-lg text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
          </button>
          <button
            type="button"
            onClick={() => listen(0.65)}
            disabled={disabled}
            aria-label="Listen slowly"
            title="Listen slowly"
            className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border border-brand/30 bg-surface px-3 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            <span aria-hidden="true">🐢</span>
            Slow
          </button>
          <button
            type="button"
            onClick={speak}
            disabled={disabled || !supported}
            aria-label={listening ? 'Stop listening' : 'Say it aloud'}
            title={listening ? 'Stop listening' : 'Say it aloud'}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-lg text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              listening
                ? 'bg-bad shadow-[0_0_0_4px_rgba(239,68,68,0.16)]'
                : 'bg-brand hover:bg-brand-deep'
            }`}
          >
            {listening && <span className="absolute inset-0 animate-ping rounded-lg bg-bad/50" aria-hidden="true" />}
            <span className="relative" aria-hidden="true">{listening ? '⏹' : '🎤'}</span>
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {listening && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-bad" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-bad" aria-hidden="true" />
            Recording… tap the microphone to stop
          </span>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          <span className="font-medium text-ink">Heard:</span> “{displayedTranscript || (listening ? 'Listening…' : 'Your transcript will appear here.') }”
        </span>
        <span
          className={`text-sm font-semibold ${
            speechFeedback.status === 'correct'
              ? 'text-ok'
              : speechFeedback.status === 'close'
              ? 'text-warn'
              : speechFeedback.status === 'incorrect'
              ? 'text-bad'
              : 'text-muted'
          }`}
        >
          {speechFeedback.message}
        </span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
