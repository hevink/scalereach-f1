"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

type BillingPeriod = "monthly" | "annually";

const plans = {
    starter: {
        name: "Starter",
        description: "Perfect for creators just getting started with short-form content",
        monthly: 29,
        annually: 23,
        features: [
            "Upload 10 videos monthly",
            "Up to 45 min long videos",
            "Generate 100 clips monthly",
            "HD download quality",
            "Auto captions",
            "Basic templates",
        ],
        featured: false,
    },
    pro: {
        name: "Pro",
        description: "For serious creators who need more power and flexibility",
        monthly: 79,
        annually: 63,
        features: [
            "Everything in Starter, plus:",
            "Upload 30 videos monthly",
            "Up to 2 hours long videos",
            "Generate 300 clips monthly",
            "4K download quality",
            "AI Dubbing (29 languages)",
            "Priority processing",
            "Advanced templates",
            "Remove watermark",
        ],
        featured: true,
    },
    proPlus: {
        name: "Pro+",
        description: "For agencies and teams with high-volume content needs",
        monthly: 189,
        annually: 151,
        features: [
            "Everything in Pro, plus:",
            "Upload 100 videos monthly",
            "Up to 3 hours long videos",
            "Generate 1000 clips monthly",
            "4K download quality",
            "AI Dubbing (29 languages)",
            "Fastest processing",
            "Custom branding",
            "API access",
            "Dedicated support",
        ],
        featured: false,
    },
};

const enterpriseFeatures = [
    "Unlimited video uploads",
    "Unlimited clip generation",
    "Custom video length limits",
    "White-label solution",
    "Custom AI training",
    "Dedicated account manager",
    "SLA guarantee",
    "Custom integrations",
    "Team collaboration",
];

export function PricingSection() {
    const [period, setPeriod] = useState<BillingPeriod>("annually");

    return (
        <section className="bg-background relative py-24">
            <div className="mx-auto max-w-5xl px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl lg:tracking-tight">
                        Simple pricing for every creator
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
                        Turn your long-form content into viral clips. No hidden fees, cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="my-12">
                        <div className="bg-foreground/5 relative mx-auto grid w-fit grid-cols-2 rounded-full p-1">
                            <motion.div
                                className="bg-card ring-foreground/5 pointer-events-none absolute inset-1 w-[calc(50%-4px)] rounded-full border border-transparent shadow ring-1"
                                animate={{ x: period === "monthly" ? 0 : "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <button
                                onClick={() => setPeriod("monthly")}
                                className={`relative z-10 block h-8 w-24 rounded-full text-sm transition-colors ${period === "monthly" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setPeriod("annually")}
                                className={`relative z-10 block h-8 w-24 rounded-full text-sm transition-colors ${period === "annually" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                    }`}
                            >
                                Annually
                            </button>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 text-center text-xs"
                        >
                            <span className="text-primary font-medium">Save 20%</span> with annual billing
                        </motion.div>
                    </div>
                </motion.div>

                {/* Pricing Cards Container */}
                <div className="@container">
                    <div className="@max-4xl:max-w-sm relative mx-auto border">
                        {/* Corner decorations */}
                        <CornerDecoration position="top-left" />
                        <CornerDecoration position="top-right" />
                        <CornerDecoration position="bottom-left" />
                        <CornerDecoration position="bottom-right" />

                        {/* Main pricing cards */}
                        <div className="relative mx-auto border-b">
                            <CornerDecoration position="bottom-left" />
                            <div className="@4xl:grid-cols-3 grid">
                                {Object.entries(plans).map(([key, plan], index) => (
                                    <PricingCard
                                        key={key}
                                        plan={plan}
                                        period={period}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Enterprise section */}
                        <EnterpriseSection />
                    </div>
                </div>
            </div>
        </section>
    );
}


function PricingCard({
    plan,
    period,
    index,
}: {
    plan: typeof plans.starter;
    period: BillingPeriod;
    index: number;
}) {
    const price = period === "monthly" ? plan.monthly : plan.annually;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`@max-4xl:p-9 row-span-4 grid grid-rows-subgrid gap-8 p-8 ${plan.featured
                ? "rounded-[--radius] ring-border bg-card @4xl:my-2 @max-4xl:mx-1 shadow-black/6.5 shadow-xl ring-1 backdrop-blur"
                : ""
                }`}
        >
            {/* Plan name and description */}
            <div className="self-end">
                <div className="tracking-tight text-lg font-medium">{plan.name}</div>
                <div className="text-muted-foreground mt-1 text-balance text-sm">
                    {plan.description}
                </div>
            </div>

            {/* Price */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${plan.name}-${period}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl font-semibold"
                    >
                        ${price}
                    </motion.div>
                </AnimatePresence>
                <div className="text-muted-foreground text-sm">Per month, billed {period}</div>
            </div>

            {/* CTA Button */}
            <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 w-full ${plan.featured
                    ? "shadow-md border-[0.5px] border-white/10 shadow-black/15 bg-primary text-primary-foreground hover:bg-primary/90"
                    : "shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50"
                    }`}
                href="/sign-up"
            >
                Start Free Trial
            </motion.a>

            {/* Features list */}
            <ul role="list" className="space-y-3 text-sm">
                {plan.features.map((feature, i) => (
                    <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="group flex items-center gap-2 first:font-medium"
                    >
                        <Check className="text-muted-foreground size-3 group-first:hidden" strokeWidth={3.5} />
                        {feature}
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}

function EnterpriseSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative mt-6"
        >
            <CornerDecoration position="top-right" />
            <div className="@4xl:grid-cols-3 @max-4xl:divide-y @4xl:divide-x grid border-t">
                <div className="space-y-6 p-8">
                    <div className="self-end">
                        <div className="tracking-tight text-lg font-medium">Enterprise</div>
                        <div className="text-muted-foreground mt-1 text-balance text-sm">
                            For media companies and agencies with custom requirements and high-volume needs.
                        </div>
                    </div>
                    <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50 h-9 px-4 py-2 @max-4xl:w-full"
                        href="#"
                    >
                        Contact Sales
                    </motion.a>
                </div>
                <div className="col-span-2 p-8">
                    <ul role="list" className="@4xl:grid-cols-2 grid gap-x-14 gap-y-3 text-sm">
                        {enterpriseFeatures.map((feature, i) => (
                            <motion.li
                                key={feature}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className="flex items-center gap-2"
                            >
                                <Check className="text-muted-foreground size-3" strokeWidth={3.5} />
                                {feature}
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}

function CornerDecoration({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
    const positionClasses = {
        "top-left": "-translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "top-right": "right-0 translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "bottom-left": "bottom-0 -translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
        "bottom-right": "bottom-0 right-0 translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
    };

    return (
        <div
            aria-hidden="true"
            className={`mask-radial-from-15% before:bg-foreground/25 after:bg-foreground/25 absolute size-3 before:absolute before:inset-0 before:m-auto before:h-px after:absolute after:inset-0 after:m-auto after:w-px ${positionClasses[position]}`}
        />
    );
}
