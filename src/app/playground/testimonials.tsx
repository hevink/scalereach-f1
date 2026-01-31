import Image from "next/image";

export function Testimonials() {
    return (
        <section id="reviews" className="bg-background py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl text-balance text-center">
                    <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                        Loved by creators worldwide
                    </h2>
                    <p className="text-muted-foreground mb-6 md:mb-12 lg:mb-16">
                        Join thousands of podcasters, YouTubers, and content creators who use ScaleReach to grow their audience.
                    </p>
                </div>

                <div className="rounded-[--radius] border-border/50 relative lg:border">
                    <div className="lg:[&>*:nth-child(4)]:rounded-r-none lg:[&>*:nth-child(5)]:rounded-br-none lg:[&>*:nth-child(6)]:rounded-b-none lg:[&>*:nth-child(5)]:rounded-tl-none lg:[&>*:nth-child(3)]:rounded-l-none lg:[&>*:nth-child(2)]:rounded-tl-none lg:[&>*:nth-child(2)]:rounded-br-none lg:[&>*:nth-child(1)]:rounded-t-none grid gap-4 sm:grid-cols-2 sm:grid-rows-4 lg:grid-cols-3 lg:grid-rows-3 lg:gap-px">
                        {/* Regular testimonials */}
                        <TestimonialCard
                            quote="ScaleReach cut my editing time from 8 hours to 30 minutes. The AI picks out the best moments from my 2-hour podcasts and the clips actually go viral."
                            name="Alex Chen"
                            role="Tech Podcaster, 500K subscribers"
                            avatar="https://avatars.githubusercontent.com/u/55670723?v=4"
                        />
                        <TestimonialCard
                            quote="I was skeptical about AI-generated clips, but the quality is incredible. My Instagram Reels engagement increased by 300% in the first month."
                            name="Sarah Mitchell"
                            role="Fitness Creator"
                            avatar="https://avatars.githubusercontent.com/u/47919550?v=4"
                        />
                        <TestimonialCard
                            quote="The auto-captions are spot-on and the templates make my clips look professional. Best investment I've made for my content business."
                            name="Marcus Johnson"
                            role="Business Coach"
                            avatar="https://avatars.githubusercontent.com/u/31113941?v=4"
                        />
                        <TestimonialCard
                            quote="As a one-person team, I couldn't afford an editor. ScaleReach gives me agency-level clips at a fraction of the cost."
                            name="Emily Rodriguez"
                            role="Lifestyle Vlogger"
                            avatar="https://avatars.githubusercontent.com/u/99137927?v=4"
                        />
                        <TestimonialCard
                            quote="The AI dubbing feature helped me reach Spanish and Portuguese audiences. My international following grew 5x in 3 months."
                            name="David Park"
                            role="Educational Creator"
                            avatar="https://avatars.githubusercontent.com/u/68236786?v=4"
                        />
                        <TestimonialCard
                            quote="I upload my weekly podcast and get 10-15 ready-to-post clips. It's like having a full editing team on autopilot."
                            name="Jessica Taylor"
                            role="True Crime Podcaster"
                            avatar="https://avatars.githubusercontent.com/u/69605071?v=4"
                        />

                        {/* Featured testimonial */}
                        <FeaturedTestimonialCard
                            logo={<YouTubeLogo />}
                            quote="We've helped over 100 creators in our network adopt ScaleReach. The consistency and quality of clips has helped them grow their channels 3x faster than traditional editing workflows."
                            name="Michael Torres"
                            role="YouTube Partner Manager"
                            avatar="https://avatars.githubusercontent.com/u/4323180?v=4"
                            className="max-lg:rounded-[--radius] lg:rounded-tl-[--radius] lg:rounded-br-[--radius] row-start-1 lg:col-start-1"
                        />

                        {/* Featured testimonial */}
                        <FeaturedTestimonialCard
                            logo={<TikTokLogo />}
                            quote="ScaleReach understands what makes content go viral. The clips it generates consistently outperform my manually edited ones. My TikTok grew from 10K to 500K in 6 months."
                            name="Priya Sharma"
                            role="TikTok Creator, 500K followers"
                            avatar="https://avatars.githubusercontent.com/u/124599?v=4"
                            className="rounded-[--radius] row-start-3 sm:col-start-2 lg:row-start-2"
                        />

                        {/* Featured testimonial */}
                        <FeaturedTestimonialCard
                            logo={<SpotifyLogo />}
                            quote="Our podcast clips on social media drove a 40% increase in Spotify listens. ScaleReach makes repurposing content effortless and the ROI is incredible."
                            name="James Wilson"
                            role="Podcast Network Director"
                            avatar="https://avatars.githubusercontent.com/u/99137927?v=4"
                            className="rounded-[--radius] sm:row-start-2 lg:col-start-3 lg:row-start-3 lg:rounded-bl-none lg:rounded-tr-none"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}


function TestimonialCard({
    quote,
    name,
    role,
    avatar,
}: {
    quote: string;
    name: string;
    role: string;
    avatar: string;
}) {
    return (
        <div className="bg-card/25 rounded-[--radius] ring-foreground/[0.07] flex flex-col justify-end gap-6 border border-transparent p-8 ring-1">
            <p className="text-foreground self-end text-balance before:mr-1 before:content-['\201C'] after:ml-1 after:content-['\201D']">
                {quote}
            </p>
            <div className="flex items-center gap-3">
                <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
                    <Image
                        alt={name}
                        loading="lazy"
                        width={120}
                        height={120}
                        className="h-full w-full object-cover"
                        src={avatar}
                    />
                </div>
                <div className="space-y-px">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-muted-foreground text-xs">{role}</p>
                </div>
            </div>
        </div>
    );
}

function FeaturedTestimonialCard({
    logo,
    quote,
    name,
    role,
    avatar,
    className,
}: {
    logo: React.ReactNode;
    quote: string;
    name: string;
    role: string;
    avatar: string;
    className?: string;
}) {
    return (
        <div className={`bg-card ring-foreground/5 flex flex-col justify-between gap-6 border border-transparent p-8 shadow-lg shadow-black/10 ring-1 ${className}`}>
            <div className="space-y-6">
                {logo}
                <p>&quot;{quote}&quot;</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
                    <Image
                        alt={name}
                        loading="lazy"
                        width={120}
                        height={120}
                        className="h-full w-full object-cover"
                        src={avatar}
                    />
                </div>
                <div className="space-y-px">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-muted-foreground text-xs">{role}</p>
                </div>
            </div>
        </div>
    );
}

function YouTubeLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="18" viewBox="0 0 90 20">
            <path fill="#FF0000" d="M27.973 18.765c-.908.606-2.27.909-4.09.909h-6.66V.606h7.27c1.515 0 2.726.303 3.635.909.909.606 1.363 1.515 1.363 2.726 0 .909-.303 1.666-.757 2.272-.454.606-1.06 1.06-1.818 1.363.909.152 1.666.606 2.272 1.212.606.606.909 1.515.909 2.575 0 1.363-.454 2.423-1.363 3.18l.239-.078ZM21.313 3.938v4.544h2.726c.757 0 1.363-.152 1.818-.606.454-.303.606-.909.606-1.666 0-.757-.152-1.212-.606-1.666-.454-.303-1.06-.606-1.818-.606h-2.726Zm0 7.876v5.15h3.18c.757 0 1.363-.152 1.818-.606.454-.454.757-1.06.757-1.97 0-.908-.303-1.514-.757-1.968-.454-.454-1.06-.606-1.818-.606h-3.18Z" />
            <path fill="currentColor" d="M42.1 19.674h-4.09l-4.847-7.27v7.27h-4.09V.606h4.09v6.966l4.696-6.966h4.393l-5.302 7.573 5.15 11.495ZM56.53.606v4.09h-4.09v15h-4.09v-15h-4.09V.606h12.27ZM70.96.606v4.09h-4.09v15h-4.09v-15h-4.09V.606h12.27Z" />
            <path fill="#FF0000" d="M8.74 0C3.893 0 0 3.893 0 8.74v2.52c0 4.847 3.893 8.74 8.74 8.74 4.847 0 8.74-3.893 8.74-8.74V8.74C17.48 3.893 13.587 0 8.74 0Zm5.15 11.26c0 2.878-2.272 5.15-5.15 5.15-2.878 0-5.15-2.272-5.15-5.15V8.74c0-2.878 2.272-5.15 5.15-5.15 2.878 0 5.15 2.272 5.15 5.15v2.52Z" />
            <path fill="#FF0000" d="m6.468 6.468 4.544 3.03-4.544 3.03V6.468Z" />
        </svg>
    );
}

function TikTokLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="20" viewBox="0 0 118 32">
            <path fill="currentColor" d="M9.875 12.917v-1.458a9.09 9.09 0 0 0-1.333-.104C3.833 11.354 0 15.188 0 19.896s3.833 8.542 8.542 8.542c.458 0 .896-.042 1.333-.104v-4.75a3.79 3.79 0 0 1-1.333.25c-2.104 0-3.792-1.688-3.792-3.792s1.688-3.792 3.792-3.792c.458 0 .896.083 1.333.25v-3.583Z" />
            <path fill="#25F4EE" d="M10.333 28.917v-4.75c.438.167.896.25 1.334.25 2.104 0 3.791-1.688 3.791-3.792V4.583h4.167v.417c0 .208.021.417.042.625.125.917.458 1.75.958 2.458a5.39 5.39 0 0 0 2.917 2.042v4.167a9.38 9.38 0 0 1-5.5-1.75v8.083c0 4.708-3.833 8.542-8.542 8.542-.458 0-.896-.042-1.333-.104.437.104.896.146 1.333.146 4.709 0 8.542-3.833 8.542-8.542v-8.083a9.38 9.38 0 0 0 5.5 1.75V9.917a5.39 5.39 0 0 1-2.917-2.042 5.39 5.39 0 0 1-.958-2.458 4.17 4.17 0 0 1-.042-.625V4.375h-4.167v16.25c0 2.104-1.687 3.792-3.791 3.792-.438 0-.896-.083-1.334-.25v4.75Z" />
            <path fill="#FE2C55" d="M8.542 11.354c-4.709 0-8.542 3.833-8.542 8.542s3.833 8.542 8.542 8.542c.458 0 .896-.042 1.333-.104v-4.75a3.79 3.79 0 0 1-1.333.25c-2.104 0-3.792-1.688-3.792-3.792s1.688-3.792 3.792-3.792c.458 0 .896.083 1.333.25v-4.75a9.09 9.09 0 0 0-1.333-.396Z" />
            <path fill="currentColor" d="M35.833 8.333h4.584v19.584h-4.584V8.333Zm2.292-6.666a2.92 2.92 0 0 1 2.917 2.916 2.92 2.92 0 0 1-2.917 2.917 2.92 2.92 0 0 1-2.917-2.917 2.92 2.92 0 0 1 2.917-2.916ZM44.375 8.333h4.375v2.709h.083c.917-1.834 2.834-3.209 5.334-3.209 3.791 0 6.041 2.084 6.041 6.334v13.75h-4.583v-12.5c0-2.459-1.125-3.709-3.25-3.709-2.334 0-3.625 1.584-3.625 4.167v12.042h-4.375V8.333ZM75.208 8.333h4.375v2.709h.084c.916-1.834 2.833-3.209 5.333-3.209 3.792 0 6.042 2.084 6.042 6.334v13.75h-4.584v-12.5c0-2.459-1.125-3.709-3.25-3.709-2.333 0-3.625 1.584-3.625 4.167v12.042h-4.375V8.333ZM63.75 8.333h4.583v19.584H63.75V8.333Zm2.292-6.666a2.92 2.92 0 0 1 2.916 2.916 2.92 2.92 0 0 1-2.916 2.917 2.92 2.92 0 0 1-2.917-2.917 2.92 2.92 0 0 1 2.917-2.916ZM95.625 8.333h4.583v2.709h.084c.916-1.834 2.833-3.209 5.333-3.209 3.792 0 6.042 2.084 6.042 6.334v13.75h-4.584v-12.5c0-2.459-1.125-3.709-3.25-3.709-2.333 0-3.625 1.584-3.625 4.167v12.042h-4.583V8.333Z" />
        </svg>
    );
}

function SpotifyLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="24" viewBox="0 0 559 168">
            <path fill="#1ED760" d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l.001-.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809.64-5.609-1.12-6.249-3.93-.643-2.81 1.11-5.61 3.926-6.25 31.9-7.288 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.802c-1.89 3.072-5.91 4.042-8.98 2.152-22.51-13.836-56.823-17.843-83.448-9.761-3.453 1.043-7.1-.903-8.148-4.35-1.04-3.453.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z" />
        </svg>
    );
}
