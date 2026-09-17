import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { PathDetailView } from '../components/PathDetailView';
import { LessonView } from '../components/LessonView';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pathsService } from '../services/paths.service';
import { skillsService } from '../services/skills.service';
import type { LearningPath, SkillCatalog } from '../types/api';

const LANGUAGE_OPTIONS = [
  { name: 'French', nativeName: 'Français', code: 'FR' },
  { name: 'Spanish', nativeName: 'Español', code: 'ES' },
  { name: 'German', nativeName: 'Deutsch', code: 'DE' },
  { name: 'Portuguese', nativeName: 'Português', code: 'PT' },
  { name: 'Mandarin', nativeName: '中文', code: 'ZH' },
];

export function LearnPage() {
  const params = useParams<{ id?: string; pathId?: string; skill?: string; topic?: string }>();
  
  // Get pathId from either 'id' or 'pathId' param (depending on route)
  const pathId = params.id || params.pathId;
  const skill = params.skill;
  const topic = params.topic;

  // If there's a pathId in the URL, show path detail
  if (pathId && !topic) {
    return <PathDetailView pathId={pathId} />;
  }

  // If there's a topic, show lesson
  if (pathId && skill && topic) {
    return <LessonView pathId={pathId} skill={skill} topic={topic} />;
  }

  // Otherwise show the main learning hub
  return <LearnHubView />;
}

function LearnHubView() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [catalog, setCatalog] = useState<SkillCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [createTimeout, setCreateTimeout] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadData();
  }, [user?.id, authLoading]);
  
  // Timeout for path creation (30 seconds)
  useEffect(() => {
    if (!creating) {
      setCreateTimeout(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setCreateTimeout(true);
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [creating]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pathsRes, catalogRes] = await Promise.all([
        pathsService.getPaths(),
        skillsService.getCatalog(),
      ]);
      setPaths(pathsRes.paths);
      setCatalog(catalogRes.catalog);
    } catch (err: any) {
      console.error('Failed to load learn data:', err);
      setError(err.message || 'Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goal = goalInput.trim();
    if (goal.length < 3) {
      setCreateError('Please enter a learning goal (at least 3 characters)');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      
      const result = await pathsService.createPath({
          style: user?.prefs?.style || 'practical',
        goal,
        level: user?.prefs?.level || 'beginner',
        minutesPerDay: user?.prefs?.minutesPerDay || 30,
      });
      
      // Refresh paths and close modal
      await loadData();
      setShowCreateModal(false);
      setGoalInput('');
      
      // Navigate to the new path
      navigate(`/learn/path/${result.path.id}`);
    } catch (err: any) {
      console.error('Failed to create path:', err);
      setCreateError(err.message || 'Failed to create learning path');
    } finally {
      setCreating(false);
    }
  };

  const handleSkillClick = async (skill: SkillCatalog) => {
    // Prevent duplicate clicks
    if (creating) return;

    if (skill.slug === 'languages') {
      setShowLanguagePicker(true);
      return;
    }
    
    const goal = `I want to learn ${skill.name.toLowerCase()}`;
    setGoalInput(goal);
    
    try {
      setCreating(true);
      setCreateError(null);
      
      const result = await pathsService.createPath({
        goal,
          style: user?.prefs?.style || 'practical',
        domain: skill.slug,
        level: user?.prefs?.level || 'beginner',
        minutesPerDay: user?.prefs?.minutesPerDay || 30,
      });
      
      // Stay in BrowserRouter; a hash URL here becomes /learn#/learn/path/:id.
      navigate(`/learn/path/${result.path.id}`);
    } catch (err: any) {
      console.error('Failed to create path:', err);
      setCreateError(err.message || 'Failed to create learning path');
      setCreating(false);
    }
  };

  const handleLanguageSelect = async (language: (typeof LANGUAGE_OPTIONS)[number]) => {
    if (creating) return;

    try {
      setShowLanguagePicker(false);
      setCreating(true);
      setCreateError(null);
      const result = await pathsService.createPath({
        goal: `I want to learn ${language.name}`,
          style: user?.prefs?.style || 'practical',
        domain: 'languages',
        level: user?.prefs?.level || 'beginner',
        minutesPerDay: user?.prefs?.minutesPerDay || 30,
      });
      navigate(`/learn/path/${result.path.id}`);
    } catch (err: any) {
      console.error('Failed to create language path:', err);
      setCreateError(err.message || 'Failed to create learning path');
      setCreating(false);
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
        <p className="text-muted">{t.learn.pleaseLogin}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">{t.learn.failedToLoad}</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          {t.learn.retry}
        </button>
      </div>
    );
  }

  const streak = user.streak;
  const formatNim = (amount: number) => amount.toFixed(1);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">{t.learn.learning}</h1>
        </div>
      </Reveal>

      {/* Streak Widget */}
      {streak.current > 0 && (
        <Reveal delay={0.05}>
          <div
            className="rounded-2xl border p-4 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(35, 173, 153, 0.1) 0%, #FFF 100%)',
              borderColor: 'rgba(35, 173, 153, 0.35)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{streak.emoji}</span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-base font-semibold text-ink">{t.learn.streakCurrent.replace('{count}', String(streak.current))}</span>
                  {streak.atRisk && (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">
                        {t.learn.atRisk}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  {streak.atRisk
                    ? t.learn.streakAlive
                    : t.learn.streakStrong.replace('{count}', String(streak.current))}
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: streak.atRisk ? 'var(--warn)' : 'var(--ok)' }}
                >
                  {streak.current}
                </div>
                <div className="text-xs text-muted">{t.learn.days}</div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Your Paths Section */}
      {paths.length > 0 && (
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t.learn.yourPaths}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/learn/upload')}
                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-600"
                >
                  📄 {t.learn.upload}
                </button>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft/80"
                >
                  ✨ {t.learn.new}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {paths.map((path) => (
                <Link
                  key={path.id}
                  to={`/learn/path/${path.id}`}
                  className="block rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-brand hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-sm font-medium text-brand">
                      {path.skillEmoji} {path.skillName}
                    </span>
                    <span className="whitespace-nowrap text-sm text-muted">
                      {path.days.length} days · {formatNim(path.rewardNim)} NIM
                    </span>
                  </div>
                  <div className="mt-2 text-base font-bold text-ink">{path.title}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-500"
                        style={{ width: `${path.percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-brand">{path.percent}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Empty State - No Paths */}
      {paths.length === 0 && (
        <Reveal delay={0.1}>
          <div
            className="rounded-2xl p-7 shadow-hero"
            style={{
              background: 'var(--grad-hero)',
            }}
          >
            <div className="mb-2.5 text-4xl leading-none">✨</div>
            <h2 className="text-xl font-bold text-white">{t.learn.startJourney}</h2>
            <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-white/90">
              {t.learn.startJourneyBody}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button 
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 font-semibold text-ink shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
                onClick={() => setShowCreateModal(true)}
              >
                <span className="text-lg">✨</span> {t.learn.createPath}
              </button>
              <button 
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-brand-hover sm:w-auto"
                onClick={() => navigate('/learn/upload')}
              >
                <span className="text-lg">📄</span> {t.learn.uploadDocument}
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {/* Explore Skills Section */}
      <Reveal delay={0.15}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {paths.length > 0 ? t.learn.exploreSkills : t.learn.orPickSkill}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((skill) => (
              <button
                key={skill.slug}
                type="button"
                onClick={() => handleSkillClick(skill)}
                disabled={creating}
                className="group rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:border-brand hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="text-3xl leading-none">{skill.emoji}</div>
                <div className="mt-2 text-[15px] font-bold text-ink">{skill.name}</div>
                <div className="mt-1 text-sm text-muted">{skill.description}</div>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Create Path Modal */}
      {showLanguagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="language-picker-title">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="language-picker-title" className="text-xl font-bold text-ink">{t.learn.chooseLanguage}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t.learn.languagePrompt}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguagePicker(false)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
                aria-label="Close language picker"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {LANGUAGE_OPTIONS.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageSelect(language)}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-line bg-elevated px-4 py-3 text-left transition-all hover:border-brand hover:bg-brand-soft focus-visible:border-brand"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface font-display text-xs font-bold tracking-wide text-brand">{language.code}</span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{language.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{language.nativeName}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Reveal>
            <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">{t.learn.createLearningPath}</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setGoalInput('');
                  }}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
                  disabled={creating}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreatePath}>
                <label className="block">
                  <span className="block text-sm font-semibold text-ink mb-2">
                    {t.learn.whatLearn}
                  </span>
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => {
                      setGoalInput(e.target.value);
                      setCreateError(null);
                    }}
                    placeholder="e.g., Build responsive websites, Master Python, Learn French..."
                    className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm font-medium text-ink outline-none transition-all duration-200 placeholder:font-normal placeholder:text-muted/85 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand-soft"
                    disabled={creating}
                    autoFocus
                  />
                </label>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted mb-2">{t.learn.quickPicks}</p>
                  <div className="flex flex-wrap gap-2">
                    {catalog.slice(0, 6).map((skill) => (
                      <button
                        key={skill.slug}
                        type="button"
                        onClick={() => setGoalInput(`I want to learn ${skill.name.toLowerCase()}`)}
                        disabled={creating}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-brand hover:bg-brand-soft hover:text-brand disabled:opacity-60"
                      >
                        {skill.emoji} {skill.name}
                      </button>
                    ))}
                  </div>
                </div>

                {createError && (
                  <div className="mt-4 rounded-lg bg-bad-soft p-3 text-sm text-bad">
                    {createError}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                      setGoalInput('');
                    }}
                    disabled={creating}
                    className="flex-1 rounded-xl border-2 border-line bg-surface px-4 py-3 text-sm font-semibold text-ink transition-all hover:border-brand hover:bg-elevated disabled:opacity-60"
                  >
                    {t.learn.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={creating || goalInput.trim().length < 3}
                    className="flex-1 rounded-xl bg-gradient-to-b from-brand to-brand-deep px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-[2px] hover:from-brand-hover hover:to-brand disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {creating ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        {t.learn.creating}
                      </>
                    ) : (
                      `✨ ${t.learn.createPath}`
                    )}
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-muted">
                  {t.learn.aiWillGenerate}
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      )}

      {/* Creating overlay when clicking skill */}
      {creating && !showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-2xl max-w-md mx-4">
            <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-4 text-lg font-semibold text-ink">{t.learn.creatingYourPath}</p>
            <p className="mt-2 text-sm text-muted">{t.learn.creatingYourPathBody}</p>
            
            {!createTimeout ? (
              <>
                <div className="mt-4 space-y-2 text-xs text-muted">
                  <p>✨ Building curriculum structure</p>
                  <p>📚 Creating daily lessons</p>
                  <p>🎯 Generating proof challenges</p>
                </div>
                <p className="mt-4 text-xs text-faint">This usually takes 10-20 seconds</p>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning">
                  <p className="font-semibold">⏱️ {t.learn.takingLonger}</p>
                  <p className="mt-1 text-xs">{t.learn.stillWorking}</p>
                </div>
                <button
                  onClick={() => {
                    setCreating(false);
                    setCreateTimeout(false);
                  }}
                  className="mt-4 rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium text-ink hover:bg-elevated"
                >
                  {t.learn.cancel}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
