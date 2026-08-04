import type { Metadata } from "next";
import localFont from "next/font/local";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { mergeSiteConfig } from "@/lib/siteConfig";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { defaultSiteSettings } from "@/data/siteDefaults";
import { getSiteUrl } from "@/lib/siteUrl";

const display = localFont({
  src: "../fonts/dk-display-patrol.otf",
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const site = await getSiteConfig();
    return {
      metadataBase: new URL(getSiteUrl()),
      title: `${site.name} | ${site.tagline}`,
      description: site.bio,
    };
  } catch {
    const fallback = mergeSiteConfig(defaultSiteSettings);
    return {
      metadataBase: new URL(getSiteUrl()),
      title: `${fallback.name} | ${fallback.tagline}`,
      description: fallback.bio,
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <SiteConfigProvider config={siteConfig}>{children}</SiteConfigProvider>
      </body>
    </html>
  );
}
