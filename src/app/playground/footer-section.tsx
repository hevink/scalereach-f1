import Image from "next/image";
import Link from "next/link";

export function FooterSection() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-border bg-background px-8 py-20">
            <div className="mx-auto flex max-w-7xl flex-col items-start justify-between text-sm text-muted-foreground sm:flex-row md:px-8">
                {/* Logo & Copyright */}
                <div>
                    <div className="mr-0 mb-4 md:mr-4 md:flex">
                        <Link href="/" className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal">
                            <Image
                                src="/logo.svg"
                                alt="logo"
                                width={30}
                                height={30}
                            />
                            <span className="font-medium text-foreground">ScaleReach</span>
                        </Link>
                    </div>
                    <div className="mt-2 ml-2">© copyright ScaleReach 2025. All rights reserved.</div>
                </div>

                {/* Links Grid */}
                <div className="mt-10 grid grid-cols-2 items-start gap-10 sm:mt-0 md:mt-0 lg:grid-cols-4">
                    {/* Pages */}
                    <div className="flex w-full flex-col justify-center space-y-4">
                        <p className="font-bold text-foreground/80">Product</p>
                        <ul className="list-none space-y-4">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div className="flex flex-col justify-center space-y-4">
                        <p className="font-bold text-foreground/80">Socials</p>
                        <ul className="list-none space-y-4">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Twitter</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Instagram</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">YouTube</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col justify-center space-y-4">
                        <p className="font-bold text-foreground/80">Legal</p>
                        <ul className="list-none space-y-4">
                            <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div className="flex flex-col justify-center space-y-4">
                        <p className="font-bold text-foreground/80">Account</p>
                        <ul className="list-none space-y-4">
                            <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                            <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
                            <li><Link href="/forgot-password" className="hover:text-foreground transition-colors">Forgot Password</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Large Brand Text */}
            <p className="inset-x-0 mt-20 bg-gradient-to-b from-neutral-50 to-neutral-200 bg-clip-text text-center text-5xl font-bold text-transparent md:text-9xl lg:text-[12rem] xl:text-[13rem] dark:from-neutral-950 dark:to-neutral-800">
                ScaleReach
            </p>
        </footer>
    );
}
