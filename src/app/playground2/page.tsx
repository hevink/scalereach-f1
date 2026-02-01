import { format } from "date-fns";
import { ChangelogHeader } from "./changelog-header";
import { HighlightLine } from "./highlight-line";
import { changelogEntries, type ChangelogEntry, type ChangelogSection, type ChangelogItem } from "./changelog-data";

export const metadata = {
    title: "Changelog | ScaleReach",
    description: "All the latest updates, improvements, and fixes to ScaleReach.",
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="flex flex-col pt-20 pb-40">
                <ChangelogHeader />
                <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
                    <div className="flex flex-col">
                        {changelogEntries.map((entry: ChangelogEntry) => (
                            <article className="relative py-16" key={entry.version}>
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center border border-border/50 border-dashed bg-muted px-2.5 py-1 font-mono text-sm">
                                            {entry.version}
                                        </span>
                                        <time
                                            className="font-mono text-muted-foreground text-sm"
                                            dateTime={entry.date}
                                        >
                                            {format(new Date(entry.date), "MMM d, yyyy")}
                                        </time>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-8">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="mb-6 text-balance font-medium text-3xl">
                                            {entry.title}
                                        </h2>
                                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                                            {entry.sections.map((section: ChangelogSection) => (
                                                <div key={section.title} className="mb-8">
                                                    <h3 className="font-semibold text-xl mb-4">{section.title}</h3>
                                                    <ul className="space-y-3 list-none pl-0">
                                                        {section.items.map((item: ChangelogItem, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <HighlightLine variant={item.type}>
                                                                    {item.text}
                                                                </HighlightLine>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative w-full mt-8">
                                    <div className="w-full border-t border-dashed border-border/50" />
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
