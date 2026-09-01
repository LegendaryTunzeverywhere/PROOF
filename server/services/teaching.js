/**
 * TeachingService — teach-to-earn (spec §15).
 * Only users with a VERIFIED skill (score ≥ 70 on a passed proof) can teach it.
 * Payments run through the RewardService ledger; platform takes 2%.
 */
import { uid, now } from '../util.js';

export class TeachingService {
  constructor(store, config, { users, skills, rewards, notifications }) {
    this.store = store;
    this.config = config;
    this.users = users;
    this.skills = skills;
    this.rewards = rewards;
    this.notify = notifications;
    store.declareUniques('teaching_sessions', []);
    store.declareUniques('bookings', []);
    store.declareUniques('reviews', []);
  }

  createSession(user, { title, description, durationMin, priceNim, maxStudents, skillSlug }) {
    const us = this.skills.userSkill(user.id, skillSlug);
    if (!us || !us.verified || us.score < 70)
      throw Object.assign(new Error(`You can teach ${skillSlug.replace('-', ' ')} once it's verified at 70+. Prove it first — you're ${us ? `at ${us.score}` : 'not started'}.`), { code: 'NOT_VERIFIED', status: 403 });
    if (!title || !(priceNim > 0) || !(durationMin >= 10))
      throw Object.assign(new Error('Title, duration (≥10 min) and a positive price are required.'), { code: 'BAD_INPUT', status: 400 });

    const session = this.store.insert('teaching_sessions', {
      id: uid('ts'),
      teacherId: user.id, skillSlug,
      title: String(title).slice(0, 120),
      description: String(description || '').slice(0, 800),
      durationMin: Math.min(durationMin, 240),
      priceLuna: Math.round(priceNim * 100000),
      maxStudents: Math.min(Math.max(maxStudents || 5, 1), 50),
      bookings: 0, rating: null, ratingCount: 0,
      createdAt: now(),
    });
    this.store.save();
    return session;
  }

  view(session) {
    const teacher = this.users.get(session.teacherId);
    const us = teacher && this.skills.userSkill(session.teacherId, session.skillSlug);
    const reviews = this.store.filter('reviews', (r) => r.sessionId === session.id);
    return {
      id: session.id,
      title: session.title, description: session.description,
      durationMin: session.durationMin,
      priceNim: Math.round(session.priceLuna / 100000 * 100) / 100,
      maxStudents: session.maxStudents, bookings: session.bookings,
      skillSlug: session.skillSlug,
      teacher: teacher ? {
        id: teacher.id, username: teacher.username, avatar: teacher.avatar,
        reputation: teacher.reputation,
        skillScore: us?.score || 0, skillVerified: !!us?.verified,
      } : null,
      rating: session.ratingCount ? Math.round((session.rating / session.ratingCount) * 10) / 10 : null,
      ratingCount: session.ratingCount,
      reviews: reviews.slice(-5),
      soldOut: session.bookings >= session.maxStudents,
    };
  }

  list({ skillSlug = null } = {}) {
    return this.store.all('teaching_sessions')
      .filter((s) => !skillSlug || s.skillSlug === skillSlug)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.createdAt - a.createdAt)
      .map((s) => this.view(s));
  }

  mine(userId) {
    return this.store.filter('teaching_sessions', (s) => s.teacherId === userId).map((s) => this.view(s));
  }

  book(sessionId, user) {
    const s = this.store.get('teaching_sessions', sessionId);
    if (!s) throw Object.assign(new Error('Session not found.'), { code: 'NOT_FOUND', status: 404 });
    if (s.teacherId === user.id) throw Object.assign(new Error('This is your own session.'), { code: 'OWN_SESSION', status: 400 });
    if (s.bookings >= s.maxStudents) throw Object.assign(new Error('This session is fully booked.'), { code: 'SOLD_OUT', status: 409 });
    if (this.store.find('bookings', (b) => b.sessionId === sessionId && b.userId === user.id))
      throw Object.assign(new Error('You already booked this session.'), { code: 'ALREADY_BOOKED', status: 409 });

    this.rewards.debit(user.id, s.priceLuna, 'session_payment', `Booked: ${s.title}`, { sessionId });
    this.rewards.releaseEscrow({
      fromUserId: user.id, toUserId: s.teacherId,
      amountNim: s.priceLuna / 100000, kind: 'session_payment',
      note: `Teaching: ${s.title}`, meta: { sessionId },
    });
    s.bookings += 1;
    this.store.insert('bookings', { id: uid('bk'), sessionId, userId: user.id, bookedAt: now() });
    this.notify.push(s.teacherId, {
      type: 'booking', emoji: '🎓', title: `New student: ${user.username}`,
      body: `Booked “${s.title}”.`, href: '#/profile',
    });
    this.users.checkAchievements(s.teacherId);
    this.store.save();
    return this.view(s);
  }

  review(sessionId, user, { rating, text }) {
    const s = this.store.get('teaching_sessions', sessionId);
    if (!s) throw Object.assign(new Error('Session not found.'), { code: 'NOT_FOUND', status: 404 });
    const b = this.store.find('bookings', (x) => x.sessionId === sessionId && x.userId === user.id);
    if (!b) throw Object.assign(new Error('Book the session before reviewing.'), { code: 'NOT_BOOKED', status: 403 });
    if (this.store.find('reviews', (r) => r.sessionId === sessionId && r.userId === user.id))
      throw Object.assign(new Error('You already reviewed this session.'), { code: 'ALREADY_REVIEWED', status: 409 });

    const rate = Math.min(Math.max(Math.round(rating), 1), 5);
    this.store.insert('reviews', {
      id: uid('rv'), sessionId, userId: user.id,
      revieweeId: s.teacherId, rating: rate, text: String(text || '').slice(0, 400), createdAt: now(),
    });
    s.rating = (s.rating || 0) + rate;
    s.ratingCount += 1;
    this.users.addReputation(s.teacherId, rate >= 4 ? +2 : rate <= 2 ? -2 : 0);
    this.users.checkAchievements(s.teacherId);
    this.store.save();
    return this.view(s);
  }
}
