"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqCategories = [
    {
        title: "Getting Started",
        items: [
            {
                question: "How does the AI clip generation work?",
                answer: "Our AI analyzes your video content to identify the most engaging moments - viral hooks, emotional peaks, and key insights. It then automatically creates short clips optimized for each social platform with proper aspect ratios and captions.",
            },
            {
                question: "What video formats do you support?",
                answer: "We support all major video formats including MP4, MOV, AVI, and MKV. You can also paste YouTube links directly and we'll process the video for you.",
            },
            {
                question: "How long does it take to generate clips?",
                answer: "Most videos are processed within 5-10 minutes. Pro and Pro+ users get priority processing, which can reduce this to 2-3 minutes for most videos.",
            },
        ],
    },
    {
        title: "Features",
        items: [
            {
                question: "Can I edit the generated clips?",
                answer: "Yes! You can trim clips, adjust captions, change styles, and customize branding. Our editor lets you fine-tune every clip before downloading.",
            },
            {
                question: "What is AI Dubbing?",
                answer: "AI Dubbing automatically translates and dubs your clips into 29 different languages, helping you reach a global audience. Available on Pro and Pro+ plans.",
            },
            {
                question: "Do clips have watermarks?",
                answer: "Free trial clips include a small watermark. Pro and Pro+ plans allow you to remove watermarks and add your own custom branding.",
            },
        ],
    },
    {
        title: "Billing",
        items: [
            {
                question: "Can I cancel anytime?",
                answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
            },
            {
                question: "Do unused credits roll over?",
                answer: "Video uploads and clip credits reset each month and don't roll over. We recommend choosing a plan that matches your monthly content needs.",
            },
            {
                question: "Is there a free trial?",
                answer: "Yes! All new users get a 7-day free trial with access to Pro features. No credit card required to start.",
            },
        ],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const },
    },
};

export function FAQSection() {
    const [openItems, setOpenItems] = useState<string[]>(["Getting Started-0"]);

    const toggleItem = (id: string) => {
        setOpenItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <section className="bg-background py-24">
            <div className="mx-auto max-w-5xl px-1 md:px-6">
                <div className="grid max-md:gap-8 md:grid-cols-5 md:divide-x md:border">
                    {/* Left column - Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="max-w-lg max-md:px-6 md:col-span-2 md:p-10 lg:p-12"
                    >
                        <h2 className="text-foreground text-4xl font-semibold">FAQs</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">
                            Everything you need to know about creating viral clips
                        </p>
                        <p className="text-muted-foreground mt-6 max-md:hidden">
                            Still have questions? Contact our{" "}
                            <a className="text-primary font-medium hover:underline" href="#">
                                support team
                            </a>
                        </p>
                    </motion.div>

                    {/* Right column - Accordions */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-12 md:col-span-3 md:px-4 md:pb-4 md:pt-10 lg:pt-12"
                    >
                        {faqCategories.map((category, categoryIndex) => (
                            <motion.div key={category.title} variants={itemVariants} className="space-y-2">
                                <motion.h3
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                                    className="text-foreground pl-6 text-lg font-semibold mb-4"
                                >
                                    {category.title}
                                </motion.h3>
                                <div className="space-y-2">
                                    {category.items.map((item, index) => {
                                        const itemId = `${category.title}-${index}`;
                                        const isOpen = openItems.includes(itemId);

                                        return (
                                            <FAQItem
                                                key={itemId}
                                                item={item}
                                                isOpen={isOpen}
                                                onToggle={() => toggleItem(itemId)}
                                                delay={categoryIndex * 0.1 + index * 0.05}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Mobile support link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-muted-foreground mt-12 px-6 md:hidden"
                >
                    Still have questions? Contact our{" "}
                    <a className="text-primary font-medium hover:underline" href="#">
                        support team
                    </a>
                </motion.p>
            </div>
        </section>
    );
}


function FAQItem({
    item,
    isOpen,
    onToggle,
    delay,
}: {
    item: { question: string; answer: string };
    isOpen: boolean;
    onToggle: () => void;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay }}
        >
            <motion.div
                className="rounded-xl px-6 py-1 overflow-hidden"
                animate={{
                    backgroundColor: isOpen ? "var(--card)" : "transparent",
                    boxShadow: isOpen
                        ? "0 1px 2px 0 rgb(0 0 0 / 0.05)"
                        : "0 0 0 0 rgb(0 0 0 / 0)",
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{
                    border: isOpen ? "1px solid var(--border)" : "1px solid transparent",
                }}
            >
                <button
                    onClick={onToggle}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                    <span className="text-base font-medium text-foreground">
                        {item.question}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    </motion.div>
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                height: { duration: 0.3, ease: "easeInOut" },
                                opacity: { duration: 0.2, ease: "easeInOut" },
                            }}
                        >
                            <motion.p
                                initial={{ y: -10 }}
                                animate={{ y: 0 }}
                                exit={{ y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-muted-foreground text-base pb-4"
                            >
                                {item.answer}
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
