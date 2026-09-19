/**
 * MarketplaceService — lightweight task marketplace (spec §16).
 * Tasks require a minimum VERIFIED skill score to apply — qualification is
 * computed server-side from proof results, never self-declared.
 */
import { uid, now, luna, looksLikeNimiqAddress, normalizeNimiqAddress } from '../util.js';

export class MarketplaceService {
  constructor(store, config, { users, skills, rewards, notifications, treasury = null } = {}) {
    this.store = store;
    this.config = config;
    this.users = users;
    this.skills = skills;
    this.rewards = rewards;
    this.notify = notifications;
    this.treasury = treasury || rewards?.treasury || null;
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

  async taskView(task, userId = null, allApplications = null, userSkillsMap = null) {
    const client = this.users.get(task.clientId);
    // If allApplications is provided (batch mode), use it; otherwise fetch individually
    const apps = allApplications 
      ? allApplications.filter((a) => a.taskId === task.id)
      : await this.store.filter('task_applications', (a) => a.taskId === task.id);
    
    // Use pre-fetched user skills if provided, otherwise fetch individually
    const us = userId && task.minProof 
      ? (userSkillsMap ? userSkillsMap.get(task.minProof.skillSlug) || null : this.skills.userSkill(userId, task.minProof.skillSlug))
      : null;
    const minimumScore = Number(task.minProof?.min ?? 0);
    const isZeroMin = minimumScore <= 0;
    const qualified = !task.minProof || isZeroMin || (!!us && us.score >= minimumScore);
    const view = {
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
      applicants: apps.length,
      qualification: !task.minProof ? { qualified: true, reason: 'Open to all proofers' } : {
        yourScore: us?.score ?? 0,
        required: minimumScore,
        skillSlug: task.minProof.skillSlug,
        qualified,
        reason: isZeroMin ? 'No minimum score required for this skill gate' : (
          us ? (us.score >= minimumScore ? 'Your verified skill qualifies you' : `Needs ${task.minProof.skillSlug.replace('-', ' ')} ${minimumScore}+ — you’re at ${us.score}`) : `Prove ${task.minProof.skillSlug.replace('-', ' ')} ${minimumScore}+ to unlock`
        ),
      },
      myApplication: userId ? apps.find((a) => a.userId === userId) || null : null,
    };
    if (userId === task.clientId) {
      view.applicationDetails = await Promise.all(apps.map(async (application) => {
        const applicant = await this.users.get(application.userId);
        return {
          id: application.id,
          userId: application.userId,
          username: applicant?.username || 'Proofer',
          avatar: applicant?.avatar || '🙂',
          pitch: application.pitch,
          status: application.status,
          appliedAt: application.appliedAt,
        };
      }));
    }
    return view;
  }

  async listTasks(userId, { onlyQualified = false } = {}) {
    const filtered = await this.store.filter('marketplace_tasks', (t) => t.status === 'open' && t.clientId !== userId);
    const sorted = filtered.sort((a, b) => b.postedAt - a.postedAt);
    
    // Batch fetch all applications ONCE instead of querying for each task
    const allApplications = await this.store.all('task_applications');
    
    // Batch fetch user skills ONCE to avoid N+1 skill lookups
    let userSkillsMap = null;
    if (userId) {
      const userSkillsArray = await this.skills.userSkills(userId);
      userSkillsMap = new Map(userSkillsArray.map(us => [us.skillSlug, us]));
    }
    
    // Pass both allApplications and userSkillsMap to taskView to avoid N+1 queries
    const tasks = await Promise.all(sorted.map((t) => this.taskView(t, userId, allApplications, userSkillsMap)));
    return onlyQualified ? tasks.filter((t) => t.qualification.qualified) : tasks;
  }

  get(taskId, userId) {
    const t = this.store.get('marketplace_tasks', taskId);
    return t ? this.taskView(t, userId) : null;
  }

  async apply(taskId, user, pitch) {
    const task = await this.store.get('marketplace_tasks', taskId);
    if (!task || task.status !== 'open')
      throw Object.assign(new Error('This task is no longer open.'), { code: 'NOT_OPEN', status: 409 });
    if (task.clientId === user.id)
      throw Object.assign(new Error('You cannot apply to your own task.'), { code: 'OWN_TASK', status: 400 });
    if (task.minProof && Number(task.minProof.min) > 0) {
      const us = await this.skills.userSkill(user.id, task.minProof.skillSlug);
      if (!us || us.score < task.minProof.min)
        throw Object.assign(new Error(`You need ${task.minProof.skillSlug.replace('-', ' ')} ${task.minProof.min}+ to apply. Prove it first — then this task is yours to take.`), { code: 'QUALIFICATION_NOT_MET', status: 403 });
    }
    if (await this.store.find('task_applications', (a) => a.taskId === taskId && a.userId === user.id))
      throw Object.assign(new Error('You already applied.'), { code: 'ALREADY_APPLIED', status: 409 });

    const app = await this.store.insert('task_applications', {
      id: uid('app'), taskId, userId: user.id,
      pitch: String(pitch || '').slice(0, 600),
      status: 'pending', appliedAt: now(),
    });

    const applicant = await this.users.get(user.id);
    this.notify.push(task.clientId, {
      type: 'task_application',
      emoji: '📩',
      title: `New application: ${task.title}`,
      body: `${applicant?.username || 'A proofer'} applied with: ${String(pitch || '').slice(0, 180)}`,
      href: '#/work',
    });

    // Demo clients auto-accept qualified proofers (clearly labeled demo behavior)
    if (task.autoAccept) {
      await this.store.update('task_applications', app.id, { status: 'accepted', respondedAt: now() });
      this.notify.push(user.id, {
        type: 'task_accepted', emoji: '🤝', title: `Accepted: ${task.title}`,
        body: 'The client accepted your application. Deliver, then mark it complete to get paid.',
        href: '#/work',
      });
      await this.users.checkAchievements(user.id);
    }
    await this.store.save();
    return await this.store.get('task_applications', app.id);
  }

  async submitDelivery(taskId, user, { note = '', url = '', attachment = '' } = {}) {
    const account = await this.users.get(user.id);
    if (account?.isDemo || account?.walletMode === 'demo') {
      throw Object.assign(new Error('Demo wallets cannot complete real work. Connect Nimiq Pay to continue.'), { code: 'DEMO_WALLET_REQUIRED', status: 403 });
    }

    const task = await this.store.get('marketplace_tasks', taskId);
    if (!task) throw Object.assign(new Error('Task not found.'), { code: 'NOT_FOUND', status: 404 });
    const app = await this.store.find('task_applications', (a) => a.taskId === taskId && a.userId === user.id && ['accepted', 'submitted'].includes(a.status));
    if (!app) throw Object.assign(new Error('You need an accepted application first.'), { code: 'NOT_ACCEPTED', status: 403 });
    if (task.status === 'completed') throw Object.assign(new Error('Task already completed.'), { code: 'DONE', status: 409 });

    const normalizedNote = String(note || '').slice(0, 500);
    const normalizedUrl = String(url || '').slice(0, 250);
    const normalizedAttachment = String(attachment || '').slice(0, 250);

    await this.store.update('task_applications', app.id, {
      status: 'submitted',
      deliveredAt: now(),
      deliveryNote: normalizedNote,
      deliveryUrl: normalizedUrl,
      deliveryAttachment: normalizedAttachment,
      reviewedAt: null,
    });
    await this.store.update('marketplace_tasks', taskId, { status: 'assigned', completedAt: null });
    this.notify.push(task.clientId, {
      type: 'task_delivery_submitted', emoji: '📦', title: `Delivery submitted: ${task.title}`,
      body: 'The applicant submitted their work for review.', href: '#/work',
    });
    this.store.save();
    return this.store.get('task_applications', app.id);
  }

  async completeTask(taskId, user, payload = {}) {
    return this.submitDelivery(taskId, user, payload);
  }

  async reviewDelivery(taskId, user, { approved = false, feedback = '' } = {}) {
    const task = await this.store.get('marketplace_tasks', taskId);
    if (!task) throw Object.assign(new Error('Task not found.'), { code: 'NOT_FOUND', status: 404 });
    if (task.clientId !== user.id) {
      throw Object.assign(new Error('Only the client can approve or reject a delivery.'), { code: 'FORBIDDEN', status: 403 });
    }

    const app = await this.store.find('task_applications', (a) => a.taskId === taskId && a.status === 'submitted' && a.userId !== user.id);
    if (!app) {
      throw Object.assign(new Error('No submitted delivery is waiting for review.'), { code: 'NO_DELIVERY', status: 409 });
    }

    if (!approved) {
      await this.store.update('task_applications', app.id, {
        status: 'accepted',
        deliveredAt: null,
        reviewFeedback: String(feedback || '').slice(0, 500),
      });
      this.notify.push(app.userId, {
        type: 'task_revision_requested', emoji: '📝', title: `Revision requested: ${task.title}`,
        body: feedback || 'The client requested changes before approval.', href: '#/work',
      });
      this.store.save();
      return { approved: false, message: 'Delivery returned for revision.' };
    }

    await this.store.update('marketplace_tasks', taskId, { status: 'completed', completedAt: now() });
    await this.store.update('task_applications', app.id, {
      status: 'completed', completedAt: now(), reviewFeedback: String(feedback || '').slice(0, 500),
    });
    const { net, fee } = await this.rewards.releaseEscrow({
      fromUserId: task.clientId, toUserId: app.userId,
      amountNim: task.budgetLuna / 100000,
      kind: 'task_payment', note: `Task: ${task.title}`,
      meta: { taskId, reviewApproved: true },
    });
    const rewardedNim = Number((task.budgetLuna || 0) / 100000);
    const applicantTrustDelta = Math.max(1, Math.round(rewardedNim / 5));
    const clientTrustDelta = Math.max(1, Math.round(rewardedNim / 10));

    this.notify.push(app.userId, {
      type: 'task_paid', emoji: '💰', title: `Task complete: ${task.title}`,
      body: `Your work was approved and you earned ${(net / 100000).toFixed(2)} NIM.`, href: '#/profile',
    });
    this.notify.push(task.clientId, {
      type: 'task_approved', emoji: '✅', title: `Work approved: ${task.title}`,
      body: 'The funded task has been released to the applicant.', href: '#/work',
    });
    await this.users.addReputation(app.userId, +3);
    await this.users.updateRoleReputation(app.userId, 'applicant', applicantTrustDelta);
    await this.users.updateRoleReputation(task.clientId, 'client', clientTrustDelta);
    await this.users.checkAchievements(app.userId);
    this.store.save();
    return { approved: true, netLuna: net, feeLuna: fee, message: 'Delivery approved and escrow released.' };
  }

  async reviewTask(taskId, user, { rating, feedback = '' } = {}) {
    const task = await this.store.get('marketplace_tasks', taskId);
    if (!task) throw Object.assign(new Error('Task not found.'), { code: 'NOT_FOUND', status: 404 });
    if (task.clientId !== user.id) {
      throw Object.assign(new Error('Only the client can review the applicant after delivery.'), { code: 'FORBIDDEN', status: 403 });
    }
    const accepted = await this.store.find('task_applications', (a) => a.taskId === taskId && (a.status === 'accepted' || a.status === 'completed') && a.userId !== user.id);
    if (!accepted) {
      throw Object.assign(new Error('No completed applicant delivery exists to review.'), { code: 'NO_DELIVERY', status: 409 });
    }
    const alreadyReviewed = await this.store.find('task_reviews', (r) => r.taskId === taskId && r.reviewerId === user.id);
    if (alreadyReviewed) {
      throw Object.assign(new Error('This task has already been reviewed by the client.'), { code: 'ALREADY_REVIEWED', status: 409 });
    }

    const normalizedRating = Math.min(Math.max(Number(rating) || 5, 1), 5);
    const review = await this.store.insert('task_reviews', {
      id: uid('tr'),
      taskId,
      reviewerId: user.id,
      revieweeId: accepted.userId,
      rating: normalizedRating,
      feedback: String(feedback || '').slice(0, 500),
      createdAt: now(),
    });

    const applicantTrustDelta = normalizedRating >= 4 ? +4 : normalizedRating <= 2 ? -2 : +1;
    const clientTrustDelta = normalizedRating <= 2 ? -1 : +1;
    await this.users.updateRoleReputation(accepted.userId, 'applicant', applicantTrustDelta);
    await this.users.updateRoleReputation(user.id, 'client', clientTrustDelta);
    this.notify.push(accepted.userId, {
      type: 'task_review', emoji: '⭐', title: `Task reviewed: ${task.title}`,
      body: `Your work was rated ${normalizedRating}/5.`, href: '#/profile',
    });
    this.store.save();
    return review;
  }

  async acceptApplication(taskId, applicationId, user) {
    const task = await this.store.get('marketplace_tasks', taskId);
    if (!task || task.clientId !== user.id) {
      throw Object.assign(new Error('Only the task poster can accept applicants.'), { code: 'FORBIDDEN', status: 403 });
    }
    if (task.status !== 'open') {
      throw Object.assign(new Error('This task is no longer available.'), { code: 'NOT_OPEN', status: 409 });
    }
    const application = await this.store.get('task_applications', applicationId);
    if (!application || application.taskId !== taskId || application.status !== 'pending') {
      throw Object.assign(new Error('Application is no longer pending.'), { code: 'APPLICATION_NOT_PENDING', status: 409 });
    }

    await this.store.update('task_applications', application.id, { status: 'accepted', respondedAt: now() });
    const applications = await this.store.filter('task_applications', (item) => item.taskId === taskId && item.id !== application.id && item.status === 'pending');
    for (const other of applications) {
      await this.store.update('task_applications', other.id, { status: 'rejected', respondedAt: now() });
      this.notify.push(other.userId, {
        type: 'task_application_rejected', emoji: '📭', title: `Task filled: ${task.title}`,
        body: 'Another applicant was selected for this task.', href: '#/work',
      });
    }
    await this.store.update('marketplace_tasks', taskId, { status: 'assigned' });
    this.notify.push(application.userId, {
      type: 'task_application_accepted', emoji: '🤝', title: `Application accepted: ${task.title}`,
      body: 'The task poster accepted your application. You can now deliver the work.', href: '#/work',
    });
    await this.store.save();
    return this.store.get('task_applications', application.id);
  }

  async postTask(user, { title, description, budgetNim, skillSlug = null, minScore = 0, tags = [], escrowTxId = '' }) {
    const account = await this.users.get(user.id);
    if (account?.isDemo || account?.walletMode === 'demo') {
      throw Object.assign(new Error('Demo wallets cannot post work. Connect Nimiq Pay to continue.'), { code: 'DEMO_WALLET_REQUIRED', status: 403 });
    }

    const budget = luna(budgetNim);
    if (!title || !description) throw Object.assign(new Error('Title and description are required.'), { code: 'BAD_INPUT', status: 400 });
    if (!(budget >= luna(1))) throw Object.assign(new Error('Minimum budget is 1 NIM.'), { code: 'BAD_INPUT', status: 400 });
    const clientEscrowTxId = String(escrowTxId).trim();
    if (clientEscrowTxId) {
      const existingEscrowTask = await this.store.find('marketplace_tasks', (task) =>
        task.clientId === user.id && task.escrowTxId === clientEscrowTxId
      );
      if (existingEscrowTask) return this.taskView(existingEscrowTask, user.id);
    }

    const treasuryConfigured = Boolean(this.treasury?.isConfigured?.());
    const treasuryAddress = normalizeNimiqAddress(this.config?.nimiq?.treasuryAddress || '');
    const treasuryAddressIsUsable = looksLikeNimiqAddress(treasuryAddress);
    let debitTx = null;

    try {
      if (!clientEscrowTxId) {
        debitTx = await this.rewards.debit(user.id, budget, 'task_escrow', `Escrow for task: ${title}`);
        if (treasuryConfigured) {
          if (!treasuryAddressIsUsable) {
            throw Object.assign(new Error('Treasury address is malformed.'), { code: 'BAD_TREASURY_ADDRESS', status: 500 });
          }
          const result = await this.treasury.send({ recipient: treasuryAddress, amountLuna: budget });
          await this.store.update('wallet_txs', debitTx.id, {
            meta: { ...(debitTx.meta || {}), treasuryHash: result?.hash || null, treasuryRecipient: treasuryAddress },
          });
        }
      }

      const task = this.store.insert('marketplace_tasks', {
        id: uid('task'), title: String(title).slice(0, 120), description: String(description).slice(0, 1000), tags,
        budgetLuna: budget, minProof: skillSlug ? { skillSlug, min: Math.min(Math.max(minScore, 0), 100) } : null,
        clientId: user.id, status: 'open', autoAccept: false, escrowTxId: clientEscrowTxId || null, postedAt: now(),
      });
      this.store.save();
      return this.taskView(task, user.id);
    } catch (err) {
      if (debitTx) {
        try {
          await this.rewards.credit(user.id, budget, 'task_escrow_refund', 'Task creation failed — funds returned');
        } catch (refundErr) {
          console.error('Failed to refund escrowed funds after task creation failure:', refundErr);
        }
      }
      throw err;
    }
  }

  async myTasks(userId) {
    const postedFiltered = await this.store.filter('marketplace_tasks', (t) => t.clientId === userId);
    
    // Batch fetch all applications ONCE
    const allApplications = await this.store.all('task_applications');
    const allTasks = await this.store.all('marketplace_tasks');
    
    // Batch fetch user skills ONCE
    const userSkillsArray = await this.skills.userSkills(userId);
    const userSkillsMap = new Map(userSkillsArray.map(us => [us.skillSlug, us]));
    
    const posted = await Promise.all(postedFiltered.map((t) => this.taskView(t, userId, allApplications, userSkillsMap)));
    
    const appliedFiltered = allApplications.filter((a) => a.userId === userId);
    const applied = await Promise.all(appliedFiltered.map(async (a) => {
      const task = this.store.get('marketplace_tasks', a.taskId);
      const taskView = task ? await this.taskView(task, userId, allApplications, userSkillsMap) : null;
      return {
        ...a,
        task: taskView,
        taskTitle: task?.title || a.taskTitle || null,
        taskDescription: task?.description || a.taskDescription || null,
        budgetNim: task ? Math.round((task.budgetLuna || 0) / 100000 * 100) / 100 : Number(a.budgetNim || 0),
      };
    }));

    const relationships = [];
    for (const task of allTasks) {
      const isRelevant = task.clientId === userId || allApplications.some((a) => a.taskId === task.id && a.userId === userId);
      if (!isRelevant) continue;

      const client = this.users.get(task.clientId);
      const acceptedApplication = allApplications.find((a) => a.taskId === task.id && ['accepted', 'submitted', 'completed'].includes(a.status) && a.userId !== task.clientId);
      const applicant = acceptedApplication ? this.users.get(acceptedApplication.userId) : null;

      const relationship = {
        taskId: task.id,
        title: task.title,
        description: task.description,
        taskStatus: task.status,
        budgetNim: Math.round((task.budgetLuna || 0) / 100000 * 100) / 100,
        client: client ? {
          id: client.id,
          username: client.username,
          avatar: client.avatar,
          reputation: client.reputation,
        } : null,
        applicant: applicant ? {
          id: applicant.id,
          username: applicant.username,
          avatar: applicant.avatar,
          reputation: applicant.reputation,
        } : null,
        applicationId: acceptedApplication?.id ?? null,
        applicationStatus: acceptedApplication?.status ?? null,
      };

      if (task.clientId === userId || relationship.applicant?.id === userId || relationship.client?.id === userId) {
        relationships.push(relationship);
      }
    }

    relationships.sort((a, b) => (b.taskId > a.taskId ? 1 : -1));
    
    return { posted, applied, relationships };
  }
}
