export function StatsSection() {
    return (
        <section className="bg-background py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <h2 className="mx-auto max-w-2xl text-balance text-center text-3xl font-semibold lg:text-4xl">
                    Trusted by creators worldwide
                </h2>
                <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-pretty text-center text-lg">
                    Our platform helps creators <strong className="text-foreground font-semibold">turn long-form content into viral clips</strong> that drive engagement across all platforms.
                </p>

                <div className="relative mt-12">
                    {/* Corner decorations */}
                    <div aria-hidden="true" className="absolute size-3 -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute inset-0 m-auto h-px w-full bg-foreground/25" />
                        <div className="absolute inset-0 m-auto h-full w-px bg-foreground/25" />
                    </div>
                    <div aria-hidden="true" className="absolute right-0 size-3 translate-x-1/2 -translate-y-1/2">
                        <div className="absolute inset-0 m-auto h-px w-full bg-foreground/25" />
                        <div className="absolute inset-0 m-auto h-full w-px bg-foreground/25" />
                    </div>
                    <div aria-hidden="true" className="absolute bottom-0 right-0 size-3 translate-x-1/2 translate-y-1/2">
                        <div className="absolute inset-0 m-auto h-px w-full bg-foreground/25" />
                        <div className="absolute inset-0 m-auto h-full w-px bg-foreground/25" />
                    </div>
                    <div aria-hidden="true" className="absolute bottom-0 size-3 -translate-x-1/2 translate-y-1/2">
                        <div className="absolute inset-0 m-auto h-px w-full bg-foreground/25" />
                        <div className="absolute inset-0 m-auto h-full w-px bg-foreground/25" />
                    </div>

                    {/* Stats Grid */}
                    <div className="bg-card grid grid-cols-2 divide-x divide-border border lg:grid-cols-4">
                        <StatItem value="50K+" label="Videos processed" />
                        <StatItem value="1.2M+" label="Clips generated" />
                        <StatItem value="100K+" label="Hours saved" />
                        <StatItem value="8K+" label="Active creators" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="space-y-2 p-8 text-center hover:bg-foreground/[0.02] transition-colors">
            <div className="bg-gradient-to-t from-foreground to-muted-foreground bg-clip-text text-3xl font-medium text-transparent md:text-5xl">
                {value}
            </div>
            <p className="text-muted-foreground text-sm">{label}</p>
        </div>
    );
}
