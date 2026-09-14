import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { WalletService } from '../services/wallet.service';
import { api } from '../lib/api';
import { pathsService } from '../services/paths.service';

const POPULAR_TAGS = [
  "Code",
  "Design",
  "AI",
  "Business",
  "Marketing",
  "DeFi",
  "Languages",
  "Data Science",
] as const;

const MORE_TAGS = [
  "Web Development",
  "Python",
  "No-code",
  "Data Analysis",
  "Writing",
  "Music",
] as const;

const SKILL_DOMAINS: Record<string, string> = {
  Code: 'web-development',
  Design: 'ui-design',
  AI: 'ai',
  Business: 'business',
  Marketing: 'marketing',
  DeFi: 'nimiq-blockchain',
  Languages: 'languages',
  'Data Science': 'data-analysis',
  'Web Development': 'web-development',
  Python: 'python',
  'No-code': 'web-development',
  'Data Analysis': 'data-analysis',
  Writing: 'writing',
  'Music': 'music-production',
};

const LEVELS = [
  { value: "new", label: "New to it" },
  { value: "some", label: "Some experience" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const TIMES = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
] as const;

const TRUST = [
  { id: "streak", label: "Daily streaks", emoji: "🔥" },
  { id: "verified", label: "Verified proof", emoji: "✓" },
  { id: "nim", label: "NIM rewards", emoji: "⬡" },
] as const;

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all duration-200 ${
        active
          ? 'border-brand bg-brand-soft text-brand shadow-[0_0_0_3px_rgba(35,173,153,0.18)]'
          : 'border-line bg-surface text-muted hover:border-brand/35 hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink">{label}</span>
      <div className="relative mt-2">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border border-line bg-surface ${
            icon ? 'pl-9' : 'pl-3'
          } pr-10 text-sm font-semibold text-ink transition-all duration-200 outline-none hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand-soft`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );
}

function WelcomeSplash() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[var(--app)] px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_42%,var(--brand-soft),transparent_38%)]" />
      <div className="relative flex flex-col items-center text-center animate-[welcome-in_700ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="relative grid h-24 w-24 place-items-center rounded-[28px] bg-surface shadow-[0_18px_55px_rgba(35,173,153,0.22)] ring-1 ring-brand/20 animate-[welcome-mark_1200ms_ease-out_both]">
          <img src="/proof-mark.svg" alt="" className="h-16 w-16 object-contain" />
        </div>
        <p className="mt-7 font-display text-3xl font-extrabold tracking-tight text-ink">Welcome to PROOF</p>
        <p className="mt-2 text-sm text-muted">Your learning path is ready.</p>
        <div className="mt-7 h-1 w-24 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full w-1/2 rounded-full bg-brand animate-[welcome-progress_1100ms_ease-in-out_both]" />
        </div>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [more, setMore] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [level, setLevel] = useState<string>(LEVELS[0].value);
  const [time, setTime] = useState<string>(TIMES[1].value);
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return sessionStorage.getItem('proof_welcome_pending') === 'true';
    } catch {
      return false;
    }
  });
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  // Handle theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("proof-theme", isDark ? "dark" : "light");
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [isDark]);

  useEffect(() => {
    if (!showWelcome || authLoading || user) return;
    try {
      sessionStorage.removeItem('proof_welcome_pending');
    } catch {
      // Welcome animation still works when session storage is unavailable.
    }
    const timer = window.setTimeout(() => setShowWelcome(false), 1400);
    return () => window.clearTimeout(timer);
  }, [authLoading, showWelcome, user]);

  const toggleTheme = useCallback(() => setIsDark((value) => !value), []);

  const getSafeRedirectTarget = () => {
    const from = (location.state as any)?.from?.pathname;
    if (typeof from === 'string' && from.startsWith('/') && from !== '/' && from !== '/settings') {
      return from;
    }
    return '/home';
  };

  if (showWelcome) {
    if (user && !authLoading) {
      navigate(getSafeRedirectTarget(), { replace: true });
    }
    return <WelcomeSplash />;
  }

  // If already authenticated, redirect to intended destination or home
  if (user && !authLoading) {
    navigate(getSafeRedirectTarget(), { replace: true });
    return null;
  }

  const toggle = (label: string, bucket: "tags" | "more") => {
    const setter = bucket === "tags" ? setTags : setMore;
    setter((current) =>
      current.includes(label) ? current.filter((entry) => entry !== label) : [...current, label],
    );
  };

  const connectWallet = async (walletType: 'demo' | 'hub' | 'nimiqpay') => {
    if (walletType === 'demo') return WalletService.connectDemo(null);
    if (walletType === 'nimiqpay') return WalletService.connectNimiqPay(null);
    return WalletService.connectNimiqHub(null);
  };

  const handleWalletSelect = async (walletType: 'demo' | 'hub' | 'nimiqpay') => {
    setConnecting(true);
    setError(null);
    try {
      const walletResult = await connectWallet(walletType);
      setShowWalletModal(false);
      if (walletResult.isNewUser) {
        setShowUsernameModal(true);
      } else {
        // A verified returning wallet already has an identity. Do not ask for
        // onboarding details again; continue directly to the app.
        localStorage.setItem('onboarding_completed', 'true');
        try {
          sessionStorage.setItem('proof_welcome_pending', 'true');
        } catch {
          // The redirect still works when session storage is unavailable.
        }
        setShowWelcome(true);
        window.setTimeout(() => window.location.reload(), 1250);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet. Please try again.';
      setError(errorMessage.includes('USER_REJECTED')
        ? 'Connection cancelled. Please try again when ready.'
        : errorMessage.includes('NIMIQ_PAY_UNAVAILABLE')
        ? 'Install the Nimiq Pay app from Google Play to continue with Nimiq Pay.'
        : errorMessage.includes('HUB_TIMEOUT')
        ? 'Connection timed out. Please try again.'
        : errorMessage.includes('NO_ACCOUNTS')
        ? 'No wallet accounts found. Please create an account in your wallet first.'
        : errorMessage.includes('NO_ADDRESS_SELECTED')
        ? 'No address selected. Please try again and select an address.'
        : errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    // Validate username if provided
    if (trimmedUsername) {
      if (trimmedUsername.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        return;
      }
      if (trimmedUsername.length > 20) {
        setUsernameError('Username must be 20 characters or less');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        return;
      }
    }
    
    setUsernameError(null);
    setShowUsernameModal(false);
    setShowSkillModal(true);
  };

  const handleSkipUsername = async () => {
    setShowUsernameModal(false);
    setUsername("");
    setShowSkillModal(true);
  };

  const handleSkillSubmit = async () => {
    setShowSkillModal(false);
    await finishOnboarding(username.trim() || null);
  };

  const finishOnboarding = async (customUsername: string | null) => {
    try {
      setConnecting(true);
      setError(null);
      
      // Prepare onboarding data with preferences
      const onboardingData = {
        goal: query || 'Learn new skills',
        level: level,
        minutesPerDay: parseInt(time),
        interests: [...tags, ...more],
      };
      
      if (customUsername) await api.patch('/api/me', { username: customUsername });
      await api.patch('/api/me', { prefs: onboardingData });

      const selectedSkill = [...tags, ...more][0];
      const goal = query.trim() || (selectedSkill ? `Learn ${selectedSkill}` : 'Learn new skills');
      const domain = selectedSkill ? SKILL_DOMAINS[selectedSkill] : undefined;
      const pathLevel = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';
      await pathsService.createPath({
        goal,
        domain,
        level: pathLevel,
        minutesPerDay: parseInt(time),
      });
      
      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');
      
      try {
        sessionStorage.setItem('proof_welcome_pending', 'true');
      } catch {
        // The transition can still cover the reload without session storage.
      }
      setShowWelcome(true);
      window.setTimeout(() => window.location.reload(), 1250);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      const errorMessage = err.message || 'Failed to connect wallet. Please try again.';
      
      // User-friendly error messages
      if (errorMessage.includes('USERNAME_TAKEN') || errorMessage.includes('BAD_USERNAME')) {
        setError('Username already taken. Please try a different one.');
        setShowUsernameModal(true); // Re-show username modal
      } else if (errorMessage.includes('INVALID_USERNAME')) {
        setError('Invalid username format.');
        setShowUsernameModal(true);
      } else {
        setError(errorMessage);
        setShowSkillModal(true);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowWalletModal(true);
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-elevated to-base">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, var(--brand-soft) 0%, transparent 50%),
                             radial-gradient(circle at 80% 70%, var(--brand-soft) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 pt-7 sm:px-10 sm:pt-8 lg:px-14">
        <div className="group inline-flex items-center gap-2.5">
          <img
            src="/proof-mark.svg"
            alt=""
            className="h-8 w-8 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.28)]"
          />
          <span className="font-display text-base font-extrabold tracking-[0.24em] text-ink">PROOF</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-all duration-300 hover:border-brand hover:bg-elevated hover:text-brand"
          >
            {isDark ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="inline-flex h-11 items-center gap-2.5 rounded-full border border-brand bg-brand px-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-brand-deep sm:px-5"
            >
              Go to App
            </button>
          ) : null}
        </div>
      </header>

      {/* Main content */}
      <main className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-12 sm:px-10 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:px-14 lg:pt-20 xl:gap-16 xl:pt-24">
        {/* Hero Section */}
        <Reveal>
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-muted sm:text-sm">
              LEARN · PRACTICE · PROVE · EARN
            </p>

            <h1 className="mt-5 font-display font-extrabold leading-[0.96] tracking-tight">
              <span className="block text-[clamp(48px,8.2vw,92px)] bg-gradient-to-br from-brand to-brand-deep bg-clip-text text-transparent">
                Learn
              </span>
              <span className="mt-1 block text-[clamp(48px,8.2vw,92px)] bg-gradient-to-br from-brand to-brand-deep bg-clip-text text-transparent">
                anything.
              </span>
              <span className="mt-1 block text-[clamp(48px,8.2vw,92px)] bg-gradient-to-br from-brand to-brand-deep bg-clip-text text-transparent">
                Prove it.
              </span>
              <span className="mt-1 block text-[clamp(48px,8.2vw,92px)] bg-gradient-to-br from-gold to-gold/80 bg-clip-text text-transparent">
                Earn with it.
              </span>
            </h1>

            <p className="mt-7 max-w-[440px] text-base leading-relaxed text-muted">
              Practical challenges that turn skill into verified ability and real NIM.
            </p>

            <ul className="mt-7 flex flex-wrap items-center gap-2.5">
              {TRUST.map((item) => (
                <li
                  key={item.id}
                  className="group inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition-all duration-300 hover:-translate-y-[1px] hover:border-brand hover:bg-elevated hover:shadow-sm"
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Onboarding Form */}
        <Reveal delay={120} className="flex justify-center lg:justify-end">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-[480px] rounded-2xl border border-line bg-surface p-5 shadow-xl sm:p-6"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent" />

            <label className="block">
              <span className="text-sm font-bold text-ink">What do you want to learn?</span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="6.6" />
                    <path d="m20 20-4.3-4.3" />
                  </svg>
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="e.g. Web development, Python, DeFi"
                  className="h-12 w-full rounded-xl border border-line bg-elevated pl-11 pr-4 text-sm font-medium text-ink outline-none transition-all duration-200 placeholder:font-normal placeholder:text-muted/85 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand-soft"
                />
              </div>
            </label>

            <div className="mt-5 grid gap-3.5">
              <FieldSelect
                label="Your level"
                value={level}
                onChange={setLevel}
                options={LEVELS.map((option) => ({ value: option.value, label: option.label }))}
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19V11" />
                    <path d="M12 19V5" />
                    <path d="M19 19V14" />
                  </svg>
                }
              />
              <FieldSelect
                label="Time / day"
                value={time}
                onChange={setTime}
                options={TIMES.map((option) => ({ value: option.value, label: option.label }))}
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 7.9v4.4l2.9 1.7" />
                  </svg>
                }
              />
            </div>

            <button
              type="submit"
              disabled={connecting || authLoading}
              className="group relative mt-5 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-brand to-brand-deep text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-[2px] hover:from-brand-hover hover:to-brand active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span className="relative">Choose Wallet & Start</span>
              <svg
                className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.6 12h14.8" />
                <path d="m13.4 5.9 6.1 6.1-6.1 6.1" />
              </svg>
            </button>

            {error && (
              <div className="mt-3 rounded-lg bg-bad-soft p-3 text-center text-sm text-bad">
                {error}
              </div>
            )}

            <p className="mt-3 text-center text-xs text-muted">
              Connect your wallet to save progress and earn NIM · Free to start
            </p>
          </form>
        </Reveal>
      </main>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Reveal>
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">Connect Wallet</h3>
                <button
                  onClick={() => {
                    setShowWalletModal(false);
                    setError(null);
                  }}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
                  disabled={connecting}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-bad-soft p-3 text-sm text-bad">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* NimiqPay Option - Now Recommended */}
                <button
                  onClick={() => handleWalletSelect('nimiqpay')}
                  disabled={connecting}
                  className="group relative w-full overflow-hidden rounded-xl border-2 border-gold bg-gradient-to-br from-gold/10 to-gold/5 p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold/80 text-2xl shadow-md">
                      💳
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-ink">Nimiq Pay</h4>
                        <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-white">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        Mobile wallet app. Earn real on-chain NIM rewards.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-gold">
                        ✓ Real rewards · ✓ Your keys · ✓ Secure
                      </p>
                    </div>
                  </div>
                  {connecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gold/10 backdrop-blur-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-gold border-t-transparent" />
                    </div>
                  )}
                </button>

                {/* Nimiq Hub Option */}
                <button
                  onClick={() => handleWalletSelect('hub')}
                  disabled={connecting}
                  className="group relative w-full rounded-xl border-2 border-line bg-surface p-4 text-left transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl text-white">
                      🔐
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ink">Nimiq Hub</h4>
                      <p className="mt-1 text-sm text-muted">
                        Browser-based wallet. Real on-chain rewards.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        ✓ Desktop browsers · ✓ No extensions
                      </p>
                    </div>
                  </div>
                  {connecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/90 backdrop-blur-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
                    </div>
                  )}
                </button>

                {/* Demo Wallet Option */}
                <button
                  onClick={() => handleWalletSelect('demo')}
                  disabled={connecting}
                  className="group relative w-full rounded-xl border-2 border-line bg-surface p-4 text-left transition-all hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted/30 to-muted/20 text-2xl">
                      🎮
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ink">Demo Wallet</h4>
                      <p className="mt-1 text-sm text-muted">
                        Practice mode. Simulated rewards for testing.
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        ✓ Instant · ✓ No setup · ✓ Try features
                      </p>
                    </div>
                  </div>
                  {connecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/90 backdrop-blur-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand border-t-transparent" />
                    </div>
                  )}
                </button>
              </div>

              <div className="mt-6 rounded-lg bg-elevated p-3 text-center text-xs text-muted">
                💡 Use <strong>Nimiq Pay</strong> for real on-chain rewards or <strong>Demo Wallet</strong> to explore risk-free
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Reveal>
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-ink">Choose your username</h3>
              <p className="mt-2 text-sm text-muted">
                This will be your public identity on PROOF. You can't change it later.
              </p>

              <form onSubmit={handleUsernameSubmit} className="mt-6">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(null);
                  }}
                  placeholder="Username"
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm font-medium text-ink outline-none transition-all duration-200 placeholder:font-normal placeholder:text-muted/85 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand-soft"
                />
                <p className="mt-2 text-xs text-muted">
                  3-20 characters, letters, numbers, and underscores only
                </p>

                {usernameError && (
                  <div className="mt-3 rounded-lg bg-bad-soft p-2 text-sm text-bad">
                    {usernameError}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    disabled={connecting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand to-brand-deep text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-[2px] hover:from-brand-hover hover:to-brand active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {connecting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span>Continue</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipUsername}
                    disabled={connecting}
                    className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-line bg-surface text-sm font-semibold text-ink transition-all hover:border-brand hover:bg-elevated disabled:opacity-60"
                  >
                    Skip (generate random)
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      )}

      {/* Skill Selection Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Reveal>
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-ink">Choose your first learning path</h3>
              <p className="mt-2 text-sm text-muted">Your wallet and username are ready. Pick one or more skills and we will create your first path.</p>

              <div className="mt-6">
                <p className="text-xs font-bold text-ink">Popular</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((label) => (
                    <Pill key={label} label={label} active={tags.includes(label)} onClick={() => toggle(label, 'tags')} />
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowMore((value) => !value)}
                  aria-expanded={showMore}
                  className="text-sm font-semibold text-brand hover:text-brand-deep"
                >
                  {showMore ? 'Hide more skills' : 'Show more skills'}
                </button>
                {showMore && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MORE_TAGS.map((label) => (
                      <Pill key={label} label={label} active={more.includes(label)} onClick={() => toggle(label, 'more')} />
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="mt-4 rounded-lg bg-bad-soft p-3 text-sm text-bad">{error}</div>}

              <button
                type="button"
                onClick={handleSkillSubmit}
                disabled={connecting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand to-brand-deep text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-brand-hover hover:to-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connecting ? 'Creating your path...' : 'Create my learning path'}
              </button>
              <button
                type="button"
                onClick={handleSkillSubmit}
                disabled={connecting}
                className="mt-3 w-full text-center text-sm font-semibold text-muted transition-colors hover:text-ink disabled:opacity-60"
              >
                Skip for now
              </button>
            </div>
          </Reveal>
        </div>
      )}

    </div>
  );
}
