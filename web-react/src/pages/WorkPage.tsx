import { useState, useEffect } from 'react';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplace.service';
import { teachingService } from '../services/teaching.service';
import { challengesService } from '../services/challenges.service';
import { userService } from '../services/user.service';
import { WalletService } from '../services/wallet.service';
import type { MarketplaceTask, TeachingSession, SponsoredChallenge, Skill } from '../types/api';

type Tab = 'work' | 'teach' | 'sponsored';

export function WorkPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('work');
  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [sponsoredChallenges, setSponsoredChallenges] = useState<SponsoredChallenge[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostTask, setShowPostTask] = useState(false);
  const [postTaskLoading, setPostTaskLoading] = useState(false);
  const [treasuryAddress, setTreasuryAddress] = useState<string>('');
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    budgetNim: '1',
    skillSlug: '',
    minScore: '0',
    tags: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadWorkData();
  }, [user, authLoading, activeTab]);

  const loadWorkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'work') {
        const [tasksRes, userRes] = await Promise.all([
          marketplaceService.getTasks(),
          userService.getMe(),
        ]);
        setTasks(tasksRes.tasks);
        setSkills(userRes.skills);
      } else if (activeTab === 'teach') {
        const [sessionsRes, userRes] = await Promise.all([
          teachingService.getSessions(),
          userService.getMe(),
        ]);
        setSessions(sessionsRes.sessions);
        setSkills(userRes.skills);
      } else if (activeTab === 'sponsored') {
        const sponsoredRes = await challengesService.getSponsoredChallenges();
        setSponsoredChallenges(sponsoredRes.sponsored);
      }
    } catch (err: any) {
      console.error('Failed to load work data:', err);
      setError(err.message || 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted">Please log in to access the marketplace</p>
      </div>
    );
  }

  const loadTreasury = async () => {
    try {
      const res = await marketplaceService.getTreasuryAddress();
      setTreasuryAddress(res.treasuryAddress || '');
    } catch {
      setTreasuryAddress('');
    }
  };

  const startPostTask = async () => {
    await loadTreasury();
    setShowPostTask(true);
    setError(null);
  };

  const submitTaskPost = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setPostTaskLoading(true);
      setError(null);
      const budget = Number(postForm.budgetNim);
      const title = postForm.title.trim();
      const description = postForm.description.trim();
      if (!title || !description) {
        throw new Error('Title and description are required.');
      }
      if (!Number.isFinite(budget) || budget < 1) {
        throw new Error('Budget must be at least 1 NIM.');
      }
      if (!WalletService.connected || !WalletService.address) {
        throw new Error('Connect a Nimiq Pay or Hub wallet before posting escrowed work.');
      }
      if (!treasuryAddress) {
        const res = await marketplaceService.getTreasuryAddress();
        if (!res.treasuryAddress) {
          throw new Error('Treasury address is not configured for marketplace escrow.');
        }
        setTreasuryAddress(res.treasuryAddress);
      }
      const ok = window.confirm(
        `You are posting work for ${budget} NIM. The poster deposit will be sent from your connected Nimiq wallet to the treasury address ${treasuryAddress}. This NIM deposit is sent to the treasury and is not recoverable once broadcast. Continue?`
      );
      if (!ok) return;

      await WalletService.sendNim({
        recipient: treasuryAddress,
        nim: budget,
        note: `Proof task escrow: ${title}`,
      });

      await marketplaceService.postTask({
        title,
        description,
        budgetNim: budget,
        skillSlug: postForm.skillSlug || null,
        minScore: Math.min(Math.max(Number(postForm.minScore) || 0, 0), 100),
        tags: postForm.tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean),
      });

      setShowPostTask(false);
      setPostForm({ title: '', description: '', budgetNim: '1', skillSlug: '', minScore: '0', tags: '' });
      await loadWorkData();
    } catch (err: any) {
      console.error('Failed to post marketplace work:', err);
      setError(err.message || 'Failed to post work.');
    } finally {
      setPostTaskLoading(false);
    }
  };

  const formatNim = (amount: number) => amount.toFixed(1);
  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const verifiedSkills = skills.filter((s) => s.verified && s.score >= 70);
  const canTeach = verifiedSkills.length > 0;

  const applyToTask = async (taskId: string) => {
    const pitch = window.prompt('Briefly introduce yourself and explain how you can help.');
    if (!pitch?.trim()) return;
    try {
      await marketplaceService.applyToTask(taskId, pitch.trim());
      await loadWorkData();
    } catch (err: any) {
      setError(err.message || 'Your application could not be sent.');
    }
  };

  const bookSession = async (sessionId: string) => {
    try {
      await teachingService.bookSession(sessionId);
      await loadWorkData();
    } catch (err: any) {
      setError(err.message || 'This session could not be booked.');
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">Marketplace</h1>
          <p className="mt-2 text-base text-muted">
            Find work, teach sessions, or join sponsored challenges
          </p>
        </div>
      </Reveal>

      {/* Tab Navigation */}
      <Reveal delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('work')}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'work'
                ? 'bg-brand text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            💼 Find Work
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teach')}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'teach'
                ? 'bg-brand text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            🎓 Teach
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sponsored')}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'sponsored'
                ? 'bg-brand text-white'
                : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            🏆 Sponsored
          </button>
        </div>
      </Reveal>

      {/* Find Work Tab */}
      {activeTab === 'work' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
              <p className="font-semibold text-bad">Failed to load tasks</p>
              <p className="mt-2 text-sm text-bad">{error}</p>
              <button
                onClick={loadWorkData}
                className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <Reveal delay={0.1}>
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Your Balance
                      </div>
                      <div className="mt-1 text-3xl font-bold text-gold">
                        {formatNim(user.balanceNim)} NIM
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={startPostTask}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep"
                      >
                        + Post Work
                      </button>
                      <div className="rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand">
                        {tasks.length} tasks open
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {showPostTask && (
                <Reveal delay={0.12}>
                  <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-muted">Post Work</div>
                        <div className="text-lg font-bold text-ink">Create a paid task</div>
                      </div>
                      <button type="button" onClick={() => setShowPostTask(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-elevated">Close</button>
                    </div>
                    <form className="grid gap-3" onSubmit={submitTaskPost}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-1 text-sm font-semibold text-muted">
                          Title
                          <input className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold text-muted">
                          Budget (NIM)
                          <input type="number" min="1" className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" value={postForm.budgetNim} onChange={(e) => setPostForm({ ...postForm, budgetNim: e.target.value })} required />
                        </label>
                      </div>
                      <label className="grid gap-1 text-sm font-semibold text-muted">
                        Description
                        <textarea className="min-h-28 rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} required />
                      </label>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="grid gap-1 text-sm font-semibold text-muted">
                          Skill slug
                          <input className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" placeholder="web-development" value={postForm.skillSlug} onChange={(e) => setPostForm({ ...postForm, skillSlug: e.target.value })} />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold text-muted">
                          Min score
                          <input type="number" min="0" max="100" className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" value={postForm.minScore} onChange={(e) => setPostForm({ ...postForm, minScore: e.target.value })} />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold text-muted">
                          Tags
                          <input className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink" placeholder="web, design" value={postForm.tags} onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })} />
                        </label>
                      </div>
                      <div className="rounded-xl border border-warn bg-warn-soft p-3 text-sm font-medium text-warn">
                        Warning: this task poster deposit will be sent to the treasury address <span className="font-bold break-all">{treasuryAddress || 'treasury address unavailable'}</span> and the NIM is not recoverable once broadcast.
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowPostTask(false)} className="rounded-lg bg-surface-2 px-4 py-2 font-semibold text-muted">Cancel</button>
                        <button type="submit" disabled={postTaskLoading} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
                          {postTaskLoading ? 'Posting…' : 'Deposit to Treasury & Post'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Reveal>
              )}

              {/* Recommended Tasks */}
              <Reveal delay={0.15}>
                <div className="space-y-4">
                  <PanelHeader title="Recommended Tasks" subtitle="Based on your verified skills" />

                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const userScore = task.minProof
                          ? skills.find((s) => s.skillSlug === task.minProof?.skillSlug)?.score || 0
                          : 100;
                        const isQualified = !task.minProof || userScore >= task.minProof.min;

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-brand hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-xl">
                            {task.clientAvatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-ink">{task.title}</h3>
                                <div className="mt-1 text-sm text-muted">
                                  by {task.clientUsername} · {timeAgo(task.timePosted)} · {task.applicants} applicants
                                </div>
                              </div>
                              <div className="shrink-0 rounded-lg bg-gold/10 px-3 py-1.5 text-center">
                                <div className="text-lg font-bold text-gold">{formatNim(task.budgetNim)}</div>
                                <div className="text-xs text-muted">NIM</div>
                              </div>
                            </div>

                            {task.minProof && (
                              <div className="mt-3 rounded-lg bg-surface-2 p-3">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                  <span className="font-semibold uppercase tracking-wide text-muted">
                                    Requirement
                                  </span>
                                  <span className="font-semibold text-ink">
                                    {task.minProof.skillSlug.replace(/-/g, ' ')} {task.minProof.min}%+
                                  </span>
                                </div>
                                <div className="relative h-2 overflow-hidden rounded-full bg-elevated">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      isQualified ? 'bg-ok' : 'bg-warn'
                                    }`}
                                    style={{ width: `${Math.min(100, userScore)}%` }}
                                  />
                                  <div
                                    className="absolute top-0 h-full w-0.5 bg-ink/30"
                                    style={{ left: `${task.minProof.min}%` }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                  <span className="text-muted">Your score: <span className="font-semibold">{userScore}%</span></span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                      isQualified
                                        ? 'bg-ok-soft text-ok'
                                        : 'bg-warn-soft text-warn'
                                    }`}
                                  >
                                    {isQualified ? '✓ Qualified' : 'Need higher score'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!task.minProof && (
                              <div className="mt-3 text-sm text-muted">
                                ✓ Open to all proofers
                              </div>
                            )}

                            <p className="mt-3 text-sm text-muted">{task.description}</p>

                            {task.tags && task.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-4">
                              <button
                                type="button"
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                  isQualified
                                    ? 'bg-brand text-white hover:bg-brand-deep'
                                    : 'bg-surface-2 text-muted cursor-not-allowed'
                                }`}
                                disabled={!isQualified}
                                onClick={() => applyToTask(task.id)}
                              >
                                {isQualified ? 'Apply to Task' : 'Qualification Required'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
                  <div className="mb-2 text-4xl">💼</div>
                  <h3 className="text-base font-semibold text-ink">No open tasks right now</h3>
                  <p className="mt-1 text-sm text-muted">Check back soon for new opportunities</p>
                </div>
              )}
            </div>
          </Reveal>
        </>
      )}
    </>
  )}

      {/* Teach Tab */}
      {activeTab === 'teach' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
              <p className="font-semibold text-bad">Failed to load sessions</p>
              <p className="mt-2 text-sm text-bad">{error}</p>
              <button
                onClick={loadWorkData}
                className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Teach Info Card or Lock State */}
              <Reveal delay={0.1}>
            {canTeach ? (
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                    🎓
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink">Teach what you know</h3>
                    <p className="mt-1 text-sm text-muted">
                      Share your expertise through 1-on-1 or group sessions. Students pay in NIM, you receive 98% (2% platform fee).
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
                    >
                      Create a Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl opacity-50">
                    🔒
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink">Teaching Locked</h3>
                    <p className="mt-1 text-sm text-muted">
                      Teaching unlocks when one of your skills is verified at 70%+
                    </p>
                    <div className="mt-3 text-sm font-medium text-brand">
                      Prove a skill →
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Reveal>

          {/* Available Sessions */}
          <Reveal delay={0.15}>
            <div className="space-y-4">
              <PanelHeader title="Book a Teacher" subtitle="Learn from verified experts" />

              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-brand hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-xl">
                          {session.teacherAvatar}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted">{session.teacherUsername}</div>
                          <h3 className="mt-0.5 text-base font-bold text-ink">{session.title}</h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 font-semibold text-ok">
                              ✓ {session.verified}% verified
                            </span>
                            <span className="flex items-center gap-1 text-muted">
                              ⭐ {session.rating} ({session.ratingCount})
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-muted">{session.description}</p>

                          {session.recentReview && (
                            <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm italic text-muted">
                              "{session.recentReview}"
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-gold">{formatNim(session.priceNim)} NIM</span>
                              <span className="text-muted">{session.duration}</span>
                              <span className="text-muted">
                                {session.bookings}/{session.maxStudents} {session.bookings >= session.maxStudents ? '(sold out)' : 'booked'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                session.bookings >= session.maxStudents
                                  ? 'bg-surface-2 text-muted cursor-not-allowed'
                                  : 'bg-brand text-white hover:bg-brand-deep'
                              }`}
                              disabled={session.bookings >= session.maxStudents}
                              onClick={() => bookSession(session.id)}
                            >
                              {session.bookings >= session.maxStudents ? 'Sold Out' : 'Book'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
                  <div className="mb-2 text-4xl">🎓</div>
                  <h3 className="text-base font-semibold text-ink">No sessions available yet</h3>
                  <p className="mt-1 text-sm text-muted">Check back soon for teaching sessions</p>
                </div>
              )}
            </div>
          </Reveal>
        </>
      )}
    </>
  )}

      {/* Sponsored Tab */}
      {activeTab === 'sponsored' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
              <p className="font-semibold text-bad">Failed to load challenges</p>
              <p className="mt-2 text-sm text-bad">{error}</p>
              <button
                onClick={loadWorkData}
                className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* How It Works */}
              <Reveal delay={0.1}>
            <div
              className="rounded-2xl border p-5 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(233, 170, 25, 0.1) 0%, #FFF 100%)',
                borderColor: 'rgba(233, 170, 25, 0.35)',
              }}
            >
              <h3 className="text-base font-bold text-ink">How Sponsored Challenges Work</h3>
              <p className="mt-2 text-sm text-muted">
                Companies sponsor challenges with large prize pools. Complete the challenge to earn a share of the pool.
                The better your proof, the larger your share. Top performers get bonus rewards.
              </p>
            </div>
          </Reveal>

          {/* Sponsored Challenges */}
          <Reveal delay={0.15}>
            <div className="space-y-4">
              <PanelHeader title="Active Challenges" subtitle="Compete for larger prize pools" />

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

                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-surface-2 p-3 text-center">
                              <div className="text-xl font-bold text-gold">{formatNim(challenge.poolNim)}</div>
                              <div className="text-xs text-muted">Total Pool</div>
                            </div>
                            <div className="rounded-lg bg-surface-2 p-3 text-center">
                              <div className="text-xl font-bold text-ink">{formatNim(challenge.topNim)}</div>
                              <div className="text-xs text-muted">Top Prize</div>
                            </div>
                            <div className="rounded-lg bg-surface-2 p-3 text-center">
                              <div className="text-xl font-bold text-brand">{challenge.participants}</div>
                              <div className="text-xs text-muted">Competing</div>
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-muted">{challenge.description}</p>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-sm text-muted">
                              {challenge.endsInDays} days remaining
                            </span>
                            <button
                              type="button"
                              onClick={async () => { await challengesService.joinSponsoredChallenge(challenge.id); loadWorkData(); }}
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
                <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
                  <div className="mb-2 text-4xl">🏆</div>
                  <h3 className="text-base font-semibold text-ink">No active challenges</h3>
                  <p className="mt-1 text-sm text-muted">Check back soon for sponsored challenges</p>
                </div>
              )}
            </div>
          </Reveal>
        </>
      )}
    </>
  )}
    </div>
  );
}
