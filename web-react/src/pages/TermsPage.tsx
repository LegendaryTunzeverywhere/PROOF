import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';

export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <Reveal>
        <div>
          <Link to="/home" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-ink">Terms of Service</h1>
          <p className="mt-2 text-base text-muted">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Agreement to Terms</h2>
            <p className="text-base leading-relaxed text-muted">
              By accessing or using PROOF ("the Platform"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Platform. These terms apply to all users, including learners, teachers, and challenge creators.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Platform Description</h2>
            <p className="text-base leading-relaxed text-muted">
              PROOF is a learn-to-earn platform that enables users to acquire skills, verify their knowledge through challenges, and earn cryptocurrency rewards. The platform combines educational content, skill assessments, spaced repetition learning, and a marketplace for skill-based work.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">User Accounts and Authentication</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <p>To use PROOF, you must:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Connect a compatible cryptocurrency wallet</li>
                <li>Maintain the security of your wallet and private keys</li>
                <li>Be at least 13 years of age (or the age of majority in your jurisdiction)</li>
                <li>Provide accurate information</li>
                <li>Not create multiple accounts to abuse the system</li>
              </ul>
              <p className="font-semibold text-ink">
                You are solely responsible for your wallet security. PROOF cannot recover lost private keys or reverse unauthorized transactions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Learning and Skill Verification</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <p>When using PROOF's learning features:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>You must complete challenges honestly and without cheating</li>
                <li>Skill badges represent genuine competency and may not be fabricated</li>
                <li>Code submissions must be your own work unless otherwise specified</li>
                <li>Automated systems, bots, or AI assistance to complete challenges is prohibited</li>
                <li>We reserve the right to revoke badges obtained through fraudulent means</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Cryptocurrency and Rewards</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <h3 className="font-semibold text-ink">NIM Token</h3>
              <p>PROOF uses NIM tokens for rewards and transactions. By earning or using NIM:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>You understand that cryptocurrency values fluctuate</li>
                <li>You accept the risks associated with blockchain transactions</li>
                <li>You acknowledge that transactions are irreversible</li>
                <li>You are responsible for any taxes on your earnings</li>
              </ul>
              <h3 className="font-semibold text-ink">Earning Limits</h3>
              <p>We may impose earning limits to prevent abuse and ensure fair distribution of rewards. Suspicious activity may result in account restrictions.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Marketplace and Work</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <p>When participating in the marketplace:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Clients and workers must fulfill their commitments</li>
                <li>Disputes should be resolved through the platform's resolution system</li>
                <li>PROOF acts as a facilitator and is not party to work agreements</li>
                <li>We charge platform fees on marketplace transactions as disclosed</li>
                <li>Payment processing may take time depending on blockchain network</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Content and Intellectual Property</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <h3 className="font-semibold text-ink">Platform Content</h3>
              <p>All learning materials, challenges, and platform features are owned by PROOF Labs or licensed to us. You may not reproduce, distribute, or create derivative works without permission.</p>
              <h3 className="font-semibold text-ink">User Content</h3>
              <p>When you submit code, solutions, or other content:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>You retain ownership of your content</li>
                <li>You grant PROOF a license to use, display, and analyze your content</li>
                <li>You represent that you have the right to share the content</li>
                <li>You will not submit copyrighted material without authorization</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Prohibited Conduct</h2>
            <p className="mb-3 text-base text-muted">You agree not to:</p>
            <ul className="list-inside list-disc space-y-2 text-base leading-relaxed text-muted">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Submit malicious code or attempt to hack the platform</li>
              <li>Manipulate or abuse the reward system</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Scrape or automatically collect platform data</li>
              <li>Interfere with platform operations or security</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Disclaimers and Limitations</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <p className="font-semibold uppercase text-ink">Important Legal Notices:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>PROOF is provided "as is" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>Learning outcomes and skill acquisition vary by individual</li>
                <li>Cryptocurrency values are volatile and may result in losses</li>
                <li>We are not responsible for blockchain network issues</li>
                <li>Our liability is limited to the maximum extent permitted by law</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Termination</h2>
            <p className="text-base leading-relaxed text-muted">
              We reserve the right to suspend or terminate your access to PROOF at any time for violations of these terms, fraudulent activity, or any reason at our discretion. You may also terminate your account at any time. Upon termination, you lose access to the platform but retain any earned cryptocurrency in your wallet.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Changes to Terms</h2>
            <p className="text-base leading-relaxed text-muted">
              We may modify these terms at any time. Significant changes will be communicated through the platform. Continued use after changes constitutes acceptance of the updated terms. If you disagree with new terms, you must stop using the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Governing Law and Disputes</h2>
            <p className="text-base leading-relaxed text-muted">
              These terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved through binding arbitration in accordance with [Arbitration Rules]. You waive the right to participate in class action lawsuits against PROOF.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Contact Information</h2>
            <p className="text-base leading-relaxed text-muted">
              For questions about these Terms of Service, contact us at:{' '}
              <a href="mailto:registration@nimagent.online?subject=PROOF%20terms%20question" className="font-semibold text-brand hover:underline">
                registration@nimagent.online
              </a>
            </p>
          </section>

          <section className="border-t border-line pt-6">
            <p className="text-sm italic text-muted">
              By using PROOF, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
          </section>
        </div>
      </Reveal>
    </div>
  );
}
