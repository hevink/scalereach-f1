import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.terms;

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-6 mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: [DATE]
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to ScaleReach. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the ScaleReach platform, including our website, applications, and video processing services (collectively, the &quot;Service&quot;). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              ScaleReach is a video processing platform that provides the following services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Video upload and storage</li>
              <li>AI-powered clip generation from long-form videos</li>
              <li>Automatic transcription and captioning</li>
              <li>AI dubbing and translation to multiple languages</li>
              <li>Video editing and customization tools</li>
              <li>Content export in various formats and resolutions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
            </p>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">3.1 Account Registration</h3>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">3.2 Account Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">3.3 Account Termination</h3>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for any reason, including if we reasonably believe that you have violated these Terms.
            </p>
          </section>

          {/* Subscription and Payment */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment Terms</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">4.1 Subscription Plans</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Service is offered through various subscription plans with different features, limits, and pricing. Details of available plans are provided on our pricing page. We reserve the right to modify our pricing and plans at any time.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.2 Billing</h3>
            <p className="text-muted-foreground leading-relaxed">
              By subscribing to a paid plan, you authorize us to charge your designated payment method on a recurring basis (monthly or annually, depending on your selected billing cycle). All fees are non-refundable except as expressly stated in these Terms or required by applicable law.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.3 Credits and Usage</h3>
            <p className="text-muted-foreground leading-relaxed">
              Certain features of the Service operate on a credit-based system. Credits are allocated according to your subscription plan and reset at the beginning of each billing cycle. Unused credits do not roll over to subsequent billing periods unless otherwise specified.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.4 Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access to paid features until the end of your current billing period. No refunds will be provided for partial billing periods.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.5 Price Changes</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may change our subscription prices from time to time. Any price changes will be communicated to you in advance and will take effect at the start of your next billing cycle following the notice.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">5.1 Ownership</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain all ownership rights to the content you upload to the Service (&quot;User Content&quot;). ScaleReach does not claim ownership of your User Content.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.2 License Grant</h3>
            <p className="text-muted-foreground leading-relaxed">
              By uploading User Content to the Service, you grant ScaleReach a non-exclusive, worldwide, royalty-free license to use, copy, process, and store your User Content solely for the purpose of providing and improving the Service. This license terminates when you delete your User Content or close your account.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.3 Content Responsibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for your User Content and the consequences of uploading and publishing it. You represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>You own or have the necessary rights to use and authorize the use of your User Content</li>
              <li>Your User Content does not infringe any third-party intellectual property rights</li>
              <li>Your User Content complies with all applicable laws and regulations</li>
              <li>Your User Content does not contain any harmful, offensive, or illegal material</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">6.1 ScaleReach Property</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its original content, features, functionality, and underlying technology, is owned by ScaleReach and is protected by copyright, trademark, and other intellectual property laws. Our trademarks and trade dress may not be used without our prior written permission.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">6.2 Feedback</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you provide us with any feedback, suggestions, or ideas regarding the Service, you grant us the right to use such feedback without restriction or compensation to you.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
              <li>Infringe upon the intellectual property rights of others</li>
              <li>Upload content containing malware, viruses, or other harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use the Service for any illegal purpose or in violation of any applicable laws</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Collect or harvest any information from the Service without authorization</li>
              <li>Use automated systems or software to extract data from the Service (scraping)</li>
              <li>Resell, sublicense, or redistribute the Service without authorization</li>
            </ul>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability and Limitations</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to provide reliable and uninterrupted access to the Service. However, we do not guarantee that the Service will be available at all times or that it will be free from errors or interruptions. The Service may be subject to limitations, delays, and other problems inherent in the use of the internet and electronic communications.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to perform scheduled maintenance and updates that may temporarily affect Service availability. We will endeavor to provide advance notice of planned maintenance when possible.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed uppercase font-medium">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not warrant that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>The Service will meet your specific requirements</li>
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>The results obtained from using the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
              <li>AI-generated content, including transcriptions, translations, and clip selections, will be accurate or suitable for your purposes</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed uppercase font-medium">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SCALEREACH AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Your access to or use of (or inability to access or use) the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 uppercase font-medium">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless ScaleReach and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney&apos;s fees) arising from:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights, including intellectual property rights</li>
              <li>Your User Content</li>
              <li>Any claim that your User Content caused damage to a third party</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and User Content</li>
              <li>Any provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law and Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [JURISDICTION], without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of [ARBITRATION BODY], except that either party may seek injunctive or other equitable relief in any court of competent jurisdiction.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or by posting a notice on the Service prior to the changes becoming effective. Your continued use of the Service after the effective date of the revised Terms constitutes your acceptance of the changes.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent under law.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms, together with our Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and ScaleReach regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-6 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">ScaleReach</p>
              <p className="text-muted-foreground mt-2">Email: legal@scalereach.com</p>
              <p className="text-muted-foreground">Support: support@scalereach.com</p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
