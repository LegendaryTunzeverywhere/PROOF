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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => { try { setLoading(true); setError(null); const response = await notificationsService.getNotifications(); setNotifications(response.notifications); updateUser({ unreadNotifications: response.unread }); } catch (err: any) { setError(err.message || 'Could not load notifications.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const markAllRead = async () => { await notificationsService.markAllAsRead(); setNotifications((items) => items.map((item) => ({ ...item, read: true }))); updateUser({ unreadNotifications: 0 }); };
  const when = (value: number | string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  return <div className="space-y-6"><Reveal><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-ink">{t.common.notifications}</h1><p className="mt-2 text-base text-muted">{t.common.notifications}</p></div>{notifications.some((item) => !item.read) && <button onClick={markAllRead} className="rounded-lg bg-brand-soft px-4 py-2 text-sm font-semibold text-brand hover:bg-elevated">{t.common.save}</button>}</div></Reveal><Reveal delay={0.1}><div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">{loading ? <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> : error ? <div className="text-center"><p className="text-bad">{error}</p><button onClick={load} className="mt-3 text-sm font-semibold text-brand">{t.common.retry}</button></div> : notifications.length ? <ul className="divide-y divide-line">{notifications.map((item) => <li key={item.id} className={`flex gap-3 py-4 ${item.read ? '' : 'rounded-lg bg-brand-soft/40 px-3'}`}><span className="text-xl" aria-hidden="true">{item.emoji}</span><div className="min-w-0 flex-1"><p className="font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm text-muted">{item.body}</p><p className="mt-1 text-xs text-faint">{when(item.createdAt)}</p></div>{item.href && <Link to={item.href.replace(/^#/, '')} className="self-center text-sm font-semibold text-brand">{t.common.openNavigation}</Link>}</li>)}</ul> : <div className="py-8 text-center"><BellIcon className="mx-auto h-8 w-8 text-faint"/><p className="mt-3 text-sm text-muted">{t.common.notifications}</p></div>}</div></Reveal></div>;
}
