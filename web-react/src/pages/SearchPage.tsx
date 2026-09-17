import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Reveal } from '../components/Reveal';
import { searchService, type SearchResult } from '../services/search.service';
import { useLanguage } from '../context/LanguageContext';

const labels: Record<SearchResult['type'], string> = {
  skill: 'Skill',
  path: 'Learning path',
  proof: 'Proof',
};

export function SearchPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void searchService.search(query)
      .then((response) => { if (!cancelled) setResults(response.results); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Search is unavailable right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-2">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">{t.common.searchAria.split(',')[0]}</h1>
          <p className="mt-2 text-base text-muted">{query ? <>Results for <span className="font-semibold text-ink">“{query}”</span></> : t.common.searchPlaceholder}</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="rounded-2xl border border-line bg-surface shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-10 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" /> Searching…</div>
          ) : error ? (
            <div className="p-8 text-center"><p className="text-bad">{error}</p><Link to="/home" className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-deep">{t.nav.home}</Link></div>
          ) : results.length ? (
            <ul className="divide-y divide-line">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.to}-${index}`}>
                  <Link to={result.to} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><MagnifyingGlassIcon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink group-hover:text-brand">{result.title}</span><span className="mt-0.5 block truncate text-sm text-muted">{result.detail}</span></span>
                    <span className="text-xs font-bold text-faint">{labels[result.type]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center"><MagnifyingGlassIcon className="mx-auto h-8 w-8 text-faint" /><p className="mt-3 font-semibold text-ink">{query ? 'No matches yet' : 'Start with a search'}</p><p className="mt-1 text-sm text-muted">{query ? 'Try a skill, path title, or proof topic.' : 'Use the search field above or press Ctrl K.'}</p></div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
