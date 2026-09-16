import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <Reveal>
        <div>
          <Link to="/home" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-ink">Privacy Policy</h1>
          <p className="mt-2 text-base text-muted">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Introduction</h2>
            <p className="text-base leading-relaxed text-muted">
              Welcome to PROOF. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This policy outlines how we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Information We Collect</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <div>
                <h3 className="font-semibold text-ink">Wallet Information</h3>
                <p>When you connect your cryptocurrency wallet, we collect your public wallet address to authenticate your identity and track your progress and earnings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Learning Data</h3>
                <p>We collect information about your learning progress, including completed challenges, skill assessments, review history, and performance metrics to personalize your learning experience.</p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Usage Information</h3>
                <p>We automatically collect information about how you interact with our platform, including pages visited, features used, and time spent, to improve our services.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">How We Use Your Information</h2>
            <ul className="list-inside list-disc space-y-2 text-base leading-relaxed text-muted">
              <li>To provide and maintain our learning platform</li>
              <li>To personalize your learning experience and recommend relevant content</li>
              <li>To track your progress and issue skill verification badges</li>
              <li>To process cryptocurrency transactions and rewards</li>
              <li>To communicate with you about updates, features, and opportunities</li>
              <li>To analyze usage patterns and improve our platform</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Data Storage and Security</h2>
            <p className="text-base leading-relaxed text-muted">
              Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Blockchain and Cryptocurrency</h2>
            <p className="text-base leading-relaxed text-muted">
              When you earn or spend cryptocurrency through PROOF, these transactions are recorded on public blockchains. Blockchain transactions are permanent and publicly visible. We do not control blockchain networks and cannot reverse or hide these transactions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Third-Party Services</h2>
            <p className="text-base leading-relaxed text-muted">
              We may use third-party services for analytics, payment processing, and infrastructure. These services have their own privacy policies and may collect information about you. We carefully select partners who maintain high privacy and security standards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Your Rights</h2>
            <ul className="list-inside list-disc space-y-2 text-base leading-relaxed text-muted">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Export your learning data</li>
              <li>Opt out of certain data collection</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Children's Privacy</h2>
            <p className="text-base leading-relaxed text-muted">
              PROOF is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Changes to This Policy</h2>
            <p className="text-base leading-relaxed text-muted">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of PROOF after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-ink">Contact Us</h2>
            <p className="text-base leading-relaxed text-muted">
              If you have questions about this Privacy Policy or how we handle your data, please contact us at:{' '}
              <a href="mailto:registration@nimagent.online?subject=PROOF%20privacy%20question" className="font-semibold text-brand hover:underline">
                registration@nimagent.online
              </a>
            </p>
          </section>
        </div>
      </Reveal>
    </div>
  );
}
