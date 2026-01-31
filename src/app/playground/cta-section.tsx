import Image from "next/image";

export function CTASection() {
    return (
        <section id="cta" className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
            <div className="w-full max-w-5xl">
                <div className="h-[400px] md:h-[400px] overflow-hidden shadow-xl w-full border border-border rounded-xl bg-[#155dfc] relative z-20">
                    <Image
                        alt="CTA Background"
                        fill
                        className="absolute inset-0 w-full h-full object-cover object-right md:object-center"
                        sizes="100vw"
                        src="/cta-background.webp"
                    />
                    <div className="absolute inset-0 -top-32 md:-top-40 flex flex-col items-center justify-center">
                        <h1 className="text-white text-4xl md:text-7xl font-medium tracking-tighter max-w-xs md:max-w-xl text-center">
                            Start creating viral clips today
                        </h1>
                        <div className="absolute bottom-10 flex flex-col items-center justify-center gap-2">
                            <a
                                className="bg-white text-black font-semibold text-sm h-10 w-fit px-6 rounded-full flex items-center justify-center shadow-md"
                                href="/sign-up"
                            >
                                Start Your 7-Day Free Trial
                            </a>
                            <span className="text-white text-sm">
                                No credit card required
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
