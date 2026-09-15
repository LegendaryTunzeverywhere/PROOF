import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { socraticService } from '../services/socratic.service';
import type { SocraticSession } from '../types/api';

export function SocraticPage() {
  const { id: sessionId } = useParams<{ id?: string }>();

  // If there's a sessionId, show session detail
  if (sessionId) {
    return <SocraticSessionDetailView sessionId={sessionId} />;
  }

  // Otherwise show the sessions list
  return <SocraticListView />;
}

function SocraticSessionDetailView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionDetail();
  }, [sessionId]);

  const loadSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch session details and insights
      const [sessionsRes, insightsRes] = await Promise.all([
        socraticService.getSessions(),
        fetch(`/api/socratic/${sessionId}/insights`, { credentials: 'include' }).then(r => r.json())
      ]);
      
      const sessionData = sessionsRes.sessions.find((s: any) => s.id === sessionId);
      if (!sessionData) throw new Error('Session not found');
      
      setSession(sessionData);
      setInsights(insightsRes);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case 'pre_lesson':
        return { emoji: '📚', label: 'Pre-Lesson', class: 'bg-brand-soft text-brand' };
      case 'checkpoint':
        return { emoji: '🎯', label: 'Checkpoint', class: 'bg-ok-soft text-ok' };
      case 'reflection':
        return { emoji: '🤔', label: 'Reflection', class: 'bg-gold/10 text-gold' };
      case 'wait_what':
        return { emoji: '❓', label: 'Wait What', class: 'bg-warn-soft text-warn' };
      case 'deep_dive':
        return { emoji: '🔬', label: 'Deep Dive', class: 'bg-surface-2 text-ink' };
      default:
        return { emoji: '💭', label: 'Session', class: 'bg-surface-2 text-muted' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Reveal>
          <Link
            to="/socratic"
            className="mb-4 inline-block text-sm font-semibold text-muted transition-colors hover:text-brand"
          >
            ← Back to Sessions
          </Link>
        </Reveal>
        <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
          <p className="font-semibold text-bad">Failed to load session</p>
          <p className="mt-2 text-sm text-bad">{error}</p>
          <Link
            to="/socratic"
            className="mt-4 inline-block rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  const typeBadge = getSessionTypeBadge(session.type);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <Reveal>
        <div>
          <Link
            to="/socratic"
            className="mb-4 inline-block text-sm font-semibold text-muted transition-colors hover:text-brand"
          >
            ← Back to Sessions
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-ink">{session.topicTitle}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeBadge.class}`}>
                  {typeBadge.emoji} {typeBadge.label}
                </span>
                <span className="text-sm text-muted">
                  {session.responseCount} responses · {session.duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Conversation Transcript */}
      {session.transcript && session.transcript.length > 0 && (
        <Reveal delay={0.05}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Conversation</h2>
            <div className="space-y-4">
              {session.transcript.map((turn: any, idx: number) => (
                <div key={idx} className="space-y-3">
                  {/* Question from Tutor */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white text-sm font-bold">
                      P
                    </div>
                    <div className="flex-1 rounded-2xl border border-brand-soft bg-brand-soft/20 p-4">
                      <p className="text-sm font-semibold text-brand">PROOF Tutor</p>
                      <p className="mt-1 text-base text-ink">{turn.question}</p>
                      {turn.purpose && (
                        <p className="mt-2 text-xs text-muted italic">Purpose: {turn.purpose.replace(/_/g, ' ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Response from User */}
                  {turn.response && (
                    <div className="flex items-start gap-3 pl-11">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ok text-white text-sm font-bold">
                        Y
                      </div>
                      <div className="flex-1 rounded-2xl border border-line bg-surface p-4">
                        <p className="text-sm font-semibold text-ok">You</p>
                        <p className="mt-1 text-base text-ink">{turn.response}</p>
                        {turn.analysis && (
                          <div className="mt-3 rounded-lg bg-elevated p-3 text-xs text-muted">
                            {turn.analysis.hasQuestions && (
                              <span className="mr-2 text-warn">❓ Has questions</span>
                            )}
                            {turn.analysis.showsUnderstanding && (
                              <span className="mr-2 text-ok">✓ Shows understanding</span>
                            )}
                            {turn.analysis.needsClarification && (
                              <span className="text-warn">⚠️ Needs clarification</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Insights */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">💡 Insights</h2>
            <div className="space-y-3">
              {insights.insights.map((insight: any, idx: number) => (
                <div key={idx} className="rounded-2xl border border-ok-soft bg-ok-soft/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{insight.emoji || '💡'}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ok">{insight.title}</h3>
                      <p className="mt-1 text-sm text-muted">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Summary */}
      {insights && insights.summary && (
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-3 text-lg font-bold text-ink">📝 Summary</h2>
            <p className="text-base leading-relaxed text-muted">{insights.summary}</p>
          </div>
        </Reveal>
      )}

      {/* Recommendations */}
      {insights && insights.recommendations && insights.recommendations.length > 0 && (
        <Reveal delay={0.2}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">🎯 Recommendations</h2>
            <div className="space-y-3">
              {insights.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="rounded-2xl border border-brand-soft bg-brand-soft/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {rec.type === 'practice' && '✍️'}
                      {rec.type === 'clarity' && '🔍'}
                      {rec.type === 'advance' && '🚀'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-brand">{rec.message}</p>
                      <p className="mt-1 text-sm text-muted">{rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Empty State - No Transcript */}
      {(!session.transcript || session.transcript.length === 0) && (
        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <div className="mb-3 text-4xl">💭</div>
            <h3 className="text-lg font-semibold text-ink">Session in Progress</h3>
            <p className="mt-2 text-sm text-muted">
              This session is still active. Complete it to see the full conversation and insights.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function SocraticListView() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SocraticSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadSessions();
  }, [user?.id, authLoading]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await socraticService.getSessions();
      setSessions(response.sessions);
    } catch (err: any) {
      console.error('Failed to load socratic sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (timestamp: string | number) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case 'pre_lesson':
        return { emoji: '📚', label: 'Pre-Lesson', class: 'bg-brand-soft text-brand' };
      case 'checkpoint':
        return { emoji: '🎯', label: 'Checkpoint', class: 'bg-ok-soft text-ok' };
      case 'reflection':
        return { emoji: '🤔', label: 'Reflection', class: 'bg-gold/10 text-gold' };
      case 'wait_what':
        return { emoji: '❓', label: 'Wait What', class: 'bg-warn-soft text-warn' };
      case 'deep_dive':
        return { emoji: '🔬', label: 'Deep Dive', class: 'bg-surface-2 text-ink' };
      default:
        return { emoji: '💭', label: 'Session', class: 'bg-surface-2 text-muted' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'bg-brand text-white' };
      case 'completed':
        return { label: 'Completed', class: 'bg-ok-soft text-ok' };
      case 'abandoned':
        return { label: 'Abandoned', class: 'bg-surface-2 text-muted' };
      default:
        return { label: 'Unknown', class: 'bg-surface-2 text-muted' };
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
        <p className="text-muted">Please log in to view your socratic sessions</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load sessions</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadSessions}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">Socratic Tutor</h1>
          <p className="mt-2 text-base text-muted">
            Learn through guided questioning · Grilling Sessions
          </p>
        </div>
      </Reveal>

      {/* Info Card */}
      <Reveal delay={0.05}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-2xl">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-ink">How It Works</h3>
              <p className="mt-1 text-sm text-muted">
                The Socratic tutor asks questions to help you think deeply about topics. Sessions include:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>• <strong>Pre-Lesson</strong> — Activate prior knowledge before learning</li>
                <li>• <strong>Checkpoints</strong> — Test understanding during lessons</li>
                <li>• <strong>Reflections</strong> — Process what you learned</li>
                <li>• <strong>Wait What</strong> — Clarify confusing concepts</li>
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <PanelHeader 
              title="Your Sessions" 
              subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
            />

            <div className="space-y-3">
              {sessions.map((session) => {
                const typeBadge = getSessionTypeBadge(session.type);
                const statusBadge = getStatusBadge(session.status);

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-brand hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xl">
                        {typeBadge.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge.class}`}>
                                {typeBadge.emoji} {typeBadge.label}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                            <h3 className="mt-2 text-base font-semibold text-ink">{session.topicTitle}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                              <span>{session.responseCount} responses</span>
                              <span>·</span>
                              <span>{session.duration}</span>
                              <span>·</span>
                              <span>{timeAgo(session.createdAt)}</span>
                            </div>
                          </div>
                          {session.status === 'completed' && (
                            <Link
                              to={`/socratic/${session.id}`}
                              className="shrink-0 text-sm font-medium text-brand hover:underline"
                            >
                              View insights →
                            </Link>
                          )}
                          {session.status === 'active' && (
                            <Link
                              to={`/socratic/${session.id}`}
                              className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
                            >
                              Continue
                            </Link>
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
      ) : (
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <div className="mb-3 text-4xl">💭</div>
            <h3 className="text-lg font-semibold text-ink">No grilling sessions yet</h3>
            <p className="mt-2 text-sm text-muted">
              Socratic sessions start automatically when you begin lessons. They help you think deeper about topics.
            </p>
            <Link
              to="/learn"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Start Learning
            </Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}
