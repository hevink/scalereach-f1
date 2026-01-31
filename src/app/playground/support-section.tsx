import { Mail, MessageCircleQuestion } from "lucide-react";

export function SupportSection() {
    return (
        <section className="bg-background py-24">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="text-primary bg-primary/5 border-primary/10 rounded-full border px-2 py-1 text-sm font-medium">
                        Support
                    </span>
                    <h1 className="mt-4 text-balance text-4xl font-semibold md:text-5xl lg:text-6xl lg:tracking-tight">
                        How can we help?
                    </h1>
                    <p className="text-muted-foreground mt-4 text-balance text-lg">
                        Find answers to your questions and get support for our services.
                    </p>

                    <div className="ring-border bg-card/25 @xl:grid-cols-2 @max-xl:divide-y @xl:divide-x relative mx-auto mt-12 grid max-w-xl overflow-hidden rounded-xl text-left shadow-md ring-1 *:p-6">
                        {/* Contact Sales */}
                        <div className="row-span-4 grid grid-rows-subgrid gap-4">
                            <div className="bg-card/25 ring-border flex size-8 rounded-md text-emerald-600 shadow shadow-emerald-500/25 ring-1">
                                <Mail className="m-auto size-4 *:fill-emerald-500/15" />
                            </div>
                            <h2 className="font-medium">Contact Sales</h2>
                            <p className="text-muted-foreground text-balance">
                                Get in touch with our sales team for more information.
                            </p>
                            <button className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 h-8 rounded-md px-3 text-xs w-full">
                                <a href="#link">Talk to sales</a>
                            </button>
                        </div>

                        {/* Help and Support */}
                        <div className="row-span-4 grid grid-rows-subgrid gap-4">
                            <div className="bg-card/25 ring-border flex size-8 rounded-md text-indigo-600 shadow shadow-indigo-500/25 ring-1">
                                <MessageCircleQuestion className="m-auto size-4 *:fill-indigo-500/15" />
                            </div>
                            <h2 className="text-lg font-medium">Help and Support</h2>
                            <p className="text-muted-foreground text-balance">
                                Find answers to your questions and get support for our services.
                            </p>
                            <button className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 h-8 rounded-md px-3 text-xs w-full">
                                <a href="#link">Contact Support</a>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
