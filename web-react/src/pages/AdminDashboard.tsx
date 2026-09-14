import { useState, useEffect } from 'react';
import './AdminDashboard.css';

interface Analytics {
  users: {
    total: number;
    new: number;
    demo: number;
    real: number;
    active: number;
  };
  activity: {
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    averageScore: number;
  };
  economy: {
    totalDistributed: number;
    totalCirculating: number;
    averageBalance: number;
    rewardsToday: number;
  };
  topUsers: Array<{
    id: string;
    username: string;
    level: number;
    earned: number;
    proofs: number;
  }>;
  walletAccounts?: {
    demo: Array<{ id: string; username: string; avatar: string; walletMode: string; walletAddress?: string | null; isDemo: boolean; publicKey?: string | null }>;
    real: Array<{ id: string; username: string; avatar: string; walletMode: string; walletAddress?: string | null; isDemo: boolean; publicKey?: string | null }>;
  };
  suspicious: Array<{
    userId: string;
    username: string;
    flags: string[];
    earned: number;
    attempts: number;
    accountAge: string;
  }>;
}

interface RealtimeMetrics {
  timestamp: string;
  last24Hours: {
    attempts: number;
    passed: number;
    activeUsers: number;
    nimDistributed: number;
  };
  lastHour: {
    attempts: number;
    passed: number;
    activeUsers: number;
  };
}

export function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [realtime, setRealtime] = useState<RealtimeMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth) {
      setAuthenticated(true);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadAnalytics();
      loadRealtime();
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadAnalytics();
        loadRealtime();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, timeRange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch('/api/admin/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem('admin_auth', 'true');
        setAuthenticated(true);
        setPassword('');
      } else {
        const data = await response.json();
        setAuthError(data.error?.message || 'Invalid password');
      }
    } catch (err) {
      setAuthError('Authentication failed. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuthenticated(false);
    setAnalytics(null);
    setRealtime(null);
  };

  const loadAnalytics = async () => {
    if (!authenticated) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 403) {
          sessionStorage.removeItem('admin_auth');
          setAuthenticated(false);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to load analytics');
      }
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtime = async () => {
    if (!authenticated) return;
    
    try {
      const response = await fetch('/api/admin/metrics/realtime', {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setRealtime(data);
    } catch (err) {
      console.error('Failed to load realtime metrics:', err);
    }
  };

  // Show login form if not authenticated
  if (!authenticated) {
    return (
      <div className="admin-dashboard admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>🔐 Admin Access</h1>
            <p>Enter admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="password-input"
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit" className="login-button" disabled={!password}>
              Access Dashboard
            </button>
          </form>
          <div className="login-footer">
            <p className="login-hint">
              💡 Password is set in <code>ADMIN_SECRET</code> environment variable
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-dashboard">
        <div className="no-data">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Platform Analytics</h1>
        <div className="header-actions">
          {realtime && (
            <div className="realtime-badge">
              🟢 Live · Updated {new Date(realtime.timestamp).toLocaleTimeString()}
            </div>
          )}
          <button onClick={handleLogout} className="logout-button" title="Logout">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        <button
          onClick={() => setTimeRange('24h')}
          className={timeRange === '24h' ? 'active' : ''}
        >
          24 Hours
        </button>
        <button
          onClick={() => setTimeRange('7d')}
          className={timeRange === '7d' ? 'active' : ''}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={timeRange === '30d' ? 'active' : ''}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeRange('all')}
          className={timeRange === 'all' ? 'active' : ''}
        >
          All Time
        </button>
      </div>

      {/* Real-time Quick Stats */}
      {realtime && (
        <section className="realtime-section">
          <h2>⚡ Real-Time Activity</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Last Hour - Attempts"
              value={realtime.lastHour.attempts}
              icon="⏱️"
              color="purple"
            />
            <MetricCard
              title="Last Hour - Active Users"
              value={realtime.lastHour.activeUsers}
              icon="👥"
              color="purple"
            />
            <MetricCard
              title="24h - Active Users"
              value={realtime.last24Hours.activeUsers}
              icon="🔥"
              color="orange"
            />
            <MetricCard
              title="24h - NIM Distributed"
              value={`${realtime.last24Hours.nimDistributed} NIM`}
              icon="💸"
              color="orange"
            />
          </div>
        </section>
      )}

      {/* User Metrics */}
      <section className="metrics-section">
        <h2>👥 Users</h2>
        <div className="metrics-grid">
          <MetricCard title="Total Users" value={analytics.users.total} icon="👥" />
          <MetricCard title="New Users" value={analytics.users.new} icon="🆕" color="green" />
          <MetricCard title="Active Users" value={analytics.users.active} icon="🟢" color="green" />
          <MetricCard
            title="Real Wallets"
            value={`${analytics.users.real} (${Math.round((analytics.users.real / analytics.users.total) * 100)}%)`}
            icon="💳"
            color="blue"
          />
        </div>
      </section>

      {/* Activity Metrics */}
      <section className="metrics-section">
        <h2>📈 Activity</h2>
        <div className="metrics-grid">
          <MetricCard title="Total Attempts" value={analytics.activity.totalAttempts} icon="📝" />
          <MetricCard
            title="Passed"
            value={analytics.activity.passedAttempts}
            icon="✅"
            color="green"
          />
          <MetricCard
            title="Failed"
            value={analytics.activity.failedAttempts}
            icon="❌"
            color="red"
          />
          <MetricCard
            title="Avg Score"
            value={`${analytics.activity.averageScore}%`}
            icon="📊"
            color="blue"
          />
        </div>
        {analytics.activity.totalAttempts > 0 && (
          <div className="metric-detail">
            Pass Rate:{' '}
            {Math.round(
              (analytics.activity.passedAttempts / analytics.activity.totalAttempts) * 100
            )}
            %
          </div>
        )}
      </section>

      {/* Economy Metrics */}
      <section className="metrics-section">
        <h2>💰 Economy</h2>
        <div className="metrics-grid">
          <MetricCard
            title="NIM Distributed"
            value={`${analytics.economy.totalDistributed} NIM`}
            icon="💸"
            color="yellow"
          />
          <MetricCard
            title="Total Circulating"
            value={`${analytics.economy.totalCirculating} NIM`}
            icon="💎"
            color="blue"
          />
          <MetricCard
            title="Avg Balance"
            value={`${analytics.economy.averageBalance} NIM`}
            icon="💰"
          />
          <MetricCard
            title="Rewards Today"
            value={`${analytics.economy.rewardsToday} NIM`}
            icon="🎁"
            color="green"
          />
        </div>
      </section>

      {/* Wallet Watch */}
      {analytics.walletAccounts && (
        <section className="metrics-section">
          <h2>👛 Wallet Accounts</h2>
          <div className="wallet-account-grid">
            <div>
              <h3>Demo Wallets</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Avatar</th>
                      <th>Wallet Type</th>
                      <th>Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.walletAccounts.demo.map((u) => (
                      <tr key={u.id}>
                        <td className="username">{u.username}</td>
                        <td>{u.avatar}</td>
                        <td>{u.walletMode}</td>
                        <td className="wallet-address">{u.walletAddress || 'demo-wallet'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3>Real Wallets</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Avatar</th>
                      <th>Wallet Type</th>
                      <th>Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.walletAccounts.real.map((u) => (
                      <tr key={u.id}>
                        <td className="username">{u.username}</td>
                        <td>{u.avatar}</td>
                        <td>{u.walletMode}</td>
                        <td className="wallet-address">{u.walletAddress || 'not-connected'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top Users */}
      <section className="metrics-section">
        <h2>🏆 Top Earners</h2>
        {analytics.topUsers.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Level</th>
                  <th>Earned</th>
                  <th>Proofs</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td className="rank">{index + 1}</td>
                    <td className="username">{user.username}</td>
                    <td>Level {user.level}</td>
                    <td className="earned">{user.earned} NIM</td>
                    <td>{user.proofs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No users yet</div>
        )}
      </section>

      {/* Suspicious Activity */}
      {analytics.suspicious.length > 0 && (
        <section className="metrics-section alert-section">
          <h2>⚠️ Suspicious Activity Detected</h2>
          <p className="alert-description">
            {analytics.suspicious.length} user{analytics.suspicious.length !== 1 ? 's' : ''}{' '}
            flagged for review based on unusual behavior patterns.
          </p>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Flags</th>
                  <th>Earned</th>
                  <th>Attempts</th>
                  <th>Account Age</th>
                </tr>
              </thead>
              <tbody>
                {analytics.suspicious.map((user) => (
                  <tr key={user.userId} className="warning-row">
                    <td className="username">{user.username}</td>
                    <td className="flags-cell">
                      {user.flags.map((flag) => (
                        <span key={flag} className="flag-badge">
                          {formatFlag(flag)}
                        </span>
                      ))}
                    </td>
                    <td className="highlight">{user.earned} NIM</td>
                    <td>{user.attempts}</td>
                    <td>{user.accountAge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="alert-footer">
            <strong>Flag Meanings:</strong>
            <ul>
              <li>
                <strong>Daily Cap:</strong> Hits 15 NIM daily cap frequently (7+ days)
              </li>
              <li>
                <strong>High Rate:</strong> More than 20 attempts per day
              </li>
              <li>
                <strong>Low Variance:</strong> Bot-like consistent scores
              </li>
              <li>
                <strong>Rapid Earnings:</strong> Earned 100+ NIM in first week
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* Health Summary */}
      <section className="metrics-section health-section">
        <h2>💚 Platform Health</h2>
        <div className="health-grid">
          <HealthIndicator
            label="Pool Usage"
            status={analytics.economy.rewardsToday < 20000 ? 'good' : 'warning'}
            value={`${analytics.economy.rewardsToday} NIM today`}
          />
          <HealthIndicator
            label="User Growth"
            status={analytics.users.new > 0 ? 'good' : 'neutral'}
            value={`+${analytics.users.new} users`}
          />
          <HealthIndicator
            label="Engagement"
            status={
              analytics.activity.totalAttempts > 100
                ? 'good'
                : analytics.activity.totalAttempts > 10
                ? 'neutral'
                : 'warning'
            }
            value={`${analytics.activity.totalAttempts} attempts`}
          />
          <HealthIndicator
            label="Security"
            status={analytics.suspicious.length === 0 ? 'good' : 'warning'}
            value={
              analytics.suspicious.length === 0
                ? 'No issues'
                : `${analytics.suspicious.length} flagged`
            }
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div className={`metric-card ${color || ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
    </div>
  );
}

function HealthIndicator({
  label,
  status,
  value,
}: {
  label: string;
  status: 'good' | 'warning' | 'neutral';
  value: string;
}) {
  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    neutral: '⚪',
  };

  return (
    <div className={`health-indicator ${status}`}>
      <div className="health-status">{statusIcons[status]}</div>
      <div className="health-label">{label}</div>
      <div className="health-value">{value}</div>
    </div>
  );
}

function formatFlag(flag: string): string {
  const flagMap: { [key: string]: string } = {
    hits_daily_cap_often: 'Daily Cap',
    high_attempt_rate: 'High Rate',
    low_score_variance: 'Low Variance',
    rapid_earnings: 'Rapid Earnings',
  };
  return flagMap[flag] || flag;
}

export default AdminDashboard;
