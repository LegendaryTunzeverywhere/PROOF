/**
 * MarketplaceService — lightweight task marketplace (spec §16).
 * Tasks require a minimum VERIFIED skill score to apply — qualification is
 * computed server-side from proof results, never self-declared.
 */
import { uid, now, luna } from '../util.js';

export class MarketplaceService {
  constructor(store, config, { users, skills, rewards, notifications }) {
    this.store = store;
    this.config = config;
    this.users = users;
    this.skills = skills;
    this.rewards = rewards;
    this.notify = notifications;
    store.declareUniques('marketplace_tasks', []);
    store.declareUniques('task_applications', []);
  }

  seedTask({ title, description, budgetNim, skillSlug, minScore, clientName, clientAvatar, postedAgoMin, autoAccept = true, tags = [] }) {
    const client = this.users.findByUsername(clientName) || this.users.createUser({ username: clientName, isDemo: true });
    client.isClient = true;
    return this.store.insert('marketplace_tasks', {
      id: uid('task'), title, description, tags,
      budgetLuna: luna(budgetNim),
      minProof: skillSlug ? { skillSlug, min: minScore } : null,
      clientId: client.id,
      status: 'open',
      autoAccept,
      postedAt: now() - (postedAgoMin || 0) * 60000,
    });
    // (caller saves)
  }

  async taskView(task, userId = null) {
    const client = this.users.get(task.clientId);
    const apps = await this.store.filter('task_applications', (a) => a.taskId === task.id);
    const us = userId && task.minProof ? this.skills.userSkill(userId, task.minProof.skillSlug) : null;
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      tags: task.tags,
      budgetNim: Math.round(task.budgetLuna / 100000 * 100) / 100,
      status: task.status,
      postedAt: task.postedAt,
      client: client ? { username: client.username, avatar: client.avatar, reputation: client.reputation } : null,
      minProof: task.minProof,
      applications: apps.length,
      qualification: !task.minProof ? { qualified: true, reason: 'Open to all proofers' } : {
        yourScore: us?.score ?? 0,
        required: task.minProof.min,
        skillSlug: task.minProof.skillSlug,
        qualified: !!us && us.score >= task.minProof.min,
        reason: us ? (us.score >= task.minProof.min ? 'Your verified skill qualifies you' : `Needs ${task.minProof.skillSlug.replace('-', ' ')} ${task.minProof.min}+ — you’re at ${us.score}`) : `Prove ${task.minProof.skillSlug.replace('-', ' ')} ${task.minProof.min}+ to unlock`,
      },
      myApplication: userId ? apps.find((a) => a.userId === userId) || null : null,
    };
  }

  async listTasks(userId, { onlyQualified = false } = {}) {
    const filtered = await this.store.filter('marketplace_tasks', (t) => t.status === 'open');
    const sorted = filtered.sort((a, b) => b.postedAt - a.postedAt);
    const tasks = await Promise.all(sorted.map((t) => this.taskView(t, userId)));
    return onlyQualified ? tasks.filter((t) => t.qualification.qualified) : tasks;
  }

  get(taskId, userId) {
    const t = this.store.get('marketplace_tasks', taskId);
    return t ? this.taskView(t, userId) : null;
  }

  apply(taskId, user, pitch) {
    const task = this.store.get('marketplace_tasks', taskId);
    if (!task || task.status !== 'open')
      throw Object.assign(new Error('This task is no longer open.'), { code: 'NOT_OPEN', status: 409 });
    if (task.clientId === user.id)
      throw Object.assign(new Error('You cannot apply to your own task.'), { code: 'OWN_TASK', status: 400 });
    if (task.minProof) {
      const us = this.skills.userSkill(user.id, task.minProof.skillSlug);
      if (!us || us.score < task.minProof.min)
        throw Object.assign(new Error(`You need ${task.minProof.skillSlug.replace('-', ' ')} ${task.minProof.min}+ to apply. Prove it first — then this task is yours to take.`), { code: 'QUALIFICATION_NOT_MET', status: 403 });
    }
    if (this.store.find('task_applications', (a) => a.taskId === taskId && a.userId === user.id))
      throw Object.assign(new Error('You already applied.'), { code: 'ALREADY_APPLIED', status: 409 });

    const app = this.store.insert('task_applications', {
      id: uid('app'), taskId, userId: user.id,
      pitch: String(pitch || '').slice(0, 600),
      status: 'pending', appliedAt: now(),
    });

    // Demo clients auto-accept qualified proofers (clearly labeled demo behavior)
    if (task.autoAccept) {
      this.store.update('task_applications', app.id, { status: 'accepted', respondedAt: now() });
      this.notify.push(user.id, {
        type: 'task_accepted', emoji: '🤝', title: `Accepted: ${task.title}`,
        body: 'The client accepted your application. Deliver, then mark it complete to get paid.',
        href: '#/work',
      });
      this.users.checkAchievements(user.id);
    }
    this.store.save();
    return this.store.get('task_applications', app.id);
  }

  completeTask(taskId, user) {
    const task = this.store.get('marketplace_tasks', taskId);
    if (!task) throw Object.assign(new Error('Task not found.'), { code: 'NOT_FOUND', status: 404 });
    const app = this.store.find('task_applications', (a) => a.taskId === taskId && a.userId === user.id && a.status === 'accepted');
    if (!app) throw Object.assign(new Error('You need an accepted application first.'), { code: 'NOT_ACCEPTED', status: 403 });
    if (task.status === 'completed') throw Object.assign(new Error('Task already completed.'), { code: 'DONE', status: 409 });

    task.status = 'completed';
    app.status = 'completed';
    const { net, fee } = this.rewards.releaseEscrow({
      fromUserId: task.clientId, toUserId: user.id,
      amountNim: task.budgetLuna / 100000,
      kind: 'task_payment', note: `Task: ${task.title}`,
      meta: { taskId },
    });
    this.notify.push(user.id, {
      type: 'task_paid', emoji: '💰', title: `Task complete: ${task.title}`,
      body: `You earned ${(net / 100000).toFixed(2)} NIM.`, href: '#/profile',
    });
    this.users.addReputation(user.id, +3);
    this.users.checkAchievements(user.id);
    this.store.save();
    return { netLuna: net, feeLuna: fee };
  }

  postTask(user, { title, description, budgetNim, skillSlug = null, minScore = 0, tags = [] }) {
    const budget = luna(budgetNim);
    if (!title || !description) throw Object.assign(new Error('Title and description are required.'), { code: 'BAD_INPUT', status: 400 });
    if (!(budget >= luna(1))) throw Object.assign(new Error('Minimum budget is 1 NIM.'), { code: 'BAD_INPUT', status: 400 });
    
    // Escrow funds — wrap in try/catch to rollback on failure
    let debitTx = null;
    try {
      debitTx = this.rewards.debit(user.id, budget, 'task_escrow', `Escrow for task: ${title}`);
      
      const task = this.store.insert('marketplace_tasks', {
        id: uid('task'), title: String(title).slice(0, 120), description: String(description).slice(0, 1000), tags,
        budgetLuna: budget, minProof: skillSlug ? { skillSlug, min: Math.min(Math.max(minScore, 0), 100) } : null,
        clientId: user.id, status: 'open', autoAccept: false, postedAt: now(),
      });
      this.store.save();
      return this.taskView(task, user.id);
    } catch (err) {
      // Rollback: if task creation failed but debit succeeded, credit the funds back
      if (debitTx) {
        try {
          this.rewards.credit(user.id, budget, 'task_escrow_refund', 'Task creation failed — funds returned');
        } catch (refundErr) {
          // Log but don't throw - original error is more important
          console.error('Failed to refund escrowed funds after task creation failure:', refundErr);
        }
      }
      throw err;
    }
  }

  async myTasks(userId) {
    const postedFiltered = await this.store.filter('marketplace_tasks', (t) => t.clientId === userId);
    const posted = await Promise.all(postedFiltered.map((t) => this.taskView(t, userId)));
    
    const appliedFiltered = await this.store.filter('task_applications', (a) => a.userId === userId);
    const applied = await Promise.all(appliedFiltered.map(async (a) => {
      const task = this.store.get('marketplace_tasks', a.taskId);
      return { ...a, task: task ? await this.taskView(task, userId) : null };
    }));
    
    return { posted, applied };
  }
}
