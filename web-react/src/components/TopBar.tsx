import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { BellIcon, MenuIcon, SearchIcon, WalletIcon, UserIcon } from "./Icons";
import { notificationsService } from "../services/notifications.service";

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, refreshUser, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refreshUnread = async () => {
      try {
        const response = await notificationsService.getNotifications();
        if (!cancelled) updateUser({ unreadNotifications: response.unread });
      } catch {
        // Keep the last known state when notifications are temporarily unavailable.
      }
    };
    void refreshUnread();
    const interval = window.setInterval(() => { void refreshUnread(); }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      inputRef.current?.focus();
      return;
    }
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-[15px] sm:gap-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t.common.openNavigation}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:bg-elevated hover:text-ink lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <form
          role="search"
          onSubmit={submitSearch}
          className="group relative min-w-0 flex-1 max-w-[620px]"
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-faint transition-colors group-focus-within:text-brand" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.common.searchPlaceholder}
            aria-label={t.common.searchAria}
            className="h-[42px] w-full rounded-xl border border-line bg-elevated/70 pl-11 pr-[74px] text-[13.5px] text-ink transition-all duration-200 outline-none placeholder:text-faint hover:border-line-strong focus:border-brand/45 focus:bg-card focus:ring-4 focus:ring-brand/10 sm:pr-20"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-line bg-card px-2 py-[3px] font-sans text-[11px] font-medium text-faint sm:flex">
            Ctrl K
          </kbd>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/notifications"
            onClick={() => { void refreshUser(); }}
            title={user?.unreadNotifications ? `${user.unreadNotifications} unread notification${user.unreadNotifications === 1 ? '' : 's'}` : t.common.notifications}
            aria-label={`${t.common.notifications}${user?.unreadNotifications ? `, ${user.unreadNotifications} unread` : ''}`}
            className="group relative grid h-[42px] w-[42px] place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:border-line-strong hover:bg-elevated hover:text-ink"
          >
            <BellIcon className="h-[20px] w-[20px] transition-transform duration-200 group-hover:-rotate-6" />
            {user?.unreadNotifications ? (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#F5A524] ring-2 ring-surface"
              />
            ) : null}
          </Link>

          {/* Profile/Wallet Button */}
          {user ? (
            <Link
              to="/profile"
              className="group inline-flex h-[42px] items-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-3.5 text-[13px] font-semibold text-brand transition-all duration-200 hover:-translate-y-[1px] hover:bg-brand hover:text-white hover:shadow-[0_10px_22px_-12px_rgba(35,173,153,0.7)] sm:px-4"
            >
              <div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-brand text-white">
                <UserIcon className="h-[14px] w-[14px]" />
              </div>
              <span className="hidden sm:inline">{user.username || t.common.profile}</span>
            </Link>
          ) : (
            <Link
              to="/"
              className="group inline-flex h-[42px] items-center gap-2 rounded-xl border border-ink/75 bg-card px-3.5 text-[13px] font-semibold text-ink transition-all duration-200 hover:-translate-y-[1px] hover:bg-ink hover:text-surface hover:shadow-[0_10px_22px_-12px_rgba(23,23,43,0.7)] sm:px-4"
            >
              <WalletIcon className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{t.common.connectWallet}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
