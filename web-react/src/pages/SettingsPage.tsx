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
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username || '');
  const [avatarDraft, setAvatarDraft] = useState(user?.avatar || '🙂');
  const [identityError, setIdentityError] = useState<string | null>(null);

  useEffect(() => {
    setUsernameDraft(user?.username || '');
    setAvatarDraft(user?.avatar || '🙂');
  }, [user?.username, user?.avatar]);

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

  const saveIdentity = async () => {
    try {
      setSavingIdentity(true);
      setIdentityError(null);
      const payload: { username?: string; avatar?: string } = {};
      if (usernameDraft.trim() && usernameDraft.trim() !== user?.username) payload.username = usernameDraft.trim();
      if (avatarDraft && avatarDraft !== user?.avatar) payload.avatar = avatarDraft;
      if (Object.keys(payload).length === 0) return;
      const { user: updated } = await userService.updateProfile(payload);
      updateUser(updated);
    } catch (error: any) {
      console.error('Failed to save identity:', error);
      setIdentityError(error?.message || 'Unable to update username or avatar.');
    } finally {
      setSavingIdentity(false);
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

      {/* Identity Card */}
      <Reveal delay={0.04}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Identity</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Username</label>
              <input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-brand"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Avatar Emoji</label>
              <div className="flex flex-wrap gap-2">
                {['🙂','🦊','🐼','🦉','🐝','🦋','🐙','🦜','🐳','🦁','🐬','🌍','⚡','🔥','🎯','⭐'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`h-10 w-10 rounded-full border text-lg ${avatarDraft === emoji ? 'border-brand bg-brand text-white' : 'border-line bg-surface-2 text-ink hover:bg-elevated'}`}
                    onClick={() => setAvatarDraft(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {identityError && <div className="mt-3 text-sm text-red-600">{identityError}</div>}
          <div className="mt-4">
            <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" disabled={savingIdentity} onClick={saveIdentity}>
              {savingIdentity ? 'Saving...' : 'Save Identity'}
            </button>
          </div>
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
                <a
                  href="https://github.com/LegendaryTunzeverywhere/PROOF#documentation"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand hover:underline"
                >
                  {t.settings.documentation}
                </a>{' '}
                {t.settings.or}{' '}
                <a href="mailto:registration@nimagent.online?subject=PROOF%20support%20request" className="font-medium text-brand hover:underline">
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
              <a href="mailto:registration@nimagent.online" className="font-medium text-brand hover:underline">
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
