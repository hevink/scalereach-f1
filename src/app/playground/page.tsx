import { HeroSection } from "./hero-section";
import { Testimonials } from "./testimonials";
import { PricingSection } from "./pricing-section";
import { IntegrationsSection } from "./integrations-section";

export default function PlaygroundPage() {
    return (
        <div data-theme="global" className="scheme-light selection:bg-foreground/10 selection:text-foreground bg-background dark:scheme-dark">
            <Header />
            <main role="main" className="bg-background overflow-hidden">
                <HeroSection />
                <LogoCloud />
                <IntegrationsSection />
                <Testimonials />
                <PricingSection />
            </main>
        </div>
    );
}

function Header() {
    return (
        <header role="banner">
            <div className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="relative flex flex-wrap items-center justify-between lg:py-3">
                        <div className="flex justify-between gap-8 max-lg:h-14 max-lg:w-full max-lg:border-b max-lg:border-border/40">
                            <a aria-label="home" className="flex items-center space-x-2" href="/">
                                <Logo />
                            </a>
                            <nav className="absolute inset-0 m-auto size-fit">
                                <ul className="flex items-center gap-3">
                                    <li><NavLink href="#">Product</NavLink></li>
                                    <li><NavLink href="#">Pricing</NavLink></li>
                                    <li><NavLink href="#">Company</NavLink></li>
                                </ul>
                            </nav>
                            <MobileMenuButton />
                        </div>
                        <div className="hidden lg:flex items-center gap-3">
                            <ContinueButton />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function Logo() {
    return (
        <svg className="text-foreground h-5 w-auto" viewBox="0 0 797 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M80 100H28C12.536 100 0 87.464 0 72V28C0 12.536 12.536 0 28 0H72C87.464 0 100 12.536 100 28V80H160C171.046 80 180 88.9543 180 100V167.639C180 175.215 175.72 182.14 168.944 185.528L103.416 218.292C101.17 219.415 98.6923 220 96.1803 220C87.2442 220 80 212.756 80 203.82V100ZM28 20C23.5817 20 20 23.5817 20 28V72C20 76.4183 23.5817 80 28 80H80V28C80 23.5817 76.4183 20 72 20H28ZM100 100H152C156.418 100 160 103.582 160 108V165.092C160 168.103 158.309 170.859 155.625 172.224L111.625 194.591C106.303 197.296 100 193.429 100 187.459V100Z" fill="currentColor" />
            <path d="M272.366 96.0719V150.886C272.366 154.6 273.205 157.296 274.884 158.973C276.682 160.531 279.679 161.309 283.874 161.309H296.461V178.383H280.278C271.048 178.383 263.975 176.226 259.06 171.913C254.145 167.599 251.688 160.59 251.688 150.886V96.0719H240V79.3582H251.688V54.7368H272.366V79.3582H296.461V96.0719H272.366ZM306.723 128.421C306.723 118.477 308.761 109.671 312.837 102.003C317.032 94.3346 322.666 88.4039 329.739 84.2105C336.932 79.8973 344.843 77.7407 353.474 77.7407C361.266 77.7407 368.039 79.2982 373.793 82.4133C379.667 85.4086 384.342 89.1827 387.818 93.7356V79.3582H408.497V178.383H387.818V163.646C384.342 168.318 379.607 172.212 373.613 175.327C367.62 178.442 360.787 180 353.115 180C344.604 180 336.812 177.843 329.739 173.53C322.666 169.097 317.032 162.987 312.837 155.199C308.761 147.291 306.723 138.365 306.723 128.421ZM387.818 128.78C387.818 121.951 386.38 116.021 383.503 110.988C380.746 105.956 377.09 102.122 372.534 99.4865C367.979 96.8507 363.064 95.5327 357.79 95.5327C352.515 95.5327 347.6 96.8507 343.045 99.4865C338.49 102.003 334.774 105.777 331.897 110.809C329.14 115.721 327.761 121.592 327.761 128.421C327.761 135.25 329.14 141.241 331.897 146.393C334.774 151.545 338.49 155.498 343.045 158.254C347.72 160.89 352.635 162.208 357.79 162.208C363.064 162.208 367.979 160.89 372.534 158.254C377.09 155.618 380.746 151.784 383.503 146.752C386.38 141.6 387.818 135.61 387.818 128.78ZM444.052 66.2388C440.336 66.2388 437.219 64.9807 434.702 62.4647C432.184 59.9487 430.926 56.8336 430.926 53.1194C430.926 49.4052 432.184 46.2901 434.702 43.7741C437.219 41.258 440.336 40 444.052 40C447.648 40 450.705 41.258 453.222 43.7741C455.74 46.2901 456.999 49.4052 456.999 53.1194C456.999 56.8336 455.74 59.9487 453.222 62.4647C450.705 64.9807 447.648 66.2388 444.052 66.2388ZM454.122 79.3582V178.383H433.623V79.3582H454.122ZM499.735 45.3915V178.383H479.236V45.3915H499.735ZM518.017 128.421C518.017 118.477 520.055 109.671 524.13 102.003C528.326 94.3346 533.96 88.4039 541.033 84.2105C548.225 79.8973 556.137 77.7407 564.768 77.7407C572.56 77.7407 579.333 79.2982 585.087 82.4133C590.961 85.4086 595.636 89.1827 599.112 93.7356V79.3582H619.791V178.383H599.112V163.646C595.636 168.318 590.901 172.212 584.907 175.327C578.913 178.442 572.08 180 564.408 180C555.897 180 548.105 177.843 541.033 173.53C533.96 169.097 528.326 162.987 524.13 155.199C520.055 147.291 518.017 138.365 518.017 128.421ZM599.112 128.78C599.112 121.951 597.674 116.021 594.797 110.988C592.04 105.956 588.383 102.122 583.828 99.4865C579.273 96.8507 574.358 95.5327 569.084 95.5327C563.809 95.5327 558.894 96.8507 554.339 99.4865C549.784 102.003 546.068 105.777 543.191 110.809C540.433 115.721 539.055 121.592 539.055 128.421C539.055 135.25 540.433 141.241 543.191 146.393C546.068 151.545 549.784 155.498 554.339 158.254C559.014 160.89 563.929 162.208 569.084 162.208C574.358 162.208 579.273 160.89 583.828 158.254C588.383 155.618 592.04 151.784 594.797 146.752C597.674 141.6 599.112 135.61 599.112 128.78ZM665.415 93.7356C668.412 88.7035 672.368 84.8096 677.283 82.0539C682.318 79.1784 688.251 77.7407 695.084 77.7407V98.9474H689.87C681.838 98.9474 675.724 100.984 671.529 105.058C667.453 109.131 665.415 116.2 665.415 126.264V178.383H644.917V79.3582H665.415V93.7356ZM751.328 128.96L797 178.383H769.309L732.627 135.789V178.383H712.129V45.3915H732.627V122.67L768.59 79.3582H797L751.328 128.96Z" fill="currentColor" />
        </svg>
    );
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

function MobileMenuButton() {
    return (
        <button aria-label="Open Menu" className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
        </button>
    );
}

function ContinueButton() {
    return (
        <a className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors hover:bg-foreground/5 hover:text-foreground h-9 px-4 py-2 rounded-full pr-2.5" href="#">
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

function LogoCloud() {
    const logos = [
        { name: "Gemini", component: <GeminiLogo /> },
        { name: "Supabase", component: <SupabaseLogo /> },
        { name: "Leap", component: <LeapLogo /> },
        { name: "Spotify", component: <SpotifyLogo /> },
        { name: "Linear", component: <LinearLogo /> },
        { name: "Twilio", component: <TwilioLogo /> },
    ];

    return (
        <section className="bg-background">
            <div className="relative mx-auto max-w-6xl px-6 py-16">
                <div className="grid grid-cols-3 gap-y-6 md:grid-cols-6">
                    {logos.map((logo) => (
                        <div key={logo.name} className="relative h-10 flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity">
                            {logo.component}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Logo Cloud Icons
function GeminiLogo() {
    return (
        <svg className="h-6 w-auto" viewBox="0 0 296 298" fill="none">
            <mask id="gemini-logo-a" width="296" height="298" x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
                <path fill="#3186FF" d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z" />
            </mask>
            <g mask="url(#gemini-logo-a)">
                <ellipse cx="163" cy="149" fill="currentColor" rx="196" ry="159" className="opacity-50" />
            </g>
        </svg>
    );
}

function SupabaseLogo() {
    return (
        <svg height="24" width="auto" viewBox="0 0 109 113" fill="none">
            <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase-logo-a)" />
            <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" />
            <defs>
                <linearGradient id="supabase-logo-a" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#249361" /><stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function LeapLogo() {
    return (
        <svg width="auto" height="24" viewBox="0 0 165 49" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M53.1078 26.433C53.1078 34.868 42.8135 38.2956 30.0317 38.2956C17.25 38.2956 6.80579 34.868 6.80579 26.433C6.80579 17.9981 17.175 11.1726 29.9568 11.1726C42.7386 11.1726 53.1078 18.013 53.1078 26.433Z" fill="#24A95A" />
            <path d="M50.7571 8.04725C50.7571 3.60623 47.1308 -0.000244141 42.6655 -0.000244141C40.3434 -0.000244141 38.2507 0.976138 36.7757 2.53122C36.5473 2.7721 36.2134 2.88947 35.888 2.82376C34.0195 2.44651 32.0428 2.23517 30.0036 2.23517C27.9646 2.23517 25.9881 2.43403 24.1198 2.82041C23.794 2.88778 23.4587 2.77233 23.2288 2.53185C21.7421 0.976403 19.6503 -0.000244141 17.3417 -0.000244141C12.8763 -0.000244141 9.25008 3.60623 9.25008 8.04725C9.25008 9.34253 9.55652 10.5558 10.0962 11.6349C10.2255 11.8934 10.2385 12.196 10.1267 12.4624C9.60308 13.71 9.325 15.0274 9.325 16.3928C9.325 24.2168 18.5854 30.5504 30.0036 30.5504C41.4217 30.5504 50.6822 24.2168 50.6822 16.3928C50.6822 15.0274 50.4041 13.71 49.8805 12.4624C49.7687 12.196 49.7817 11.8934 49.9109 11.6349C50.4506 10.5558 50.7571 9.34253 50.7571 8.04725Z" fill="#32DA6D" />
            <circle cx="16.6813" cy="7.59394" r="4.9179" fill="white" />
            <circle cx="43.0618" cy="7.59394" r="4.9179" fill="white" />
            <circle cx="16.6881" cy="7.58538" r="2.9499" fill="#092511" />
            <circle cx="43.0686" cy="7.58538" r="2.9499" fill="#092511" />
            <path d="M75.2651 33.9386C75.2651 35.9449 73.6387 37.5712 71.6325 37.5712C69.6263 37.5712 67.9999 35.9449 67.9999 33.9386L67.9999 5.63261C67.9999 3.62638 69.6263 2 71.6325 2C73.6388 2 75.2651 3.62637 75.2651 5.63261L75.2651 30.3797V33.9386Z" fill="currentColor" />
            <path d="M71.6241 37.6282C69.6225 37.6282 67.9999 36.0056 67.9999 34.004C67.9999 32.0024 69.6225 30.3797 71.6241 30.3797H75.2651H83.2955C85.2972 30.3797 86.9198 32.0024 86.9198 34.004C86.9198 36.0056 85.2972 37.6282 83.2955 37.6282H71.6241Z" fill="currentColor" />
        </svg>
    );
}

function SpotifyLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="auto" height="24" viewBox="0 0 559 168">
            <path fill="#1ED760" d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l.001-.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809.64-5.609-1.12-6.249-3.93-.643-2.81 1.11-5.61 3.926-6.25 31.9-7.288 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.802c-1.89 3.072-5.91 4.042-8.98 2.152-22.51-13.836-56.823-17.843-83.448-9.761-3.453 1.043-7.1-.903-8.148-4.35-1.04-3.453.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z" />
        </svg>
    );
}

function LinearLogo() {
    return (
        <svg className="h-6 w-auto" fill="none" viewBox="0 0 100 100">
            <path fill="currentColor" d="M1.225 61.523c-.222-.949.908-1.546 1.597-.857l36.512 36.512c.69.69.092 1.82-.857 1.597-18.425-4.323-32.93-18.827-37.252-37.252ZM.002 46.889a.99.99 0 0 0 .29.76L52.35 99.71c.201.2.478.307.76.29 2.37-.149 4.695-.46 6.963-.927.765-.157 1.03-1.096.478-1.648L2.576 39.448c-.552-.551-1.491-.286-1.648.479a50.067 50.067 0 0 0-.926 6.962ZM4.21 29.705a.988.988 0 0 0 .208 1.1l64.776 64.776c.289.29.726.375 1.1.208a49.908 49.908 0 0 0 5.185-2.684.981.981 0 0 0 .183-1.54L8.436 24.336a.981.981 0 0 0-1.541.183 49.896 49.896 0 0 0-2.684 5.185Zm8.448-11.631a.986.986 0 0 1-.045-1.354C21.78 6.46 35.111 0 49.952 0 77.592 0 100 22.407 100 50.048c0 14.84-6.46 28.172-16.72 37.338a.986.986 0 0 1-1.354-.045L12.659 18.074Z" />
        </svg>
    );
}

function TwilioLogo() {
    return (
        <svg height="24" width="auto" viewBox="0 0 64 64">
            <g transform="translate(0 .047) scale(.93704)" fill="currentColor">
                <path d="M34.1 0C15.3 0 0 15.3 0 34.1s15.3 34.1 34.1 34.1C53 68.3 68.3 53 68.3 34.1S53 0 34.1 0zm0 59.3C20.3 59.3 9 48 9 34.1 9 20.3 20.3 9 34.1 9 48 9 59.3 20.3 59.3 34.1 59.3 48 48 59.3 34.1 59.3z" />
                <circle cx="42.6" cy="25.6" r="7.1" />
                <circle cx="42.6" cy="42.6" r="7.1" />
                <circle cx="25.6" cy="42.6" r="7.1" />
                <circle cx="25.6" cy="25.6" r="7.1" />
            </g>
        </svg>
    );
}
