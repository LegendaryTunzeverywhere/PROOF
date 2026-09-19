import { useState, useEffect } from 'react';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPageCopy } from '../i18n/pageCopy';
import { marketplaceService } from '../services/marketplace.service';
import { teachingService } from '../services/teaching.service';
import { challengesService } from '../services/challenges.service';
import { userService } from '../services/user.service';
import { WalletService } from '../services/wallet.service';
import type { MarketplaceTask, TeachingSession, SponsoredChallenge, Skill } from '../types/api';

type Tab = 'work' | 'teach' | 'sponsored';

export function WorkPage({ initialTab = 'work' }: { initialTab?: Tab }) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = getPageCopy(language).work;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [sponsoredChallenges, setSponsoredChallenges] = useState<SponsoredChallenge[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostTask, setShowPostTask] = useState(false);
  const [escrowConfirmation, setEscrowConfirmation] = useState<{
    budget: number;
    title: string;
    description: string;
    skillSlug: string | null;
    minScore: number;
    tags: string[];
    recipient: string;
  } | null>(null);
  const [postTaskLoading, setPostTaskLoading] = useState(false);
  const [applicationTask, setApplicationTask] = useState<MarketplaceTask | null>(null);
  const [applicationPitch, setApplicationPitch] = useState('');
  const [applicationLoading, setApplicationLoading] = useState(false);
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
  }, [user?.id, authLoading, activeTab]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
        <p className="text-muted">{copy.login}</p>
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
      let recipient = treasuryAddress;
      if (!recipient) {
        const res = await marketplaceService.getTreasuryAddress();
        if (!res.treasuryAddress) {
          throw new Error('Treasury address is not configured for marketplace escrow.');
        }
        recipient = res.treasuryAddress;
        setTreasuryAddress(recipient);
      }
      setEscrowConfirmation({
        budget,
        title,
        description,
        skillSlug: postForm.skillSlug || null,
        minScore: Math.min(Math.max(Number(postForm.minScore) || 0, 0), 100),
        tags: postForm.tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean),
        recipient,
      });
    } catch (err: any) {
      console.error('Failed to post marketplace work:', err);
      setError(err.message || 'Failed to post work.');
    }
  };

  const confirmTaskPost = async () => {
    if (!escrowConfirmation) return;
    try {
      setPostTaskLoading(true);
      setError(null);
      const escrowTxId = await WalletService.sendNim({
        recipient: escrowConfirmation.recipient,
        nim: escrowConfirmation.budget,
        note: `Proof task escrow: ${escrowConfirmation.title}`,
      });
      await marketplaceService.postTask({
        title: escrowConfirmation.title,
        description: escrowConfirmation.description,
        budgetNim: escrowConfirmation.budget,
        skillSlug: escrowConfirmation.skillSlug,
        minScore: escrowConfirmation.minScore,
        tags: escrowConfirmation.tags,
        escrowTxId,
      });
      setEscrowConfirmation(null);
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
  const timeAgo = (timestamp: string | number) => {
    const postedAt = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (!Number.isFinite(postedAt)) return '1 sec ago';
    const seconds = Math.max(1, Math.floor((Date.now() - postedAt) / 1000));
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const verifiedSkills = skills.filter((s) => s.verified && s.score >= 70);
  const canTeach = verifiedSkills.length > 0;
  const walletModeIsDemo = Boolean(user.walletModeIsDemo || user.wallet?.mode === 'demo');

  const openApplicationModal = (task: MarketplaceTask) => {
    setApplicationTask(task);
    setApplicationPitch('');
    setError(null);
  };

  const applyToTask = async () => {
    if (!applicationTask || !applicationPitch.trim() || applicationLoading) return;
    try {
      setApplicationLoading(true);
      await marketplaceService.applyToTask(applicationTask.id, applicationPitch.trim());
      setApplicationTask(null);
      setApplicationPitch('');
      await loadWorkData();
    } catch (err: any) {
      setError(err.message || 'Your application could not be sent.');
    } finally {
      setApplicationLoading(false);
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
      <Modal
        isOpen={Boolean(applicationTask)}
        onClose={() => {
          if (!applicationLoading) setApplicationTask(null);
        }}
        title="Apply to this task"
        size="md"
        actions={
          <>
            <button
              type="button"
              onClick={() => setApplicationTask(null)}
              disabled={applicationLoading}
              className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyToTask}
              disabled={applicationLoading || applicationPitch.trim().length < 10}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applicationLoading ? 'Sending application…' : 'Send application'}
            </button>
          </>
        }
      >
        {applicationTask && (
          <div className="space-y-5">
            <div className="rounded-xl border border-brand-soft bg-brand-soft/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">You are applying for</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{applicationTask.title}</h3>
              <p className="mt-1 text-sm text-muted">{applicationTask.description}</p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Your introduction</span>
              <textarea
                autoFocus
                value={applicationPitch}
                onChange={(event) => setApplicationPitch(event.target.value.slice(0, 600))}
                placeholder="Briefly introduce yourself and explain how you can help..."
                rows={5}
                maxLength={600}
                disabled={applicationLoading}
                className="w-full resize-none rounded-xl border border-line bg-elevated px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand-soft disabled:opacity-60"
              />
              <span className="mt-1 block text-right text-xs text-muted">{applicationPitch.length}/600</span>
            </label>
            <p className="text-xs leading-relaxed text-muted">Share relevant experience, your approach, and when you can deliver.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(escrowConfirmation)}
        onClose={() => {
          if (!postTaskLoading) setEscrowConfirmation(null);
        }}
        title="Review treasury deposit"
        size="md"
        actions={
          <>
            <button
              type="button"
              onClick={() => setEscrowConfirmation(null)}
              disabled={postTaskLoading}
              className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmTaskPost}
              disabled={postTaskLoading}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-wait disabled:opacity-60"
            >
              {postTaskLoading ? 'Waiting for wallet…' : 'Confirm & open wallet'}
            </button>
          </>
        }
      >
        {escrowConfirmation && (
          <div className="space-y-5">
            <div className="rounded-xl border border-warn bg-warn-soft p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warn text-lg text-white" aria-hidden="true">!</span>
                <div>
                  <h3 className="font-bold text-ink">This deposit cannot be recovered</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Your wallet will ask you to approve a transfer to the treasury. The task is published only after the transfer is accepted.
                  </p>
                </div>
              </div>
            </div>

            <dl className="divide-y divide-line rounded-xl border border-line bg-elevated">
              <div className="flex items-start justify-between gap-4 p-4">
                <dt className="text-sm text-muted">Deposit</dt>
                <dd className="text-right text-xl font-bold text-gold">{escrowConfirmation.budget.toFixed(1)} NIM</dd>
              </div>
              <div className="flex items-start justify-between gap-4 p-4">
                <dt className="text-sm text-muted">Task</dt>
                <dd className="max-w-[65%] text-right text-sm font-semibold text-ink">{escrowConfirmation.title}</dd>
              </div>
              <div className="p-4">
                <dt className="text-sm text-muted">Treasury recipient</dt>
                <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-ink">{escrowConfirmation.recipient}</dd>
              </div>
            </dl>

            <p className="text-xs leading-relaxed text-muted">
              Review the address carefully in your wallet before approving. PROOF cannot reverse a confirmed blockchain transfer.
            </p>
          </div>
        )}
      </Modal>

      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">{copy.title}</h1>
          <p className="mt-2 text-base text-muted">
            {copy.subtitle}
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
            💼 {copy.findWork}
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
            🎓 {copy.teach}
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
            🏆 {copy.sponsored}
          </button>
        </div>
      </Reveal>

      {/* Find Work Tab */}
      {activeTab === 'work' && (
        <>
          {walletModeIsDemo && (
            <div className="rounded-2xl border border-warn bg-warn-soft p-4 text-sm font-semibold text-warn">
              Demo wallet detected. Connect Nimiq Pay to continue earning or posting real NIM work.
            </div>
          )}
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
                      <div className="rounded-xl border border-line bg-elevated p-3 text-sm text-muted">
                        Your deposit details will be shown for review before anything is sent from your wallet.
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowPostTask(false)} className="rounded-lg bg-surface-2 px-4 py-2 font-semibold text-muted">Cancel</button>
                        <button type="submit" disabled={postTaskLoading} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
                          Review Deposit
                        </button>
                      </div>
                    </form>
                  </div>
                </Reveal>
              )}

              {/* Recommended Tasks */}
              <Reveal delay={0.15}>
                <div className="space-y-4">
                  <PanelHeader title={copy.recommended} subtitle={copy.subtitle} />

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
                              {task.client?.avatar || '💼'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-ink">{task.title}</h3>
                                <div className="mt-1 text-sm text-muted">
                                  by {task.client?.username || 'Client'} · {timeAgo(task.postedAt)} · {task.applicants} applicants
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
                                onClick={() => openApplicationModal(task)}
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
                  <h3 className="text-base font-semibold text-ink">{copy.noTasks}</h3>
                  <p className="mt-1 text-sm text-muted">{copy.noTasksBody}</p>
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
