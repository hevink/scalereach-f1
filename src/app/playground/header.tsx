"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoWithText } from "@/components/ui/logo";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleAccordion = (item: string) => {
        setOpenAccordion(openAccordion === item ? null : item);
    };

    return (
        <header role="banner">
            <div className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="relative flex flex-wrap items-center justify-between lg:py-3">
                        <div className="flex justify-between gap-8 max-lg:h-14 max-lg:w-full max-lg:border-b max-lg:border-border/40">
                            <a aria-label="home" className="flex items-center space-x-2" href="/">
                                <Logo />
                            </a>
                            <nav className="absolute inset-0 m-auto size-fit hidden lg:block">
                                <ul className="flex items-center gap-3">
                                    <li><NavLink href="#">Product</NavLink></li>
                                    <li><NavLink href="/pricing">Pricing</NavLink></li>
                                    <li><NavLink href="#">Company</NavLink></li>
                                </ul>
                            </nav>
                            <button
                                aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
                                onClick={toggleMenu}
                                className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 lg:hidden"
                            >
                                <div className="relative h-5 w-5 flex items-center justify-center">
                                    <span
                                        className={`absolute h-0.5 w-5 bg-current transition-all duration-300 origin-center ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`}
                                    />
                                    <span
                                        className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${isMenuOpen ? "opacity-0 scale-0" : ""}`}
                                    />
                                    <span
                                        className={`absolute h-0.5 w-5 bg-current transition-all duration-300 origin-center ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`}
                                    />
                                </div>
                            </button>
                        </div>
                        <div className="hidden lg:flex items-center gap-3">
                            <ContinueButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-background lg:hidden"
                    >
                        <motion.nav
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex flex-col pt-20 px-6"
                        >
                            {/* Product Accordion */}
                            <MobileAccordion
                                title="Product"
                                isOpen={openAccordion === "product"}
                                onToggle={() => toggleAccordion("product")}
                            >
                                <MobileSubLink href="#">AI Clip Detection</MobileSubLink>
                                <MobileSubLink href="#">Caption Styles</MobileSubLink>
                                <MobileSubLink href="#">Multi-Platform Export</MobileSubLink>
                                <MobileSubLink href="#">Brand Kit</MobileSubLink>
                            </MobileAccordion>

                            {/* Solutions Accordion */}
                            <MobileAccordion
                                title="Solutions"
                                isOpen={openAccordion === "solutions"}
                                onToggle={() => toggleAccordion("solutions")}
                            >
                                <MobileSubLink href="#">For Podcasters</MobileSubLink>
                                <MobileSubLink href="#">For YouTubers</MobileSubLink>
                                <MobileSubLink href="#">For Agencies</MobileSubLink>
                                <MobileSubLink href="#">For Enterprises</MobileSubLink>
                            </MobileAccordion>

                            {/* Direct Links */}
                            <MobileNavLink href="/pricing">Pricing</MobileNavLink>
                            <MobileNavLink href="#">Company</MobileNavLink>

                            {/* CTA Button */}
                            <div className="mt-8 pt-8 border-t border-border/40">
                                <a
                                    href="/sign-up"
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors"
                                >
                                    <span>Get Started Free</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </a>
                                <a
                                    href="/login"
                                    className="flex items-center justify-center w-full py-3 px-4 mt-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Sign In
                                </a>
                            </div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

function MobileAccordion({
    title,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-border/40">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-4 text-lg font-medium"
            >
                <span>{title}</span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </motion.svg>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 pl-4 flex flex-col gap-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="flex items-center py-4 text-lg font-medium border-b border-border/40 hover:text-foreground/80 transition-colors"
        >
            {children}
        </a>
    );
}

function MobileSubLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="text-muted-foreground hover:text-foreground transition-colors"
        >
            {children}
        </a>
    );
}

function Logo() {
    return <LogoWithText />;
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="inline-flex h-8 items-center justify-center rounded-md px-4 py-1 text-sm text-muted-foreground font-medium hover:bg-foreground/5 hover:text-foreground transition-colors"
        >
            {children}
        </a>
    );
}

function ContinueButton() {
    return (
        <a className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors hover:bg-foreground/5 hover:text-foreground h-9 px-4 py-2 rounded-full pr-2.5" href="/login">
            <span>Continue</span>
            <span className="bg-card ring-border text-primary flex size-5 rounded-full ring-1 shadow-xs items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </svg>
            </span>
        </a>
    );
}
