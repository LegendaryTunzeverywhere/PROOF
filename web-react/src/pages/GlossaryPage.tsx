import { useState, useEffect } from 'react';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { glossaryService } from '../services/glossary.service';
import type { GlossaryTerm } from '../types/api';

type Level = 'all' | 'beginner' | 'intermediate' | 'expert';

export function GlossaryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeLevel, setActiveLevel] = useState<Level>('all');
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ term: '', definition: '', level: 'beginner' as Exclude<Level, 'all'>, source: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadTerms();
  }, [user?.id, authLoading]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await glossaryService.getTerms();
      setTerms(response.terms);
    } catch (err: any) {
      console.error('Failed to load glossary:', err);
      setError(err.message || 'Failed to load glossary');
    } finally {
      setLoading(false);
    }
  };

  const saveTerm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.term.trim() || !draft.definition.trim()) return;
    try {
      setSaving(true);
      const { term } = await glossaryService.createTerm({
        term: draft.term.trim(), definition: draft.definition.trim(), level: draft.level,
        source: draft.source.trim() || null,
      });
      setTerms((current) => [term, ...current]);
      setDraft({ term: '', definition: '', level: 'beginner', source: '' });
      setFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'Could not save this term. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTerm = async (id: string) => {
    try {
      await glossaryService.deleteTerm(id);
      setTerms((current) => current.filter((term) => term.id !== id));
    } catch (err: any) {
      setError(err.message || 'Could not remove this term. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted">{t.nav.glossary}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">{t.common.error}</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadTerms}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredTerms = activeLevel === 'all' 
    ? terms 
    : terms.filter((t) => t.level === activeLevel);

  const beginnerCount = terms.filter((t) => t.level === 'beginner').length;
  const intermediateCount = terms.filter((t) => t.level === 'intermediate').length;
  const expertCount = terms.filter((t) => t.level === 'expert').length;

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner':
        return { emoji: '🌱', label: 'Beginner', class: 'bg-ok-soft text-ok' };
      case 'intermediate':
        return { emoji: '🌿', label: 'Intermediate', class: 'bg-brand-soft text-brand' };
      case 'expert':
        return { emoji: '🌳', label: 'Expert', class: 'bg-gold/10 text-gold' };
      default:
        return { emoji: '📖', label: 'Unknown', class: 'bg-surface-2 text-muted' };
    }
  };

  // Group terms by level when showing all
  const groupedTerms = activeLevel === 'all' ? {
    beginner: terms.filter((t) => t.level === 'beginner'),
    intermediate: terms.filter((t) => t.level === 'intermediate'),
    expert: terms.filter((t) => t.level === 'expert'),
  } : null;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">{t.nav.glossary}</h1>
            <p className="mt-2 text-base text-muted">
              Your personal vocabulary · {terms.length} terms
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Add Term
          </button>
        </div>
      </Reveal>

      {/* Level Filters */}
      <Reveal delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveLevel('all')}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeLevel === 'all'
                ? 'bg-ink text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            All ({terms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveLevel('beginner')}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeLevel === 'beginner'
                ? 'bg-ok text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            🌱 Beginner ({beginnerCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveLevel('intermediate')}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeLevel === 'intermediate'
                ? 'bg-brand text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            🌿 Intermediate ({intermediateCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveLevel('expert')}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeLevel === 'expert'
                ? 'bg-gold text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            🌳 Expert ({expertCount})
          </button>
        </div>
      </Reveal>

      {/* Terms Display */}
      {terms.length > 0 ? (
        <>
          {/* Grouped by Level (All) */}
          {activeLevel === 'all' && groupedTerms && (
            <>
              {Object.entries(groupedTerms).map(([level, terms]) => {
                if (terms.length === 0) return null;
                const badge = getLevelBadge(level);
                return (
                  <Reveal key={level} delay={0.1}>
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                        <span>{badge.emoji}</span>
                        {badge.label}
                      </h3>
                      <div className="space-y-2">
                        {terms.map((term) => (
                          <div
                            key={term.id}
                            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}>
                                    {badge.emoji} {badge.label}
                                  </span>
                                </div>
                                <h4 className="mt-2 text-base font-bold text-ink">{term.term}</h4>
                                <p className="mt-1 text-sm text-muted">{term.definition}</p>
                                {term.source && (
                                  <p className="mt-2 text-xs text-muted">From: {term.source}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                className="shrink-0 text-muted transition-colors hover:text-bad"
                                aria-label={`Delete ${term.term}`}
                                onClick={() => deleteTerm(term.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </>
          )}

          {/* Filtered List (Single Level) */}
          {activeLevel !== 'all' && (
            <Reveal delay={0.1}>
              <div className="space-y-2">
                {filteredTerms.map((term) => {
                  const badge = getLevelBadge(term.level);
                  return (
                    <div
                      key={term.id}
                      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}>
                              {badge.emoji} {badge.label}
                            </span>
                          </div>
                          <h4 className="mt-2 text-base font-bold text-ink">{term.term}</h4>
                          <p className="mt-1 text-sm text-muted">{term.definition}</p>
                          {term.source && (
                            <p className="mt-2 text-xs text-muted">From: {term.source}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-muted transition-colors hover:text-bad"
                                aria-label={`Delete ${term.term}`}
                                onClick={() => deleteTerm(term.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          )}
        </>
      ) : (
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <div className="mb-3 text-4xl">📖</div>
            <h3 className="text-lg font-semibold text-ink">Your glossary is empty</h3>
            <p className="mt-2 text-sm text-muted">
              Add terms you're learning to build your personal vocabulary
            </p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Add your first term
            </button>
          </div>
        </Reveal>
      )}

      {formOpen && (
        <form onSubmit={saveTerm} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink">Add a glossary term</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={draft.term} maxLength={100} required onChange={(e) => setDraft({ ...draft, term: e.target.value })} placeholder="Term" className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft" />
            <select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as Exclude<Level, 'all'> })} className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand">
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option>
            </select>
          </div>
          <textarea value={draft.definition} maxLength={1000} required onChange={(e) => setDraft({ ...draft, definition: e.target.value })} placeholder="Definition" className="mt-3 min-h-24 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft" />
          <input value={draft.source} maxLength={100} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Source (optional)" className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
          <div className="mt-4 flex gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save term'}</button><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted hover:bg-elevated">Cancel</button></div>
        </form>
      )}
    </div>
  );
}
