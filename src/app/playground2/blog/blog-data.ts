export interface BlogPost {
	slug: string;
	title: string;
	description: string;
	date: string;
	author: string;
	tags: string[];
	image?: string;
	featured?: boolean;
	published: boolean;
	content: string;
}

export const blogPosts: BlogPost[] = [
	{
		slug: "introducing-scalereach",
		title: "Introducing ScaleReach: AI-Powered Video Clipping",
		description: "We're launching ScaleReach, a new way to create viral short-form content from your long-form videos using AI-powered clip detection.",
		date: "2026-01-31",
		author: "ScaleReach Team",
		tags: ["announcement", "product", "ai"],
		featured: true,
		published: true,
		content: `
# Introducing ScaleReach

We're excited to announce the launch of ScaleReach, an AI-powered video clipping tool designed to help content creators maximize their reach.

## The Problem

Creating short-form content from long videos is time-consuming. You have to watch hours of footage, identify the best moments, and manually clip them out. This process can take hours for a single video.

## Our Solution

ScaleReach uses AI to automatically detect viral-worthy moments in your videos. Simply upload your content, and our AI will:

- Transcribe your video with word-level accuracy
- Identify engaging moments based on speech patterns and content
- Suggest optimal clip boundaries
- Generate captions automatically

## Key Features

### AI-Powered Clip Detection
Our AI analyzes your content to find the most engaging moments, saving you hours of manual work.

### Professional Captions
Add beautiful, customizable captions to your clips with our built-in caption editor.

### Multiple Export Formats
Export your clips in any aspect ratio - 16:9 for YouTube, 9:16 for TikTok and Reels, or 1:1 for Instagram.

## Get Started

Sign up today and start creating viral content in minutes, not hours.
		`,
	},
	{
		slug: "caption-styling-guide",
		title: "The Ultimate Guide to Caption Styling",
		description: "Learn how to create eye-catching captions that boost engagement and keep viewers watching your content.",
		date: "2026-01-25",
		author: "ScaleReach Team",
		tags: ["tutorial", "captions", "design"],
		published: true,
		content: `
# The Ultimate Guide to Caption Styling

Captions aren't just for accessibility - they're a powerful tool for engagement. Here's how to make them work for you.

## Why Captions Matter

Studies show that 85% of videos on social media are watched without sound. Captions ensure your message gets across regardless of how viewers consume your content.

## Best Practices

### Font Selection
Choose fonts that are easy to read on mobile devices. Sans-serif fonts like Inter or Montserrat work great.

### Color Contrast
Ensure your captions stand out against your video background. Use contrasting colors or add a subtle shadow.

### Animation
Word-by-word highlighting can increase engagement by drawing attention to your message.

## ScaleReach Caption Features

Our caption editor gives you full control over:
- Font family and size
- Colors and gradients
- Animation styles
- Position and alignment
		`,
	},
	{
		slug: "viral-content-tips",
		title: "5 Tips for Creating Viral Short-Form Content",
		description: "Discover the secrets behind viral videos and learn how to apply them to your own content strategy.",
		date: "2026-01-18",
		author: "ScaleReach Team",
		tags: ["tips", "viral", "content-strategy"],
		published: true,
		content: `
# 5 Tips for Creating Viral Short-Form Content

Going viral isn't just luck - it's strategy. Here are five proven tips to increase your chances.

## 1. Hook in the First 3 Seconds

You have three seconds to capture attention. Start with something unexpected, controversial, or visually striking.

## 2. Keep It Concise

The best performing short-form content gets to the point quickly. Cut the fluff and deliver value fast.

## 3. Use Trending Audio

Leverage trending sounds and music to boost your content's discoverability on platforms like TikTok and Reels.

## 4. Add Captions

As mentioned, most viewers watch without sound. Captions are essential for engagement.

## 5. End with a Call to Action

Tell viewers what to do next - follow, like, comment, or share. A clear CTA can significantly boost engagement.
		`,
	},
	{
		slug: "transcription-accuracy",
		title: "How We Achieve 95%+ Transcription Accuracy",
		description: "A deep dive into our transcription technology and how we ensure accurate captions for your videos.",
		date: "2026-01-10",
		author: "ScaleReach Team",
		tags: ["technology", "transcription", "ai"],
		published: true,
		content: `
# How We Achieve 95%+ Transcription Accuracy

Accurate transcription is the foundation of great captions. Here's how we do it.

## Our Technology Stack

We use Deepgram's Nova-2 model, one of the most accurate speech-to-text engines available. Combined with our post-processing pipeline, we achieve industry-leading accuracy.

## Word-Level Timing

Our transcription includes precise timing for each word, enabling smooth caption animations and accurate clip boundaries.

## Continuous Improvement

We're constantly refining our transcription pipeline based on user feedback and new AI advancements.
		`,
	},
];

export function getBlogPost(slug: string): BlogPost | undefined {
	return blogPosts.find((post) => post.slug === slug && post.published);
}

export function getRelatedPosts(currentSlug: string, tags: string[]): BlogPost[] {
	return blogPosts
		.filter((post) => post.slug !== currentSlug && post.published)
		.filter((post) => post.tags.some((tag) => tags.includes(tag)))
		.slice(0, 3);
}
