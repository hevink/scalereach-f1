"use client";

import { cn } from "@/lib/utils";

type ActivityLevel = 0 | 1 | 2 | 3 | 4;

const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
    0: "bg-transparent",
    1: "bg-primary/10",
    2: "bg-primary/25",
    3: "bg-primary/40",
    4: "bg-primary/60",
};

function getActivityLevel(value: number): ActivityLevel {
    if (value === 0) return 0;
    if (value <= 2) return 1;
    if (value <= 4) return 2;
    if (value <= 6) return 3;
    return 4;
}

// Generate deterministic mock data for the activity graph
function generateActivityData(): number[][] {
    const weeks = 52;
    const days = 7;
    const data: number[][] = [];

    for (let w = 0; w < weeks; w++) {
        const week: number[] = [];
        for (let d = 0; d < days; d++) {
            // Create a pattern that looks realistic
            const seed = (w * 7 + d) % 17;
            const value = seed < 3 ? 0 : seed < 8 ? Math.floor(seed / 2) : seed < 12 ? seed - 5 : Math.floor(seed / 3);
            week.push(value);
        }
        data.push(week);
    }
    return data;
}

function ActivityCell({ count, weekIndex, dayIndex }: { count: number; weekIndex: number; dayIndex: number }) {
    const level = getActivityLevel(count);

    return (
        <div
            className={cn(
                "aspect-square w-full",
                "border border-border/30 border-dashed",
                ACTIVITY_COLORS[level],
                level === 0 && "border-border/10"
            )}
            title={`Week ${weekIndex + 1}, Day ${dayIndex + 1}: ${count} commits`}
        />
    );
}

export function ChangelogHeader() {
    const activityData = generateActivityData();
    const totalCommits = activityData.flat().reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-col gap-6 py-8 md:py-12 border-b border-dashed border-border/50">
            <div className="flex flex-col gap-2 px-4 mx-auto max-w-4xl w-full">
                <h1 className="font-bold text-2xl md:text-3xl">Changelog</h1>
                <p className="text-muted-foreground">
                    We&apos;re shipping fast.{" "}
                    <span className="font-medium text-primary tabular-nums">
                        {totalCommits.toLocaleString()} commits
                    </span>{" "}
                    in the past year.
                </p>
            </div>

            <div className="w-full max-w-4xl mx-auto px-4">
                <div className="w-full p-3 md:p-4">
                    <div className="grid w-full grid-flow-col gap-0.5 md:gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)', gridTemplateColumns: 'repeat(52, 1fr)' }}>
                        {activityData.map((week, weekIndex) =>
                            week.map((dayCount, dayIndex) => (
                                <ActivityCell
                                    count={dayCount}
                                    dayIndex={dayIndex}
                                    key={`cell-${weekIndex}-${dayIndex}`}
                                    weekIndex={weekIndex}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 px-4 text-muted-foreground text-xs">
                <span>Less</span>
                <div className="flex gap-0.5">
                    {([0, 1, 2, 3, 4] as ActivityLevel[]).map((level) => (
                        <div
                            className={cn(
                                "size-2 md:size-2.5 lg:size-3",
                                "border border-border/30 border-dashed",
                                ACTIVITY_COLORS[level]
                            )}
                            key={level}
                        />
                    ))}
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
