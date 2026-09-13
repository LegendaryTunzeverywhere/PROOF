import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { BellIcon } from '../components/Icons';
import { ConfirmModal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/user.service';
import { languages, Language } from '../i18n/translations';

export function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage: setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (user?.prefs) {
      // Sync language from user prefs if available
      if (user.prefs.language && user.prefs.language !== language) {
        setLang(user.prefs.language);
      }
      // Sync theme from user prefs if available
      // Keep an explicit local choice when navigating back to settings; the
      // server preference is only the initial fallback on a new device.
      const localTheme = localStorage.getItem('proof-theme');
      if (!localTheme && user.prefs.theme && user.prefs.theme !== theme) {
        setTheme(user.prefs.theme);
      }
    }
  }, [user?.prefs?.language, user?.prefs?.theme]); // Only sync when these specific prefs change

  const chooseTheme = async (next: 'light' | 'dark' | 'system') => {
    try {
      setSavingTheme(true);
      // Update theme immediately for instant feedback
      setTheme(next);
      
      // Save to backend - merge with existing prefs
      const { user: updated } = await userService.updateProfile({ 
        prefs: { 
          ...user?.prefs,
          theme: next 
        } 
      });
      updateUser(updated);
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setSavingTheme(false);
    }
  };

  const chooseLanguage = async (next: Language) => {
    try {
      setSavingLanguage(true);
      // Update language immediately for instant feedback
      setLang(next);
      
      // Save to backend - merge with existing prefs
      const { user: updated } = await userService.updateProfile({ 
        prefs: { 
          ...user?.prefs,
          language: next 
        } 
      });
      updateUser(updated);
    } catch (error) {
      console.error('Failed to save language:', error);
      alert(t.settings.languageSaved);
    } finally {
      setSavingLanguage(false);
    }
  };

  const signOut = async () => {
    try {
      setSigningOut(true);
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">{t.settings.title}</h1>
          <p className="mt-2 text-base text-muted">
            {t.settings.subtitle}
          </p>
        </div>
      </Reveal>

      {/* Appearance Card */}
      <Reveal delay={0.05}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.settings.appearance}
            </h3>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t.settings.theme}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => chooseTheme('light')}
                  disabled={savingTheme}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center transition-all disabled:opacity-50 ${
                    theme === 'light'
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  <span className="text-xl leading-none">☀️</span>
                  <span className="text-xs font-semibold leading-tight">{t.settings.themeLight}</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseTheme('dark')}
                  disabled={savingTheme}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center transition-all disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  <span className="text-xl leading-none">🌙</span>
                  <span className="text-xs font-semibold leading-tight">{t.settings.themeDark}</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseTheme('system')}
                  disabled={savingTheme}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center transition-all disabled:opacity-50 ${
                    theme === 'system'
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  <span className="text-xl leading-none">💻</span>
                  <span className="text-xs font-semibold leading-tight">{t.settings.themeSystem}</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                {t.settings.themeHint}
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                {t.settings.language}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(languages) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => chooseLanguage(lang)}
                    disabled={savingLanguage}
                    className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center transition-all disabled:opacity-50 ${
                      language === lang
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'
                    }`}
                  >
                    <span className="text-2xl leading-none">{languages[lang].flag}</span>
                    <span className="text-xs font-semibold leading-tight">{languages[lang].name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {t.settings.languageHint}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Notifications Card */}
      <Reveal delay={0.1}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.settings.notifications}
            </h3>
          </div>

          <p className="text-sm text-muted">
            {t.settings.notificationsDesc}
          </p>

          <Link
            to="/notifications"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-elevated"
          >
            <BellIcon className="h-4 w-4" />
            {t.settings.viewNotifications}
          </Link>
        </div>
      </Reveal>

      {/* Account Card */}
      <Reveal delay={0.15}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.settings.account}
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                disabled={signingOut}
                className="rounded-lg bg-bad-soft px-4 py-2.5 text-sm font-semibold text-bad transition-colors hover:bg-bad hover:text-white disabled:opacity-50"
              >
                {signingOut ? t.settings.signingOut : t.settings.signOut}
              </button>
              <p className="mt-2 text-xs text-muted">
                {t.settings.signOutHint}
              </p>
            </div>

            <div className="border-t border-line pt-4">
              <p className="text-sm text-muted">
                {t.settings.help}{' '}
                <a href="#" className="font-medium text-brand hover:underline">
                  {t.settings.documentation}
                </a>{' '}
                {t.settings.or}{' '}
                <a href="#" className="font-medium text-brand hover:underline">
                  {t.settings.contactSupport}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Privacy & Data */}
      <Reveal delay={0.2}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.settings.privacy}
            </h3>
          </div>

          <div className="space-y-3 text-sm text-muted">
            <p>
              {t.settings.privacyDesc}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/privacy" className="font-medium text-brand hover:underline">
                {t.settings.privacyPolicy}
              </Link>
              <span>·</span>
              <Link to="/terms" className="font-medium text-brand hover:underline">
                {t.settings.terms}
              </Link>
              <span>·</span>
              <a href="mailto:legendarytunz@gmail.com" className="font-medium text-brand hover:underline">
                {t.settings.dataExport}
              </a>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={signOut}
        title={t.settings.signOut}
        message={t.settings.signOutConfirm}
        confirmText="Sign Out"
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}
