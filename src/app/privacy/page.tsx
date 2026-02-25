import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.privacy;

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: February 25, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to ScaleReach (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our video processing and clip generation platform (the &quot;Service&quot;).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you register for an account or use our Service, we may collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Billing information and payment details</li>
              <li>Profile information you choose to provide</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Video Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you use our video processing features, we collect and process:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Video files you upload for processing</li>
              <li>Generated video clips and content</li>
              <li>Transcriptions and captions</li>
              <li>AI-generated translations and dubbing content</li>
              <li>Metadata associated with your videos</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.3 Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect certain information when you access our Service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
              <li>Referring website addresses</li>
              <li>Operating system information</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>To provide, maintain, and improve our Service</li>
              <li>To process your video content and generate clips</li>
              <li>To provide AI-powered features including transcription, translation, and dubbing</li>
              <li>To process payments and manage subscriptions</li>
              <li>To communicate with you about your account and our Service</li>
              <li>To send promotional communications (with your consent)</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations</li>
              <li>To analyze usage patterns and improve user experience</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure cloud infrastructure with industry-standard protections</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may share your information with third-party service providers who assist us in operating our Service:
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.1 Video Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party AI and video processing services to provide transcription, translation, clip generation, and other features. Your video content may be processed by these services in accordance with their privacy policies.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.2 Payment Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party payment processors to handle billing and subscription payments. Your payment information is processed directly by these providers and is subject to their privacy policies.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.3 Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may use analytics services to help us understand how users interact with our Service. These services may collect information about your use of our Service.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.4 Google API Services &amp; YouTube</h3>
            <p className="text-muted-foreground leading-relaxed">
              ScaleReach&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              When you connect your YouTube account to ScaleReach, we access the following data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Your YouTube channel information (channel name, profile picture)</li>
              <li>Ability to upload videos to your YouTube channel on your behalf</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We use this data solely to enable you to publish clips directly to your YouTube channel from within ScaleReach. We do not sell, share, or use your YouTube data for advertising, analytics, or any purpose other than providing the Service to you. You can revoke ScaleReach&apos;s access to your YouTube account at any time through your{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                Google Account permissions
              </a>
              .
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Account information is retained while your account is active</li>
              <li>Video content is retained according to your subscription plan and settings</li>
              <li>Usage data may be retained in anonymized form for analytics purposes</li>
              <li>Billing records are retained as required by applicable tax and accounting laws</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You may request deletion of your data at any time by contacting us or through your account settings.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.1 Access and Portability</h3>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request access to the personal information we hold about you and to receive a copy of your data in a portable format.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.2 Correction</h3>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request correction of inaccurate or incomplete personal information.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.3 Deletion</h3>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request deletion of your personal information, subject to certain exceptions required by law.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.4 Opt-Out</h3>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to opt out of marketing communications and certain data processing activities.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.5 GDPR Rights (EEA Residents)</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation, including the right to object to processing and the right to lodge a complaint with a supervisory authority.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">7.6 CCPA Rights (California Residents)</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you are a California resident, you have rights under the California Consumer Privacy Act, including the right to know what personal information is collected and the right to non-discrimination for exercising your privacy rights.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to collect and track information about your use of our Service. Cookies are small data files stored on your device that help us improve our Service and your experience.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Types of cookies we use:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our Service.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under the age of 13 (or 16 in certain jurisdictions). We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected personal information from a child without parental consent, we will take steps to delete that information.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-6 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">ScaleReach</p>
              <p className="text-muted-foreground mt-2">Email: privacy@scalereach.ai</p>
              <p className="text-muted-foreground">Support: support@scalereach.ai</p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/workspaces" className="hover:text-foreground transition-colors">
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
