import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { MobileSidebar, Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/** Redirect legacy hash-router links through BrowserRouter before content paints. */
function LegacyHashRedirect() {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      navigate(hash.slice(1), { replace: true });
    }
  }, [navigate]);

  return null;
}

import { PageLoader } from "@/components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";

// Lazy load pages for code splitting
const HomePage = lazy(() => import("@/pages/HomePage").then(m => ({ default: m.HomePage })));
const LearnPage = lazy(() => import("@/pages/LearnPage").then(m => ({ default: m.LearnPage })));
const DocumentUploadPage = lazy(() => import("@/pages/DocumentUploadPage"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage").then(m => ({ default: m.ReviewsPage })));
const ReviewDetailPage = lazy(() => import("@/pages/ReviewDetailPage").then(m => ({ default: m.ReviewDetailPage })));
const ProvePage = lazy(() => import("@/pages/ProvePage").then(m => ({ default: m.ProvePage })));
const WorkPage = lazy(() => import("@/pages/WorkPage").then(m => ({ default: m.WorkPage })));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then(m => ({ default: m.SearchPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const GlossaryPage = lazy(() => import("@/pages/GlossaryPage").then(m => ({ default: m.GlossaryPage })));
const SocraticPage = lazy(() => import("@/pages/SocraticPage").then(m => ({ default: m.SocraticPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })));
const RewardsPage = lazy(() => import("@/pages/RewardsPage").then(m => ({ default: m.RewardsPage })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { resolvedTheme, cycleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine if current theme is dark (for Sidebar toggle display)
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  // Redirect to onboarding if not authenticated. Preserve only valid app routes;
  // avoid sending users back to a stale settings screen after sign-in.
  if (!user) {
    const fromPath = location.pathname;
    const safeFrom = fromPath && fromPath.startsWith('/') && fromPath !== '/' && !fromPath.startsWith('/settings') ? fromPath : '/home';
    return <Navigate to="/" state={{ from: { pathname: safeFrom } }} replace />;
  }

  // User is authenticated, show main app
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen flex-1">
        <Sidebar isDark={isDark} onToggleTheme={cycleTheme} />
        <MobileSidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isDark={isDark}
          onToggleTheme={cycleTheme}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMenu={() => setMenuOpen(true)} />

          <main id="main-content" className="flex-1 px-4 pt-4 pb-2 sm:px-5 sm:pt-5 lg:px-6">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/learn/path/:id" element={<LearnPage />} />
                  <Route path="/learn/lesson/:pathId/:skill/:topic" element={<LearnPage />} />
                  <Route path="/learn/upload" element={<DocumentUploadPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/reviews/:id" element={<ReviewDetailPage />} />
                  <Route path="/prove" element={<ProvePage />} />
                  <Route path="/prove/challenge/:id" element={<ProvePage />} />
                  <Route path="/prove/attempt/:id" element={<ProvePage />} />
                  <Route path="/daily" element={<ProvePage />} />
                  <Route path="/work" element={<WorkPage />} />
                  <Route path="/work/:tab" element={<WorkPage />} />
                  <Route path="/work/teach" element={<WorkPage initialTab="teach" />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/glossary" element={<GlossaryPage />} />
                  <Route path="/socratic" element={<SocraticPage />} />
                  <Route path="/socratic/:id" element={<SocraticPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>

          <footer className="mt-auto flex flex-col gap-3 border-t border-line bg-surface px-4 pt-5 pb-4 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
            <p>© {new Date().getFullYear()} Proof Labs — learn, prove, earn.</p>
            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                { label: "Docs", to: "https://github.com/LegendaryTunzeverywhere/PROOF#readme", external: true },
                { label: "Community", to: "https://t.me/Proof_on_nimiq", external: true },
                { label: "Rewards", to: "/rewards" },
                { label: "Privacy", to: "/privacy" },
                { label: "Terms", to: "/terms" },
              ].map((link) => (
                link.external ? (
                  <a
                    key={link.label}
                    href={link.to}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                ) : link.to.startsWith('#') ? (
                  <button
                    key={link.label}
                    onClick={(e) => { e.preventDefault(); }}
                    className="font-medium text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="font-medium text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <LegacyHashRedirect />
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-app">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        }>
          <Routes>
            {/* Public landing/onboarding page */}
            <Route path="/" element={<OnboardingPage />} />

            {/* Protected app routes */}
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
