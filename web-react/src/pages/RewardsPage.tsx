import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, WalletIcon } from '../components/Icons';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';

const rewardRoutes = [
  {
    title: 'Learning paths',
    description: 'Proof checkpoints can include a NIM reward. Complete the work, pass the server-side evaluation, and the reward is recorded against that proof.',
    tone: 'border-brand/30 bg-brand-soft',
  },
  {
    title: 'Sponsored pools',
    description: 'Sponsors fund challenge pools for the community. Eligible participants compete on the same brief, and the published pool is shared according to the challenge rules.',
    tone: 'border-gold/30 bg-gold-soft',
  },
  {
    title: 'Daily learning',
    description: 'Daily claims are limited and tracked by the server to protect the treasury from farming. Your streak can grow, but each day is claimable once.',
    tone: 'border-ok/30 bg-ok-soft',
  },
];

export function RewardsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Reveal>
        <PanelHeader
          title="Rewards"
          subtitle="Understand where NIM rewards come from and how PROOF keeps them accountable."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
              <WalletIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">A treasury-backed reward loop</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                PROOF does not create NIM rewards from a client-side score. Rewards are calculated and recorded by the server, then settled from the configured treasury when live Nimiq payouts are enabled. Every eligible proof has a source, amount, and ledger record.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {rewardRoutes.map((route, index) => (
          <Reveal key={route.title} delay={0.12 + index * 0.06}>
            <article className={`h-full rounded-2xl border p-5 ${route.tone}`}>
              <h2 className="text-base font-bold text-ink">{route.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{route.description}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-ink">What happens after a pass?</h2>
          <ol className="mt-5 space-y-4 text-sm text-muted">
            {[
              'Your submission is evaluated on the server against the challenge requirements.',
              'A passing result creates one reward record tied to that proof. Duplicate submissions cannot mint another reward.',
              'The treasury payout is attempted when live Nimiq configuration is available. Otherwise, the app clearly labels the result as demo-ledger activity.',
              'You can review your balance and transaction history from your profile.',
            ].map((step) => (
              <li key={step} className="flex gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal delay={0.36}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link to="/prove" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-deep">
            Prove a skill
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <a href="mailto:registration@nimagent.online?subject=PROOF%20rewards%20question" className="font-semibold text-brand hover:underline">
            Questions about rewards? Contact registration@nimagent.online
          </a>
        </div>
      </Reveal>
    </div>
  );
}

export default RewardsPage;
