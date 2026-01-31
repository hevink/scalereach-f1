import Link from "next/link";

interface LogoIconProps {
    className?: string;
    size?: number;
}

export function LogoIcon({ className = "h-8 w-8", size }: LogoIconProps) {
    const sizeProps = size ? { width: size, height: size } : {};
    return (
        <svg className={className} {...sizeProps} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_ddiii_logo)">
                <g clipPath="url(#clip0_logo)">
                    <rect x="3" width="48" height="48" rx="12" fill="#2553CB" />
                    <rect width="48" height="48" transform="translate(3)" fill="url(#paint0_linear_logo)" />
                    <g filter="url(#filter1_d_logo)">
                        <rect opacity="0.8" x="15.4492" y="20.4004" width="7.19999" height="7.19999" fill="url(#paint1_linear_logo)" />
                        <rect opacity="0.8" x="38.5508" y="27.5996" width="7.2" height="7.19999" transform="rotate(180 38.5508 27.5996)" fill="url(#paint2_linear_logo)" />
                        <path opacity="0.2" d="M22.6484 20.4002L31.3484 13.2002V20.4002L22.6484 27.6002V20.4002Z" fill="url(#paint3_linear_logo)" />
                        <path opacity="0.4" d="M31.3496 27.5998L22.6496 34.7998L22.6496 27.5998L31.3496 20.3998L31.3496 27.5998Z" fill="url(#paint4_linear_logo)" />
                        <path opacity="0.6" d="M15.4492 20.4L31.3492 6V13.2L22.6492 20.4H15.4492Z" fill="url(#paint5_linear_logo)" />
                        <path opacity="0.7" d="M38.5508 27.6L22.6508 42L22.6508 34.8L31.3508 27.6L38.5508 27.6Z" fill="url(#paint6_linear_logo)" />
                    </g>
                </g>
                <rect x="4" y="1" width="46" height="46" rx="11" stroke="url(#paint7_linear_logo)" strokeWidth="2" />
            </g>
            <defs>
                <filter id="filter0_ddiii_logo" x="0" y="-3" width="54" height="57" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="0.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.162923 0 0 0 0 0.162923 0 0 0 0 0.162923 0 0 0 0.08 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect2_dropShadow" />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.164706 0 0 0 0 0.164706 0 0 0 0 0.164706 0 0 0 0.14 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
                </filter>
                <filter id="filter1_d_logo" x="12" y="5.25" width="30" height="42" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="1.5" operator="erode" in="SourceAlpha" result="effect1_dropShadow" />
                    <feOffset dy="2.25" />
                    <feGaussianBlur stdDeviation="2.25" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0.1 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
                </filter>
                <linearGradient id="paint0_linear_logo" x1="24" y1="0" x2="26" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="white" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient id="paint1_linear_logo" x1="19.0492" y1="20.4004" x2="19.0492" y2="27.6004" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint2_linear_logo" x1="42.1508" y1="27.5996" x2="42.1508" y2="34.7996" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint3_linear_logo" x1="26.9984" y1="13.2002" x2="26.9984" y2="27.6002" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint4_linear_logo" x1="26.9996" y1="34.7998" x2="26.9996" y2="20.3998" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint5_linear_logo" x1="23.3992" y1="6" x2="23.3992" y2="20.4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint6_linear_logo" x1="30.6008" y1="42" x2="30.6008" y2="27.6" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.8" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="paint7_linear_logo" x1="27" y1="0" x2="27" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.12" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <clipPath id="clip0_logo">
                    <rect x="3" width="48" height="48" rx="12" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

interface LogoWithTextProps {
    className?: string;
    iconSize?: number;
    textClassName?: string;
}

export function LogoWithText({ className = "flex items-center gap-2", iconSize = 32, textClassName = "text-foreground font-semibold text-lg" }: LogoWithTextProps) {
    return (
        <div className={className}>
            <LogoIcon size={iconSize} />
            <span className={textClassName}>Scale Reach</span>
        </div>
    );
}

interface LogoLinkProps {
    href?: string;
    showText?: boolean;
    iconSize?: number;
    textClassName?: string;
    className?: string;
}

export function LogoLink({ href = "/", showText = true, iconSize = 32, textClassName, className }: LogoLinkProps) {
    return (
        <Link href={href} className={className || "flex items-center gap-2"}>
            <LogoIcon size={iconSize} />
            {showText && <span className={textClassName || "text-foreground font-semibold text-lg"}>Scale Reach</span>}
        </Link>
    );
}
