import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogPosts, type BlogPost } from "./blog-data";

export const metadata = {
    title: "Blog | ScaleReach",
    description: "Insights, tutorials, and updates about video editing and content creation.",
};

function BlogHero({ post }: { post: BlogPost }) {
    const date = new Date(post.date);

    return (
        <Link
            className="group relative grid border border-border/50 border-dashed bg-muted/30 transition-colors hover:bg-muted/50 md:grid-cols-2"
            href={`/playground2/blog/${post.slug}`}
        >
            <div className="aspect-video md:aspect-4/3 bg-muted relative overflow-hidden">
                {post.image ? (
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
                )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                        <span
                            className="inline-flex items-center border border-border/50 border-dashed bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs"
                            key={tag}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <h2 className="font-medium text-2xl tracking-tight md:text-3xl">
                    {post.title}
                </h2>
                <p className="line-clamp-3 text-muted-foreground">
                    {post.description}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted font-medium text-sm">
                        {post.author.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{post.author}</span>
                        <time
                            className="font-mono text-muted-foreground text-xs"
                            dateTime={post.date}
                        >
                            {format(date, "MMM d, yyyy")}
                        </time>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function BlogCard({ post, className }: { post: BlogPost; className?: string }) {
    const date = new Date(post.date);

    return (
        <Link
            className={cn(
                "group flex flex-col bg-muted/30 transition-colors hover:bg-muted/50",
                className
            )}
            href={`/playground2/blog/${post.slug}`}
        >
            <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                <h3 className="line-clamp-2 font-medium text-lg tracking-tight md:text-xl">
                    {post.title}
                </h3>
                <p className="line-clamp-3 text-muted-foreground text-sm">
                    {post.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted font-medium text-xs">
                            {post.author.charAt(0)}
                        </div>
                        <span className="text-muted-foreground text-sm">
                            {post.author}
                        </span>
                    </div>
                    <time
                        className="font-mono text-muted-foreground text-xs"
                        dateTime={post.date}
                    >
                        {format(date, "MMM d, yyyy")}
                    </time>
                </div>
            </div>
        </Link>
    );
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={cn("relative", className)}>
            <div className="absolute top-0 left-0 right-0 border-t border-dashed border-border/50" />
            {children}
            <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-border/50" />
        </section>
    );
}

function getAllTags(): string[] {
    const tags = new Set<string>();
    for (const post of blogPosts) {
        for (const tag of post.tags) {
            tags.add(tag);
        }
    }
    return Array.from(tags);
}

export default function BlogPage() {
    const publishedPosts = blogPosts.filter((post) => post.published);
    const heroPost = publishedPosts.find((post) => post.featured) || publishedPosts[0];
    const remainingPosts = publishedPosts.filter((post) => post !== heroPost);

    return (
        <div className="min-h-screen bg-background">
            <div className="flex flex-col py-20 pb-40">
                <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
                    {/* Header */}
                    <header className="mb-12">
                        <h1 className="mb-6 font-medium text-4xl tracking-tight">Blog</h1>
                        <div className="flex flex-wrap gap-2">
                            {getAllTags().map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center border border-border/50 rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </header>

                    {/* Hero Section */}
                    {heroPost && (
                        <Section className="mb-12">
                            <BlogHero post={heroPost} />
                        </Section>
                    )}

                    {/* Grid */}
                    {remainingPosts.length > 0 && (
                        <div className="mb-12 flex flex-col gap-12">
                            {Array.from(
                                { length: Math.ceil(remainingPosts.length / 3) },
                                (_, rowIndex) => {
                                    const rowPosts = remainingPosts.slice(
                                        rowIndex * 3,
                                        rowIndex * 3 + 3
                                    );
                                    return (
                                        <Section className="grid md:grid-cols-3" key={rowIndex}>
                                            {rowPosts.map((post, index) => (
                                                <BlogCard
                                                    className={cn(
                                                        "border-border/50 border-b border-dashed last:border-b-0 md:border-b-0",
                                                        "md:border-border/50 md:border-l md:border-dashed",
                                                        index === rowPosts.length - 1 &&
                                                        "md:border-border/50 md:border-r md:border-dashed"
                                                    )}
                                                    key={post.slug}
                                                    post={post}
                                                />
                                            ))}
                                        </Section>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
