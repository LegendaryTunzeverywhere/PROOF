import { XIcon } from './Icons';

type ShareOnXButtonProps = {
  text: string;
  url?: string;
  label?: string;
  className?: string;
};

export function ShareOnXButton({ text, url = window.location.href, label = 'Share on X', className = '' }: ShareOnXButtonProps) {
  const share = () => {
    const intentUrl = new URL('https://twitter.com/intent/tweet');
    intentUrl.searchParams.set('text', text);
    if (url) intentUrl.searchParams.set('url', url);
    window.open(intentUrl.toString(), '_blank', 'noopener,noreferrer,width=600,height=520');
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 font-semibold text-ink transition-colors hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-brand/40 ${className}`}
      aria-label={label}
    >
      <XIcon className="h-4 w-4" />
      {label}
    </button>
  );
}