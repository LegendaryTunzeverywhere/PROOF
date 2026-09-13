import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { DailyChallenge } from '../components/DailyChallenge';
import { TrendingProofs } from '../components/TrendingProofs';
import { ArrowRightIcon, CheckIcon, ProveIcon, TrophyIcon } from '../components/Icons';
import { ChessProofBoard, type ChessProofPayload } from '../components/chess/ChessProofBoard';
import { CodeEditor } from '../components/CodeEditor';
import { TypeOnlyInput } from '../components/TypeOnlyInput';
import { useAuth } from '../context/AuthContext';
import { pathsService } from '../services/paths.service';
import { challengesService } from '../services/challenges.service';
import type { LearningPath, SponsoredChallenge, Challenge, Attempt } from '../types/api';

export function ProvePage() {
  const params = useParams<{ id?: string }>();
  const { id: challengeId } = params;
  
  // If there's a challengeId in the URL, show challenge detail
  if (challengeId) {
    return <ChallengeDetailView challengeId={challengeId} />;
  }
  
  // Otherwise show the main prove hub
  return <ProveHubView />;
}

function ChallengeDetailView({ challengeId }: { challengeId: string }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const [code, setCode] = useState('');
  const proofStartedAt = useRef(Date.now());
  const typingEffort = useRef(0);
  const pasteAttempts = useRef(0);
  const [chessPayload, setChessPayload] = useState<ChessProofPayload>({ positions: [] });
  const { refreshUser } = useAuth();
  const isCodeProof = challenge?.type === 'html' || challenge?.type === 'js-static';
  const isChessProof = challenge?.type === 'chess';
  const responseLabel = isChessProof ? 'Chess proof board' : isCodeProof ? 'Your solution' : 'Your response';
  const requirements = Array.isArray(challenge?.requirements)
    ? challenge.requirements
    : String(challenge?.requirements || '').split(/\r?\n|\s*â€¢\s*/).map((item) => item.trim()).filter(Boolean);
  const onChessChange = useCallback((payload: ChessProofPayload) => setChessPayload(payload), []);

  const handleProofTextChange = (value: string) => {
    typingEffort.current += Math.max(1, Math.abs(value.length - code.length));
    setCode(value);
  };

  const resetTypingTelemetry = () => {
    proofStartedAt.current = Date.now();
    typingEffort.current = 0;
    pasteAttempts.current = 0;
  };

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle "daily" as a special case
      if (challengeId === 'daily') {
        const dailyRes = await challengesService.getTodayDaily();
        setChallenge(dailyRes.challenge);
        setAttemptId(dailyRes.attemptId);
      } else {
        const res = await challengesService.getChallenge(challengeId);
        setChallenge(res.challenge);
      }
    } catch (err: any) {
      console.error('Failed to load challenge:', err);
      setError(err.message || 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttempt = async () => {
    if (!challenge) {
      console.error('Cannot start attempt: challenge is null');
      setError('Challenge not loaded. Please refresh the page.');
      return;
    }
    
    if (!challenge.id) {
      console.error('Cannot start attempt: challenge.id is undefined', challenge);
      setError('Invalid challenge data. Please try another challenge.');
      return;
    }
    
    try {
      setError(null);
      resetTypingTelemetry();
      const res = await challengesService.startAttempt(challenge.id);
      setAttemptId(res.attemptId);
    } catch (err: any) {
      console.error('Failed to start attempt:', err);
      setError(err.message || 'Failed to start attempt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attemptId || (isChessProof ? !chessPayload.positions.length : !code.trim())) {
      setError(isChessProof ? 'Make at least one legal move on the board before submitting.' : `Write your ${isCodeProof ? 'solution' : 'response'} before submitting`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload: Record<string, unknown> = isChessProof ? chessPayload : isCodeProof ? { code } : { text: code };

      if (!isChessProof) {
        payload.meta = {
          effort: typingEffort.current,
          pastes: pasteAttempts.current,
          ms: Date.now() - proofStartedAt.current,
        };
      }
      
      // Add other fields based on challenge type
      if (challenge?.submissionFields?.includes('explanation')) {
        payload.explanation = 'Solution explanation'; // Could add another textarea
      }
      if (challenge?.submissionFields?.includes('text')) {
        payload.text = code;
      }
      
      const res = await challengesService.submitAttempt(attemptId, payload);
      setResult({ ...res.attempt, reward: res.reward });
      await refreshUser();
    } catch (err: any) {
      console.error('Failed to submit attempt:', err);
      setError(err.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Challenge not found</p>
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}
        <Link
          to="/prove"
          className="mt-4 inline-block rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Challenges
        </Link>
      </div>
    );
  }

  // Show result if submission was successful
  if (result) {
    const passed = result.status === 'passed';
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/prove"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated"
          >
            ← Back
          </Link>
        </div>

        <div className={`rounded-2xl border p-8 text-center ${passed ? 'border-ok bg-ok-soft' : 'border-warn bg-warn-soft'}`}>
          <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${passed ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'}`}>
            {passed ? <CheckIcon className="h-8 w-8" /> : <ProveIcon className="h-8 w-8" />}
          </div>
          <h2 className={`text-2xl font-bold ${passed ? 'text-ok' : 'text-warn'}`}>
            {passed ? 'Proof Passed!' : 'Keep Trying!'}
          </h2>
          <p className="mt-2 text-lg font-semibold text-ink">Score: {result.score}%</p>
          
          {result.reward?.granted && passed && (
            <p className="mt-3 text-base text-ink">
              +{result.reward.amountNim} NIM earned! 🎁
            </p>
          )}
          
          {challenge.xp && passed && (
            <p className="mt-2 text-sm text-muted">
              +{challenge.xp} XP
            </p>
          )}

          {result.feedback && (
            <div className="mt-6 rounded-lg bg-surface p-4 text-left">
              <h3 className="font-semibold text-ink">Feedback:</h3>
              <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{result.feedback}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-center">
            <Link
              to="/prove"
              className="rounded-lg border border-line bg-surface px-6 py-3 font-semibold text-ink transition-colors hover:bg-elevated"
            >
              Back to Challenges
            </Link>
            {!passed && (
              <button
                onClick={() => {
                  setResult(null);
                  setCode('');
                    resetTypingTelemetry();
                  setChessPayload({ positions: [] });
                  handleStartAttempt();
                }}
                className="rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/prove"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated"
        >
          ← Back
        </Link>
      </div>

      <Reveal>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ink">{challenge.title}</h1>
              {challenge.brief && (
                <p className="mt-2 text-base text-muted">{challenge.brief}</p>
              )}
              
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {challenge.timeMin && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1 text-sm text-muted">
                    ⏱ ~{challenge.timeMin} min
                  </span>
                )}
                {challenge.skillSlug && (
                  <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
                    {challenge.skillSlug}
                  </span>
                )}
              </div>
            </div>

            {challenge.rewardNim !== undefined && challenge.rewardNim > 0 && (
              <div className="rounded-xl bg-gold/10 px-4 py-2 text-center">
                <div className="text-2xl font-bold text-gold">{challenge.rewardNim}</div>
                <div className="text-xs text-muted">NIM</div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {requirements.length > 0 && (
        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">What to demonstrate</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {requirements.map((requirement, index) => (
                <li key={`${requirement}-${index}`} className="flex items-start gap-2 rounded-lg bg-elevated px-3 py-2.5 text-sm leading-relaxed text-ink">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}

      {!attemptId ? (
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
            {error ? (
              <>
                <div className="mb-4 rounded-lg bg-bad-soft p-4 text-bad">
                  {error}
                </div>
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/prove"
                    className="rounded-lg border border-line bg-surface px-6 py-2 font-semibold text-ink hover:bg-elevated"
                  >
                    Back to Challenges
                  </Link>
                  <button
                    onClick={() => {
                      setError(null);
                      loadChallenge();
                    }}
                    className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-deep"
                  >
                    Try Again
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">Start when you are ready. Your work is evaluated against the requirements above and rewards are issued only after a passing proof.</p>
                <button
                  onClick={handleStartAttempt}
                  disabled={!challenge || !challenge.id}
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-surface shadow-[0_10px_22px_-14px_rgba(3,2,2,.65)] transition-all hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Begin proof <ArrowRightIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink">{responseLabel}</h2>
              <p className="mt-1 text-sm text-muted">
                {isChessProof
                  ? 'Use the FEN board to make a real legal line. The AI coach evaluates the board after every move.'
                  : isCodeProof
                  ? 'Write your work directly here. Your proof is evaluated against the task requirements.'
                  : 'Write a complete response that addresses each requirement above.'}
              </p>
              {isChessProof ? (
                <ChessProofBoard challenge={challenge} disabled={submitting} onChange={onChessChange} />
              ) : (
                isCodeProof ? (
                  <CodeEditor
                    value={code}
                    onChange={handleProofTextChange}
                    onPasteAttempt={() => { pasteAttempts.current += 1; }}
                    placeholder="Write your code here..."
                    disabled={submitting}
                    className="mt-4"
                  />
                ) : (
                  <TypeOnlyInput
                    value={code}
                    onChange={handleProofTextChange}
                    onPasteAttempt={() => { pasteAttempts.current += 1; }}
                    type="textarea"
                    placeholder="Write your proof response here..."
                    rows={8}
                    disabled={submitting}
                    className="mt-4"
                  />
                )
              )}
              
              {error && (
                <div className="mt-4 rounded-lg bg-bad-soft p-3 text-sm text-bad">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || (isChessProof ? !chessPayload.positions.length : !code.trim())}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-surface shadow-[0_10px_22px_-14px_rgba(3,2,2,.65)] transition-all hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>{isChessProof ? 'Submit board proof' : 'Submit proof'} <ArrowRightIcon className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Reveal>
      )}
    </div>
  );
}

function ProveHubView() {
  const { user, loading: authLoading } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [sponsoredChallenges, setSponsoredChallenges] = useState<SponsoredChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadProveData();
  }, [user, authLoading]);

  const loadProveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pathsRes, sponsoredRes] = await Promise.all([
        pathsService.getPaths(),
        challengesService.getSponsoredChallenges().catch(() => ({ sponsored: [] })),
      ]);
      
      setPaths(pathsRes.paths);
      setSponsoredChallenges(sponsoredRes.sponsored);
    } catch (err: any) {
      console.error('Failed to load prove data:', err);
      setError(err.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
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
        <p className="text-muted">Please log in to view proof challenges</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load challenges</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadProveData}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatNim = (amount: number) => amount.toFixed(1);

  // Mock proof checkpoints from learning paths
  const proofCheckpoints = paths.flatMap((path) =>
    path.days.flatMap((day) =>
      day.items
        .filter((item) => item.kind !== 'study')
        .map((item) => ({
          ...item,
          dayIndex: day.day,
          skillEmoji: path.skillEmoji,
          pathId: path.id,
        }))
    )
  );

  const hasCheckpoints = proofCheckpoints.length > 0;

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">Prove Your Skills</h1>
          <p className="mt-2 text-base text-muted">
            Complete proof challenges to verify your knowledge and earn NIM rewards
          </p>
        </div>
      </Reveal>

      {/* Daily Proof - Prominent */}
      <Reveal delay={0.05}>
        <DailyChallenge />
      </Reveal>

      {/* Your Proof Checkpoints */}
      {hasCheckpoints && (
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <PanelHeader 
              title="Your Proof Checkpoints"
            />

            <div className="space-y-3">
              {proofCheckpoints.map((checkpoint, index) => {
                const attempt = checkpoint.attempt as { status: string; score: number } | null;
                const hasAttempt = attempt !== null && attempt !== undefined;
                const isPassed = hasAttempt && attempt.status === 'passed';
                const isFailed = hasAttempt && attempt.status !== 'passed';
                
                return (
                  <div
                    key={`${checkpoint.pathId}-${checkpoint.topic}-${index}`}
                    className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-brand hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xl">
                        {checkpoint.kind === 'final' ? <TrophyIcon className="h-5 w-5 text-gold" /> : <ProveIcon className="h-5 w-5 text-brand" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-ink">{checkpoint.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                              <span className="flex items-center gap-1">
                                {checkpoint.skillEmoji} Day {checkpoint.dayIndex}
                              </span>
                              <span>·</span>
                              <span>CHECKPOINT</span>
                              {checkpoint.estMin && (
                                <>
                                  <span>·</span>
                                  <span>~{checkpoint.estMin} min</span>
                                </>
                              )}
                              {checkpoint.rewardNim && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-gold">
                                    {formatNim(checkpoint.rewardNim)} NIM
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {attempt && (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                isPassed
                                  ? 'bg-ok-soft text-ok'
                                  : 'bg-bad-soft text-bad'
                              }`}
                            >
                            {isPassed ? 'Passed' : 'Scored'} {attempt.score}
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          {checkpoint.challengeId ? (
                            <Link
                              to={`/prove/challenge/${checkpoint.challengeId}`}
                              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition-all ${
                                isPassed
                                  ? 'bg-surface-2 text-muted hover:bg-elevated'
                                  : 'bg-ink text-surface shadow-[0_8px_18px_-12px_rgba(3,2,2,.62)] hover:-translate-y-0.5 hover:bg-brand active:translate-y-0'
                              }`}
                            >
                              {isPassed ? 'Review proof' : isFailed ? 'Try again' : 'Begin proof'}
                              {!isPassed && <ArrowRightIcon className="h-4 w-4" />}
                            </Link>
                          ) : (
                            <span className="inline-flex h-10 items-center rounded-lg bg-elevated px-4 text-sm font-medium text-muted">Preparing proof…</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Empty State for Checkpoints */}
      {!hasCheckpoints && (
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <ProveIcon className="mx-auto mb-3 h-10 w-10 text-brand" />
            <h3 className="text-lg font-semibold text-ink">No proofs queued yet</h3>
            <p className="mt-2 text-sm text-muted">
              Start a learning path to unlock proof checkpoints
            </p>
            <Link
              to="/learn"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Browse Learning Paths
            </Link>
          </div>
        </Reveal>
      )}

      {/* Sponsored Challenges */}
      <Reveal delay={0.15}>
        <div className="space-y-4">
          <PanelHeader 
            title="Sponsored Challenges"
            action="View All"
          />

          {sponsoredChallenges.length > 0 ? (
            <div className="space-y-3">
              {sponsoredChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-gold hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-2xl">
                      {challenge.emoji}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-ink">{challenge.title}</h3>
                      <div className="mt-1 text-sm text-muted">by {challenge.sponsor}</div>

                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-surface-2 p-2.5 text-center">
                          <div className="text-lg font-bold text-gold">{formatNim(challenge.poolNim)}</div>
                          <div className="text-xs text-muted">Total Pool</div>
                        </div>
                        <div className="rounded-lg bg-surface-2 p-2.5 text-center">
                          <div className="text-lg font-bold text-ink">{formatNim(challenge.topNim)}</div>
                          <div className="text-xs text-muted">Top Prize</div>
                        </div>
                        <div className="rounded-lg bg-surface-2 p-2.5 text-center">
                          <div className="text-lg font-bold text-brand">{challenge.participants}</div>
                          <div className="text-xs text-muted">Competing</div>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-muted">{challenge.description}</p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm text-muted">
                          {challenge.endsInDays} days remaining
                        </span>
                        <button
                          type="button"
                          onClick={async () => { await challengesService.joinSponsoredChallenge(challenge.id); loadProveData(); }}
                          disabled={challenge.joined}
                          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold/90"
                        >
                          {challenge.joined ? 'Joined' : 'Join Challenge'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
              <p className="text-sm text-muted">No sponsored challenges available right now</p>
            </div>
          )}
        </div>
      </Reveal>

      {/* Trending Proofs */}
      <Reveal delay={0.2}>
        <TrendingProofs skills={[]} />
      </Reveal>
    </div>
  );
}
