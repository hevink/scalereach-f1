import Image from "next/image";

export function HeroSection() {
    return (
        <section className="selection:bg-primary-foreground selection:text-primary relative">
            <div className="pt-15 mt-px">
                {/* Outer vertical border lines - full height */}
                {/* <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto max-w-6xl border-x z-50" /> */}
                {/* <div aria-hidden="true" className="top-15 corner-bevel max-w-332 pointer-events-none absolute inset-0 inset-x-0 z-10 mx-auto rounded-t-[2rem] border-x border-t" /> */}

                {/* Inner rounded container with corner bevel */}
                {/* <div aria-hidden="true" className="top-15 corner-bevel pointer-events-none absolute inset-0 inset-x-0 z-10 mx-auto max-w-6xl rounded-t-[2rem] border-x border-t" /> */}
                <div aria-hidden="true" className="top-15 corner-bevel pointer-events-none absolute inset-0 inset-x-0 z-10 mx-auto max-w-7xl rounded-t-[2rem] border-x border-t" />

                {/* Short vertical lines that create the "notch" */}
                <div aria-hidden="true" className="max-w-316 h-15 pointer-events-none absolute inset-0 inset-x-0 z-50 mx-auto border-x" />

                {/* Announcement badge */}
                <div className="flex justify-center pt-1">
                    <div className="relative flex flex-wrap items-center justify-center gap-3 p-4">
                        <div className="bg-foreground text-background rounded-full corner-t-notch px-2.5 py-1 text-xs font-medium">New</div>
                        <a className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
                            Meet Tailark 2 : The Ultimate Design System
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Hero content */}
                <div className="corner-t-notch relative z-10 mx-auto grid max-w-6xl rounded-t-[2rem] border-x border-t px-6 py-16 max-md:pb-6">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="text-foreground text-balance font-serif text-4xl leading-[1.1] tracking-[-0.5px] md:text-5xl">
                            Unlock Revenue Growth with Intelligent Analytics
                        </h1>
                        <p className="text-muted-foreground mb-6 mt-4 text-balance text-lg">
                            Empower your sales team with AI-powered insights that drive conversions, optimize pipelines, and accelerate deal velocity. Our intelligent.
                        </p>
                        <a
                            className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors shadow-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-full px-6"
                            href="#"
                        >
                            Book a demo
                        </a>
                    </div>
                </div>

                {/* Dashboard preview section */}
                <div className="relative -mt-px border-y">
                    {/* Background image */}
                    <div className="absolute inset-0 mask-[linear-gradient(to_bottom,transparent_0%,black_25%)]">
                        <Image
                            alt="hero background"
                            src="https://images.unsplash.com/photo-1695151992691-a9e19f73948f?q=80&w=2206&auto=format&fit=crop"
                            fill
                            className="object-cover object-top dark:opacity-25"
                            priority
                        />
                    </div>

                    <div className="relative mx-auto max-w-6xl overflow-hidden py-6 md:py-16">
                        {/* Grid overlay */}
                        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-3 gap-px *:border-x *:first:border-l-0 *:last:border-r-0 md:grid-cols-6">
                            <div></div>
                            <div className="max-md:hidden"></div>
                            <div className="max-md:hidden"></div>
                            <div className="max-md:hidden"></div>
                            <div></div>
                            <div></div>
                        </div>

                        {/* Gradient overlays for grid fade effect */}
                        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-3 gap-px md:grid-cols-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`bg-linear-to-l from-foreground/2.5 via-transparent to-foreground/2.5 ${i > 0 && i < 4 ? 'max-md:hidden' : ''}`} />
                            ))}
                        </div>

                        <div className="relative h-fit">
                            <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
                                <div className="flex min-h-96 items-center">
                                    <DashboardCard />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


function DashboardCard() {
    return (
        <div className="bg-card/95 dark:bg-card/90 ring-1 ring-border/50 shadow-xl shadow-black/5 relative mx-auto w-full max-w-5xl rounded-2xl p-6 pb-12">
            {/* AI Assistant pill */}
            <div className="max-w-xs absolute inset-x-0 bottom-4 z-10 mx-auto">
                <div className="absolute inset-0 rounded-full corner-t-notch bg-linear-to-r from-emerald-400 via-teal-400 to-purple-400 opacity-25 blur" />
                <div className="shadow-lg shadow-black/5 ring-1 ring-border/50 bg-card relative flex items-center gap-2 rounded-full p-1">
                    <div className="bg-card ring-1 ring-border/50 flex size-6 shrink-0 rounded-full shadow-xl items-center justify-center">
                        <OpenAIIcon />
                    </div>
                    <div className="line-clamp-1 text-[13px]">
                        Total revenue of <span className="text-foreground font-medium">$8,197,422.92</span> and combined ARR of <span className="text-foreground font-medium">$128,080</span>.
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 size-3 shrink-0 opacity-65">
                        <path d="m5 12 7-7 7 7" />
                        <path d="M12 19V5" />
                    </svg>
                </div>
            </div>

            {/* Header */}
            <div className="mb-4">
                <div className="font-medium">Customers</div>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                    New users by First user primary channel group (Default Channel Group)
                </p>
            </div>

            {/* Table */}
            <div className="mask-[linear-gradient(to_bottom,black_55%,transparent_100%)]">
                <CustomerTable />
            </div>
        </div>
    );
}

function CustomerTable() {
    const customers = [
        { name: "Vercel", icon: <VercelIcon />, date: "10/31/2023", revenue: "$4,356,625.99", arr: "$13,600", mrr: "$1360", nextBilling: "11/30/2027" },
        { name: "Linear", icon: <LinearIcon />, date: "03/15/2024", revenue: "$892,450.00", arr: "$29,400", mrr: "$2,450", nextBilling: "03/15/2025" },
        { name: "Slack", icon: <SlackIcon />, date: "07/22/2023", revenue: "$1,245,890.50", arr: "$38,400", mrr: "$3,200", nextBilling: "07/22/2026" },
        { name: "Twilio", icon: <TwilioIcon />, date: "01/08/2024", revenue: "$567,320.75", arr: "$10,680", mrr: "$890", nextBilling: "01/08/2025" },
        { name: "Supabase", icon: <SupabaseIcon />, date: "05/12/2024", revenue: "$345,678.90", arr: "$14,400", mrr: "$1,200", nextBilling: "05/12/2025" },
        { name: "Gemini", icon: <GeminiIcon />, date: "09/05/2023", revenue: "$789,456.78", arr: "$21,600", mrr: "$1,800", nextBilling: "09/05/2026" },
    ];

    return (
        <table className="w-max table-auto border-collapse lg:w-full">
            <thead className="dark:bg-background bg-foreground/5">
                <tr className="*:border *:border-border/50 *:px-3 *:py-1.5 *:text-left *:text-sm *:font-medium">
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>ARR</th>
                    <th>MRR</th>
                    <th className="rounded-tr">Next Billing</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                {customers.map((customer) => (
                    <tr key={customer.name} className="text-foreground/75 *:border *:border-border/50 *:p-2 *:px-3">
                        <td>
                            <div className="flex items-center gap-2">
                                {customer.icon}
                                <span className="text-foreground">{customer.name}</span>
                            </div>
                        </td>
                        <td>{customer.date}</td>
                        <td>{customer.revenue}</td>
                        <td>{customer.arr}</td>
                        <td>{customer.mrr}</td>
                        <td>{customer.nextBilling}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Icons
function OpenAIIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid" viewBox="0 0 256 260" className="size-3.5">
            <path fill="currentColor" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
        </svg>
    );
}

function VercelIcon() {
    return (
        <svg viewBox="0 0 256 222" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" className="size-3.5">
            <path fill="currentColor" d="m128 0 128 221.705H0z" />
        </svg>
    );
}

function LinearIcon() {
    return (
        <svg className="size-3.5" fill="none" viewBox="0 0 100 100">
            <path fill="#5E6AD2" d="M1.225 61.523c-.222-.949.908-1.546 1.597-.857l36.512 36.512c.69.69.092 1.82-.857 1.597-18.425-4.323-32.93-18.827-37.252-37.252ZM.002 46.889a.99.99 0 0 0 .29.76L52.35 99.71c.201.2.478.307.76.29 2.37-.149 4.695-.46 6.963-.927.765-.157 1.03-1.096.478-1.648L2.576 39.448c-.552-.551-1.491-.286-1.648.479a50.067 50.067 0 0 0-.926 6.962ZM4.21 29.705a.988.988 0 0 0 .208 1.1l64.776 64.776c.289.29.726.375 1.1.208a49.908 49.908 0 0 0 5.185-2.684.981.981 0 0 0 .183-1.54L8.436 24.336a.981.981 0 0 0-1.541.183 49.896 49.896 0 0 0-2.684 5.185Zm8.448-11.631a.986.986 0 0 1-.045-1.354C21.78 6.46 35.111 0 49.952 0 77.592 0 100 22.407 100 50.048c0 14.84-6.46 28.172-16.72 37.338a.986.986 0 0 1-1.354-.045L12.659 18.074Z" />
        </svg>
    );
}

function SlackIcon() {
    return (
        <svg className="size-3.5" viewBox="0 0 2447.6 2452.5">
            <g clipRule="evenodd" fillRule="evenodd">
                <path d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z" fill="#36c5f0" />
                <path d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z" fill="#2eb67d" />
                <path d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z" fill="#ecb22e" />
                <path d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0" fill="#e01e5a" />
            </g>
        </svg>
    );
}

function TwilioIcon() {
    return (
        <svg className="size-3.5" viewBox="0 0 64 64">
            <g transform="translate(0 .047) scale(.93704)" fill="#e31e26">
                <path d="M34.1 0C15.3 0 0 15.3 0 34.1s15.3 34.1 34.1 34.1C53 68.3 68.3 53 68.3 34.1S53 0 34.1 0zm0 59.3C20.3 59.3 9 48 9 34.1 9 20.3 20.3 9 34.1 9 48 9 59.3 20.3 59.3 34.1 59.3 48 48 59.3 34.1 59.3z" />
                <circle cx="42.6" cy="25.6" r="7.1" />
                <circle cx="42.6" cy="42.6" r="7.1" />
                <circle cx="25.6" cy="42.6" r="7.1" />
                <circle cx="25.6" cy="25.6" r="7.1" />
            </g>
        </svg>
    );
}

function SupabaseIcon() {
    return (
        <svg className="size-3.5" viewBox="0 0 109 113" fill="none">
            <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase-a)" />
            <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase-b)" fillOpacity="0.2" />
            <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" />
            <defs>
                <linearGradient id="supabase-a" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#249361" /><stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient id="supabase-b" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                    <stop /><stop offset="1" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function GeminiIcon() {
    return (
        <svg className="size-3.5" viewBox="0 0 296 298" fill="none">
            <mask id="gemini-a" width="296" height="298" x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
                <path fill="#3186FF" d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z" />
            </mask>
            <g mask="url(#gemini-a)">
                <ellipse cx="163" cy="149" fill="#3689FF" rx="196" ry="159" />
                <ellipse cx="33.5" cy="142.5" fill="#F6C013" rx="68.5" ry="72.5" />
                <path fill="#FA4340" d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z" />
                <path fill="#14BB69" d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z" />
            </g>
        </svg>
    );
}
