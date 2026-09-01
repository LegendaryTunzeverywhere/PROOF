/** Tiny global state + pub/sub for the SPA. */
import { api } from './api.js';

export const app = {
  me: null,
  skills: [],
  unread: 0,
  opportunities: 0,
  booted: false,
};

export function setMe(me) { app.me = me; }

export async function refreshMe() {
  try {
    const r = await api.get('/api/me');
    app.me = r.user;
    app.skills = r.skills;
    app.unread = r.unread;
    app.opportunities = r.opportunities;
    return r;
  } catch {
    app.me = null;
    return null;
  }
}
