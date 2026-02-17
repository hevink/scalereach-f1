import type { Metadata } from "next";

interface ConstructMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  [key: string]: Metadata[keyof Metadata] | string | boolean | undefined;
}

const defaultTitle = "ScaleReach - AI Video Clip Generator for Viral Content";
const defaultDescription =
  "Transform long-form videos into viral short clips with AI. Automatic transcription, captions, translations, and smart clip detection. Save hours of editing time.";

export function constructMetadata({
  title = defaultTitle,
  description = defaultDescription,
  image = "/og-image.png",
  noIndex = false,
  ...props
}: ConstructMetadataProps = {}): Metadata {
  return {
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    keywords: [
      "video clip generator",
      "AI video editor",
      "viral clips",
      "short form content",
      "video to shorts",
      "YouTube shorts",
      "TikTok clips",
      "Instagram reels",
      "video transcription",
      "auto captions",
      "video translation",
      "AI dubbing",
      "content repurposing",
      "video clipping tool",
      "podcast clips",
      "long form to short form",
      "viral content creator",
      "social media clips",
      "video editing automation",
      "ScaleReach",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ScaleReach",
      locale: "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image,
      creator: "@scalereach",
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://scalereach.ai"
    ),
    authors: [
      {
        name: "ScaleReach",
        url: "https://scalereach.ai",
      },
    ],
    creator: "ScaleReach",
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    ...props,
  };
}

// Page-specific metadata configurations
export const pageMetadata = {
  home: constructMetadata(),

  login: constructMetadata({
    title: "Login - ScaleReach",
    description:
      "Sign in to your ScaleReach account to create viral video clips from your long-form content.",
    noIndex: true,
  }),

  signUp: constructMetadata({
    title: "Sign Up - ScaleReach",
    description:
      "Create your free ScaleReach account and start generating viral video clips with AI in minutes.",
  }),

  pricing: constructMetadata({
    title: "Pricing - ScaleReach",
    description:
      "Simple, transparent pricing for ScaleReach. Choose the plan that fits your content creation needs. No hidden fees, cancel anytime.",
  }),

  terms: constructMetadata({
    title: "Terms of Service - ScaleReach",
    description:
      "Read the ScaleReach Terms of Service. Understand your rights and responsibilities when using our AI video clip generation platform.",
  }),

  privacy: constructMetadata({
    title: "Privacy Policy - ScaleReach",
    description:
      "Learn how ScaleReach protects your privacy and handles your data. Our commitment to keeping your videos and information secure.",
  }),

  forgotPassword: constructMetadata({
    title: "Forgot Password - ScaleReach",
    description: "Reset your ScaleReach account password.",
    noIndex: true,
  }),

  resetPassword: constructMetadata({
    title: "Reset Password - ScaleReach",
    description: "Create a new password for your ScaleReach account.",
    noIndex: true,
  }),

  onboarding: constructMetadata({
    title: "Get Started - ScaleReach",
    description: "Set up your ScaleReach workspace and start creating viral clips.",
    noIndex: true,
  }),

  workspaces: constructMetadata({
    title: "Workspaces - ScaleReach",
    description: "Manage your ScaleReach workspaces and projects.",
    noIndex: true,
  }),

  verifyEmail: constructMetadata({
    title: "Verify Email - ScaleReach",
    description: "Verify your email address to complete your ScaleReach account setup.",
    noIndex: true,
  }),

  twoFactorVerify: constructMetadata({
    title: "Two-Factor Authentication - ScaleReach",
    description: "Complete two-factor authentication to access your ScaleReach account.",
    noIndex: true,
  }),

  settings: constructMetadata({
    title: "Settings - ScaleReach",
    description: "Manage your ScaleReach account settings and preferences.",
    noIndex: true,
  }),

  // Workspace pages (dynamic)
  workspace: {
    dashboard: constructMetadata({
      title: "Dashboard - ScaleReach",
      description: "View your workspace dashboard and recent activity.",
      noIndex: true,
    }),
    videos: constructMetadata({
      title: "Videos - ScaleReach",
      description: "Manage your uploaded videos and generate viral clips.",
      noIndex: true,
    }),
    clips: constructMetadata({
      title: "Clips - ScaleReach",
      description: "Browse and edit your AI-generated video clips.",
      noIndex: true,
    }),
    projects: constructMetadata({
      title: "Projects - ScaleReach",
      description: "Organize your video content into projects.",
      noIndex: true,
    }),

  },
};
