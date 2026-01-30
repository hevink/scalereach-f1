import Image from "next/image";

export function Testimonials() {
    return (
        <section id="reviews" className="bg-background py-12 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl text-balance text-center">
                    <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                        What our customers are saying about Tailark Quartz
                    </h2>
                    <p className="text-muted-foreground mb-6 md:mb-12 lg:mb-16">
                        Join the increasing number of customers and advocates who rely on Tailark for seamless and effective user A/B testing.
                    </p>
                </div>

                <div className="rounded-[--radius] border-border/50 relative lg:border">
                    <div className="lg:[&>*:nth-child(4)]:rounded-r-none lg:[&>*:nth-child(5)]:rounded-br-none lg:[&>*:nth-child(6)]:rounded-b-none lg:[&>*:nth-child(5)]:rounded-tl-none lg:[&>*:nth-child(3)]:rounded-l-none lg:[&>*:nth-child(2)]:rounded-tl-none lg:[&>*:nth-child(2)]:rounded-br-none lg:[&>*:nth-child(1)]:rounded-t-none grid gap-4 sm:grid-cols-2 sm:grid-rows-4 lg:grid-cols-3 lg:grid-rows-3 lg:gap-px">
                        {/* Regular testimonials */}
                        <TestimonialCard
                            quote="The platform has dramatically improved our design workflow. We now prototype interfaces 40% faster while maintaining our high-quality standards. The developer experience is truly exceptional."
                            name="Yves Kalume"
                            role="Android Engineer, Moneco"
                            avatar="https://avatars.githubusercontent.com/u/55670723?v=4"
                        />
                        <TestimonialCard
                            quote="Integrating Tailark into our streaming platform was seamless. The performance gains were immediate, and our user engagement metrics have increased by 25% since implementation."
                            name="Meschac Irung"
                            role="Frontend Engineer, Hulu"
                            avatar="https://avatars.githubusercontent.com/u/47919550?v=4"
                        />
                        <TestimonialCard
                            quote="As a payment processor, security and reliability are paramount. Tailark delivers on both fronts, with robust testing capabilities that have helped us identify and resolve edge cases before deployment."
                            name="Bernard Ngandu"
                            role="Backend, Stripe"
                            avatar="https://avatars.githubusercontent.com/u/31113941?v=4"
                        />
                        <TestimonialCard
                            quote="The A/B testing capabilities have revolutionized how we roll out new features. We can now make data-driven decisions with confidence, leading to a 30% improvement in user retention."
                            name="Glodie Lukose"
                            role="Engineer, Prime Video"
                            avatar="https://avatars.githubusercontent.com/u/99137927?v=4"
                        />
                        <TestimonialCard
                            quote="Building Tailark has been a journey of continuous improvement. Seeing how our platform empowers developers to create better user experiences makes all the hard work worthwhile."
                            name="Theo Balick"
                            role="CTO, Tailark"
                            avatar="https://avatars.githubusercontent.com/u/68236786?v=4"
                        />
                        <TestimonialCard
                            quote="The component system in Tailark is a game-changer for UI development. It's helped us standardize our design language while maintaining the flexibility needed for complex interfaces."
                            name="Ras Micky"
                            role="Software Engineer"
                            avatar="https://avatars.githubusercontent.com/u/69605071?v=4"
                        />

                        {/* Featured testimonial with Tailwind logo */}
                        <FeaturedTestimonialCard
                            logo={<TailwindLogo />}
                            quote="We've streamlined our entire design process thanks to Tailark. The platform allows us to iterate faster and optimize our component library, leading to a more consistent user experience across all our projects."
                            name="Adam Wathan"
                            role="CEO, Tailwind Labs"
                            avatar="https://avatars.githubusercontent.com/u/4323180?v=4"
                            className="max-lg:rounded-[--radius] lg:rounded-tl-[--radius] lg:rounded-br-[--radius] row-start-1 lg:col-start-1"
                        />

                        {/* Featured testimonial with Hulu logo */}
                        <FeaturedTestimonialCard
                            logo={<HuluLogo />}
                            quote="Tailark has transformed how we approach frontend development at Hulu. The testing framework helped us reduce bugs by 40% and accelerated our feature deployment pipeline significantly."
                            name="Shadcn"
                            role="Frontend Engineer, Hulu"
                            avatar="https://avatars.githubusercontent.com/u/124599?v=4"
                            className="rounded-[--radius] row-start-3 sm:col-start-2 lg:row-start-2"
                        />

                        {/* Featured testimonial with Stripe logo */}
                        <FeaturedTestimonialCard
                            logo={<StripeLogo />}
                            quote="The analytics dashboard in Tailark gives us unprecedented visibility into user behavior. We've been able to make targeted improvements that increased our conversion rates by 18%."
                            name="Glodie Lukose"
                            role="Engineer, Stripe"
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

function TailwindLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 262 33" width="136" height="20">
            <path fill="#38BDF8" fillRule="evenodd" d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2Z" clipRule="evenodd" />
            <path fill="currentColor" fillRule="evenodd" d="M80.996 13.652h-4.712v9.12c0 2.432 1.596 2.394 4.712 2.242V28.7c-6.308.76-8.816-.988-8.816-5.928v-9.12h-3.496V9.7h3.496V4.596l4.104-1.216V9.7h4.712v3.952ZM98.958 9.7h4.104v19h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V9.7Zm-6.004 15.58c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08Zm16.948-18.43c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 0 1 2.622-2.622 2.629 2.629 0 0 1 2.622 2.622c0 1.406-1.178 2.622-2.622 2.622ZM107.85 28.7v-19h4.104v19h-4.104Zm8.854 0V.96h4.104V28.7h-4.104Zm30.742-19h4.332l-5.966 19h-4.028l-3.952-12.806-3.99 12.806h-4.028l-5.966-19h4.332l3.686 13.11 3.99-13.11h3.914l3.952 13.11 3.724-13.11Zm9.424-2.85c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 0 1 2.622-2.622 2.629 2.629 0 0 1 2.622 2.622c0 1.406-1.178 2.622-2.622 2.622Zm-2.052 21.85v-19h4.104v19h-4.104Zm18.848-19.494c4.256 0 7.296 2.888 7.296 7.828V28.7h-4.104V17.452c0-2.888-1.672-4.408-4.256-4.408-2.698 0-4.826 1.596-4.826 5.472V28.7h-4.104v-19h4.104v2.432c1.254-1.976 3.306-2.926 5.89-2.926ZM200.418 2.1h4.104v26.6h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V2.1Zm-6.004 23.18c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08Zm23.864 3.914c-5.738 0-10.032-4.37-10.032-9.994 0-5.662 4.294-9.994 10.032-9.994 3.724 0 6.954 1.938 8.474 4.902l-3.534 2.052c-.836-1.786-2.698-2.926-4.978-2.926-3.344 0-5.89 2.546-5.89 5.966 0 3.42 2.546 5.966 5.89 5.966 2.28 0 4.142-1.178 5.054-2.926l3.534 2.014c-1.596 3.002-4.826 4.94-8.55 4.94Zm15.314-14.25c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014Zm17.518 0c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014Z" clipRule="evenodd" />
        </svg>
    );
}

function HuluLogo() {
    return (
        <svg width="56" height="20" viewBox="0 0 251 83" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M153.602 82.4612H173.519V0.015625H153.602V82.4612ZM118.632 58.9549C118.632 61.8498 116.201 64.2815 113.306 64.2815H101.726C98.8314 64.2815 96.3998 61.8498 96.3998 58.9549C96.3998 57.797 96.3998 25.722 96.3998 25.722H76.4831V60.5761C76.4831 74.8188 85.6309 82.3454 99.063 82.3454H118.516C130.906 82.3454 138.433 73.4292 138.433 60.5761V25.722H118.516C118.632 25.722 118.632 57.9128 118.632 58.9549ZM230.605 25.722C230.605 25.722 230.605 57.9128 230.605 58.9549C230.605 61.8498 228.174 64.2815 225.279 64.2815H213.699C210.805 64.2815 208.373 61.8498 208.373 58.9549C208.373 57.797 208.373 25.722 208.373 25.722H188.456V60.5761C188.456 74.8188 197.604 82.3454 211.036 82.3454H230.49C242.88 82.3454 250.406 73.4292 250.406 60.5761V25.722H230.605ZM39.7763 25.722C39.7763 25.722 29.4706 25.722 27.039 25.722C22.523 25.722 20.3229 26.8799 20.3229 26.8799V0.015625H0.40625V82.3454H20.2071V49.2282C20.2071 46.3334 22.6388 43.9017 25.5336 43.9017H37.1131C40.0079 43.9017 42.4396 46.3334 42.4396 49.2282V82.4612H62.3562V46.5649C62.3562 31.5117 52.2821 25.722 39.7763 25.722Z" fill="#1CE783" />
        </svg>
    );
}

function StripeLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="24" viewBox="0 0 512 214">
            <path fill="#635BFF" d="M512 110.08c0-36.409-17.636-65.138-51.342-65.138c-33.85 0-54.33 28.73-54.33 64.854c0 42.808 24.179 64.426 58.88 64.426c16.925 0 29.725-3.84 39.396-9.244v-28.445c-9.67 4.836-20.764 7.823-34.844 7.823c-13.796 0-26.027-4.836-27.591-21.618h69.547c0-1.85.284-9.245.284-12.658m-70.258-13.511c0-16.071 9.814-22.756 18.774-22.756c8.675 0 17.92 6.685 17.92 22.756zm-90.31-51.627c-13.939 0-22.899 6.542-27.876 11.094l-1.85-8.818h-31.288v165.83l35.555-7.537l.143-40.249c5.12 3.698 12.657 8.96 25.173 8.96c25.458 0 48.64-20.48 48.64-65.564c-.142-41.245-23.609-63.716-48.498-63.716m-8.534 97.991c-8.391 0-13.37-2.986-16.782-6.684l-.143-52.765c3.698-4.124 8.818-6.968 16.925-6.968c12.942 0 21.902 14.506 21.902 33.137c0 19.058-8.818 33.28-21.902 33.28M241.493 36.551l35.698-7.68V0l-35.698 7.538zm0 10.809h35.698v124.444h-35.698zm-38.257 10.524L200.96 47.36h-30.72v124.444h35.556V87.467c8.39-10.951 22.613-8.96 27.022-7.396V47.36c-4.551-1.707-21.191-4.836-29.582 10.524m-71.112-41.386l-34.702 7.395l-.142 113.92c0 21.05 15.787 36.551 36.836 36.551c11.662 0 20.195-2.133 24.888-4.693V140.8c-4.55 1.849-27.022 8.391-27.022-12.658V77.653h27.022V47.36h-27.022zM35.982 83.484c0-5.546 4.551-7.68 12.09-7.68c10.808 0 24.461 3.272 35.27 9.103V51.484c-11.804-4.693-23.466-6.542-35.27-6.542C19.2 44.942 0 60.018 0 85.192c0 39.252 54.044 32.995 54.044 49.92c0 6.541-5.688 8.675-13.653 8.675c-11.804 0-26.88-4.836-38.827-11.378v33.849c13.227 5.689 26.596 8.106 38.827 8.106c29.582 0 49.92-14.648 49.92-40.106c-.142-42.382-54.329-34.845-54.329-50.774" />
        </svg>
    );
}
