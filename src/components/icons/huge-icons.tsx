"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    Video01Icon,
    ScissorIcon,
    StarIcon,
    Clock01Icon,
    Settings02Icon,
    SparklesIcon,
    HelpCircleIcon,
    AlertCircleIcon,
    KeyboardIcon,
    FavouriteIcon,
    Share01Icon,
} from "@hugeicons/core-free-icons";

type IconProps = { className?: string };

function sizeFromClass(className?: string): number {
    if (!className) return 20;
    const match = className.match(/size-(\d+)/);
    return match ? parseInt(match[1]) * 4 : 20;
}

export function HugeVideoIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={Video01Icon} size={sizeFromClass(className)} className={className} />;
}

export function HugeScissorIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={ScissorIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeStarIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={StarIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeClockIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={Clock01Icon} size={sizeFromClass(className)} className={className} />;
}

export function HugeSettingsIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={Settings02Icon} size={sizeFromClass(className)} className={className} />;
}

export function HugeSparklesIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={SparklesIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeHelpIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={HelpCircleIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeAlertIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={AlertCircleIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeKeyboardIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={KeyboardIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeFavouriteIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={FavouriteIcon} size={sizeFromClass(className)} className={className} />;
}

export function HugeSocialIcon({ className }: IconProps) {
    return <HugeiconsIcon icon={Share01Icon} size={sizeFromClass(className)} className={className} />;
}
