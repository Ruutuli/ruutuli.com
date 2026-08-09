import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { mergeSiteConfig } from "@/lib/siteConfig";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { defaultSiteSettings, siteAssets } from "@/data/siteDefaults";
import { absoluteUrl, getSiteUrl } from "@/lib/siteUrl";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig().catch(() => mergeSiteConfig(defaultSiteSettings));
  const titleDefault = `${site.name} | ${site.tagline}`;
  const description = site.bio;
  const ogImage = siteAssets.seoPreview;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: titleDefault,
      template: `%s | ${site.name}`,
    },
    description,
    applicationName: site.name,
    authors: [{ name: site.displayName, url: getSiteUrl() }],
    creator: site.displayName,
    keywords: [
      "Ruutuli",
      "cosplay",
      "cosplayer",
      "costume builds",
      "conventions",
      "anime cosplay",
    ],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      siteName: site.name,
      title: titleDefault,
      description,
      images: [
        {
          url: ogImage,
          alt: `${site.displayName} — cosplayer`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [{ url: siteAssets.chibi, type: "image/png" }],
      apple: [{ url: siteAssets.avatar }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteConfig;
  try {
    siteConfig = await getSiteConfig();
  } catch {
    siteConfig = mergeSiteConfig(defaultSiteSettings);
  }

  const sameAs = Object.values(siteConfig.socials).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl()}/#website`,
        url: absoluteUrl(),
        name: siteConfig.name,
        description: siteConfig.bio,
        publisher: { "@id": `${absoluteUrl()}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${absoluteUrl()}/#person`,
        name: siteConfig.displayName,
        url: absoluteUrl(),
        description: siteConfig.bio,
        jobTitle: siteConfig.roles,
        email: siteConfig.contactEmail || undefined,
        image: absoluteUrl(siteAssets.avatar),
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      },
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteConfigProvider config={siteConfig}>{children}</SiteConfigProvider>
      </body>
    </html>
  );
}
