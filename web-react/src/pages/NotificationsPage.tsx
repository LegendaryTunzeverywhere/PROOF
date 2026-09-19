import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { BellIcon } from '../components/Icons';
import { notificationsService } from '../services/notifications.service';
import type { Notification } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function NotificationsPage() {
  const { updateUser } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async (nextPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsService.getNotifications(nextPage, 10);
      setNotifications(response.notifications);
      setPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      updateUser({ unreadNotifications: response.unread });
    } catch (err: any) {
      setError(err.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(page); }, [page]);
  const markAllRead = async () => { await notificationsService.markAllAsRead(); setNotifications((items) => items.map((item) => ({ ...item, read: true }))); updateUser({ unreadNotifications: 0 }); };
  const when = (value: number | string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  return <div className="space-y-6"><Reveal><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-ink">{t.common.notifications}</h1><p className="mt-2 text-base text-muted">{t.common.notifications}</p></div>{notifications.some((item) => !item.read) && <button onClick={markAllRead} className="rounded-lg bg-brand-soft px-4 py-2 text-sm font-semibold text-brand hover:bg-elevated">Mark as read</button>}</div></Reveal><Reveal delay={0.1}><div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">{loading ? <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> : error ? <div className="text-center"><p className="text-bad">{error}</p><button onClick={() => void load(page)} className="mt-3 text-sm font-semibold text-brand">{t.common.retry}</button></div> : notifications.length ? <div className="space-y-4"><ul className="divide-y divide-line">{notifications.map((item) => <li key={item.id} className={`flex gap-3 py-4 ${item.read ? '' : 'rounded-lg bg-brand-soft/40 px-3'}`}><span className="text-xl" aria-hidden="true">{item.emoji}</span><div className="min-w-0 flex-1"><p className="font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm text-muted">{item.body}</p><p className="mt-1 text-xs text-faint">{when(item.createdAt)}</p></div>{item.href && <Link to={item.href.replace(/^#/, '')} className="self-center text-sm font-semibold text-brand">{t.common.openNavigation}</Link>}</li>)}</ul><div className="flex items-center justify-center gap-2 pt-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40">Prev</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`h-9 min-w-9 rounded-lg border px-2.5 text-sm font-semibold ${page === pageNumber ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:bg-elevated'}`}>{pageNumber}</button>)}<button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div> : <div className="py-8 text-center"><BellIcon className="mx-auto h-8 w-8 text-faint"/><p className="mt-3 text-sm text-muted">{t.common.notifications}</p></div>}</div></Reveal></div>;
}
