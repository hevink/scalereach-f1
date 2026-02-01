import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getRelatedPosts, blogPosts, type BlogPost } from "../blog-data";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

export function generateStaticParams() {
    return blogPosts
        .filter((post) => post.published)
        .map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getBlogPost(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    return {
        title: `${post.title} | ScaleReach Blog`,
        description: post.description,
    };
}

function RelatedArticles({ currentSlug, tags }: { currentSlug: string; tags: string[] }) {
    const relatedPosts = getRelatedPosts(currentSlug, tags);

    if (relatedPosts.length === 0) return null;

    return (
        <section className="mt-16">
            <h2 className="mb-6 font-medium text-xl">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {relatedPosts.map((post) => {
                    const date = new Date(post.date);
                    return (
                        <Link
                            className="group flex flex-col gap-3 border border-border/50 border-dashed bg-muted/30 p-5 transition-colors hover:bg-muted/50"
                            href={`/playground2/blog/${post.slug}`}
                            key={post.slug}
                        >
                            <h3 className="line-clamp-2 font-medium tracking-tight transition-colors group-hover:text-primary">
                                {post.title}
                            </h3>
                            <p className="line-clamp-2 text-muted-foreground text-sm">
                                {post.description}
                            </p>
                            <time
                                className="mt-auto font-mono text-muted-foreground text-xs"
                                dateTime={post.date}
                            >
                                {format(date, "MMM d, yyyy")}
                            </time>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function renderContent(content: string) {
    const lines = content.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
        if (currentList.length > 0 && listType) {
            const ListTag = listType;
            elements.push(
                <ListTag key={elements.length} className={listType === "ul" ? "list-disc ml-6 my-4 space-y-2" : "list-decimal ml-6 my-4 space-y-2"}>
                    {currentList.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ListTag>
            );
            currentList = [];
            listType = null;
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("# ")) {
            flushList();
            elements.push(
                <h1 key={elements.length} className="text-3xl font-bold mt-8 mb-4 first:mt-0">
                    {trimmed.slice(2)}
                </h1>
            );
        } else if (trimmed.startsWith("## ")) {
            flushList();
            elements.push(
                <h2 key={elements.length} className="text-2xl font-semibold mt-8 mb-4">
                    {trimmed.slice(3)}
                </h2>
            );
        } else if (trimmed.startsWith("### ")) {
            flushList();
            elements.push(
                <h3 key={elements.length} className="text-xl font-medium mt-6 mb-3">
                    {trimmed.slice(4)}
                </h3>
            );
        } else if (trimmed.startsWith("- ")) {
            if (listType !== "ul") {
                flushList();
                listType = "ul";
            }
            currentList.push(trimmed.slice(2));
        } else if (/^\d+\. /.test(trimmed)) {
            if (listType !== "ol") {
                flushList();
                listType = "ol";
            }
            currentList.push(trimmed.replace(/^\d+\. /, ""));
        } else if (trimmed === "") {
            flushList();
        } else {
            flushList();
            elements.push(
                <p key={elements.length} className="text-foreground/80 leading-relaxed my-4">
                    {trimmed}
                </p>
            );
        }
    }

    flushList();
    return elements;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getBlogPost(slug);

    if (!post) {
        notFound();
    }

    const formattedDate = format(new Date(post.date), "MMMM d, yyyy");

    // Find prev/next posts
    const publishedPosts = blogPosts.filter((p) => p.published);
    const currentIndex = publishedPosts.findIndex((p) => p.slug === slug);
    const prevPost = currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null;
    const nextPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;

    return (
        <div className="min-h-screen bg-background">
            <article className="flex flex-col py-20 pb-40">
                <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
                    {/* Back link */}
                    <Link
                        className="mt-10 mb-8 inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                        href="/playground2/blog"
                    >
                        <IconArrowLeft className="size-4" />
                        Back to Blog
                    </Link>

                    {/* Header */}
                    <header className="mb-8">
                        {/* Tags */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center border border-border/50 rounded-full px-3 py-1 text-sm text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="mb-4 text-balance font-medium text-3xl tracking-tight md:text-4xl">
                            {post.title}
                        </h1>

                        {/* Description */}
                        <p className="mb-6 text-lg text-muted-foreground">{post.description}</p>

                        {/* Author & Date */}
                        <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted font-medium">
                                {post.author.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{post.author}</span>
                                <time className="text-muted-foreground text-sm" dateTime={post.date}>
                                    {formattedDate}
                                </time>
                            </div>
                        </div>
                    </header>

                    {/* Hero Image Placeholder */}
                    <div className="mb-12 aspect-video border border-border/50 border-dashed bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground">Featured Image</span>
                    </div>

                    {/* Content */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {renderContent(post.content)}
                    </div>

                    {/* Tags at bottom */}
                    <div className="my-12 border-t border-dashed border-border/50" />

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-sm">Tagged:</span>
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center border border-border/50 rounded-full px-3 py-1 text-sm text-muted-foreground"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Related Articles */}
                    <RelatedArticles currentSlug={slug} tags={post.tags} />

                    {/* Navigation */}
                    <div className="my-12 border-t border-dashed border-border/50" />

                    <nav className="flex items-center justify-between gap-4">
                        {prevPost ? (
                            <Link
                                href={`/playground2/blog/${prevPost.slug}`}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-border/50 rounded-md text-sm hover:bg-muted/50 transition-colors"
                            >
                                <IconArrowLeft className="size-4" />
                                <span className="hidden sm:inline truncate max-w-[200px]">
                                    {prevPost.title}
                                </span>
                                <span className="sm:hidden">Previous</span>
                            </Link>
                        ) : (
                            <div />
                        )}
                        {nextPost ? (
                            <Link
                                href={`/playground2/blog/${nextPost.slug}`}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-border/50 rounded-md text-sm hover:bg-muted/50 transition-colors"
                            >
                                <span className="hidden sm:inline truncate max-w-[200px]">
                                    {nextPost.title}
                                </span>
                                <span className="sm:hidden">Next</span>
                                <IconArrowRight className="size-4" />
                            </Link>
                        ) : (
                            <div />
                        )}
                    </nav>
                </div>
            </article>
        </div>
    );
}
