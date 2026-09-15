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
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localTranscript, setLocalTranscript] = useState(value);
  const transcript = onChange ? value : localTranscript;

  useEffect(() => {
    setLocalTranscript(value);
  }, [value]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const listen = () => {
    setError(null);
    if (!('speechSynthesis' in window)) {
      setError('Audio playback is not available in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(target);
    utterance.lang = localeFor(language);
    utterance.rate = 0.78;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
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
        <button type="button" onClick={listen} disabled={disabled} className="rounded-lg border border-brand/30 bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-50">
          Listen
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={speak} disabled={disabled || !supported} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60">
          {listening ? 'Listening… stop' : 'Say it aloud'}
        </button>
        <span className="text-sm text-muted">{transcript ? `Heard: “${transcript}”` : 'Your transcript will appear here.'}</span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
