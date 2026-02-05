import Link from "next/link";
import Image from "next/image";

interface LogoIconProps {
    className?: string;
    size?: number;
}

export function LogoIcon({ className = "h-8 w-8", size = 32 }: LogoIconProps) {
    return (
        <Image
            src="/logo.svg"
            alt="scalereach logo"
            width={size}
            height={size}
            className={className}
        />
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
            <span className={textClassName}>scalereach</span>
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
            {showText && <span className={textClassName || "text-foreground font-semibold text-lg"}>scalereach</span>}
        </Link>
    );
}
