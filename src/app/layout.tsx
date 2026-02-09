import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bangers,
  Permanent_Marker,
  Anton,
  Bebas_Neue,
  Oswald,
  Montserrat,
  Poppins,
  Lexend,
  Titan_One,
  Libre_Baskerville,
  Lilita_One,
  Inter,
  Righteous,
  Russo_One,
  Black_Ops_One,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { constructMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viral-optimized fonts for captions (Requirement 8.1)
const bangers = Bangers({
  weight: "400",
  variable: "--font-bangers",
  subsets: ["latin"],
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  display: "swap",
});

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const titanOne = Titan_One({
  weight: "400",
  variable: "--font-titan-one",
  subsets: ["latin"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  display: "swap",
});

const lilitaOne = Lilita_One({
  weight: "400",
  variable: "--font-lilita-one",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const righteous = Righteous({
  weight: "400",
  variable: "--font-righteous",
  subsets: ["latin"],
  display: "swap",
});

const russoOne = Russo_One({
  weight: "400",
  variable: "--font-russo-one",
  subsets: ["latin"],
  display: "swap",
});

const blackOpsOne = Black_Ops_One({
  weight: "400",
  variable: "--font-black-ops-one",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bangers.variable} ${permanentMarker.variable} ${anton.variable} ${bebasNeue.variable} ${oswald.variable} ${montserrat.variable} ${poppins.variable} ${lexend.variable} ${titanOne.variable} ${libreBaskerville.variable} ${lilitaOne.variable} ${inter.variable} ${righteous.variable} ${russoOne.variable} ${blackOpsOne.variable} antialiased`}
      >
        <QueryProvider>
          <PostHogProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider delay={400}>
                <Toaster position="bottom-center" />
                <main className="root">{children}</main>
              </TooltipProvider>
            </ThemeProvider>
          </PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
