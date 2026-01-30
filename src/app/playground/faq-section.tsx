"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqCategories = [
    {
        title: "General",
        items: [
            {
                question: "How long does shipping take?",
                answer: "Standard shipping takes 3-5 business days, depending on your location. Express shipping options are available at checkout for 1-2 business day delivery.",
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. All transactions are secured with industry-standard encryption.",
            },
            {
                question: "Can I change or cancel my order?",
                answer: "You can modify or cancel your order within 1 hour of placing it. After that, please contact our support team and we'll do our best to accommodate your request.",
            },
        ],
    },
    {
        title: "Shipping",
        items: [
            {
                question: "Do you ship internationally?",
                answer: "Yes, we ship to over 100 countries worldwide. International shipping times vary by location, typically 7-14 business days.",
            },
            {
                question: "What is your return policy?",
                answer: "We offer a 30-day return policy for all unused items in their original packaging. Simply contact our support team to initiate a return.",
            },
            {
                question: "How can I track my order?",
                answer: "Once your order ships, you'll receive an email with a tracking number. You can use this to track your package on our website or the carrier's site.",
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
    const [openItems, setOpenItems] = useState<string[]>(["General-0"]);

    const toggleItem = (id: string) => {
        setOpenItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <section className="bg-background py-16 md:py-24">
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
                            Your questions answered
                        </p>
                        <p className="text-muted-foreground mt-6 max-md:hidden">
                            Can&apos;t find what you&apos;re looking for? Contact our{" "}
                            <a className="text-primary font-medium hover:underline" href="#">
                                customer support team
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
                    Can&apos;t find what you&apos;re looking for? Contact our{" "}
                    <a className="text-primary font-medium hover:underline" href="#">
                        customer support team
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
