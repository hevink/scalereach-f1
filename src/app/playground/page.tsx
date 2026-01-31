import { HeroSection } from "./hero-section";
import { Testimonials } from "./testimonials";
import { PricingSection } from "./pricing-section";
import { IntegrationsSection } from "./integrations-section";
import { FAQSection } from "./faq-section";
import { CTASection } from "./cta-section";
import { SupportSection } from "./support-section";
import { DocumentFlowCard } from "./document-flow-card";
import { FooterSection } from "./footer-section";
import { StatsSection } from "./stats-section";
import { Header } from "./header";

export default function PlaygroundPage() {
    return (
        <div data-theme="global" className="scheme-light selection:bg-foreground/10 selection:text-foreground bg-background dark:scheme-dark">
            <Header />
            <main role="main" className="bg-background overflow-hidden">
                <HeroSection />
                <LogoCloud />
                <StatsSection />
                <IntegrationsSection />
                <DocumentFlowCard />
                <Testimonials />
                <PricingSection />
                <FAQSection />
                <SupportSection />
                <CTASection />
                <FooterSection />
            </main>
        </div>
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
