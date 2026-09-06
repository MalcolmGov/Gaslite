import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_Arabic, JetBrains_Mono, Sora } from "next/font/google";
import { headers } from "next/headers";
import { getMessages, getLocale } from "next-intl/server";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/layout/cookie-consent";
import { Analytics } from "@/components/layout/analytics";
import { WebsiteStructuredData } from "@/components/seo/structured-data";
import { AppBanner } from "@/components/layout/app-banner";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { LocaleDetector } from "@/components/providers/locale-detector";
import { getConfig } from "@/lib/config";
import { isRtlLocale } from "@/lib/i18n/config";
import "./globals.css";

// Moove Prompts type system: Sora for headings, DM Sans for body copy,
// JetBrains Mono for prompt text and code.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-brand",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  const siteName = config.branding.name;
  const siteTitle = `${siteName} - AI Prompt Library`;
  const description = config.branding.description;
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      "AI prompts",
      "ChatGPT prompts",
      "Claude prompts",
      "prompt engineering",
      "AI tools",
      "prompt library",
      "GPT prompts",
      "AI assistant",
      "prompt templates",
      "Moove Digital",
    ],
    authors: [{ name: "Moove Digital" }],
    creator: "Moove Digital",
    publisher: "Moove Digital",
    icons: {
      icon: [
        { url: "/favicon/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon/favicon.ico", sizes: "48x48" },
      ],
      apple: "/favicon/apple-touch-icon.png",
      shortcut: "/favicon/favicon.svg",
    },
    manifest: "/favicon/site.webmanifest",
    other: {
      "apple-mobile-web-app-title": siteName,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      title: siteTitle,
      description,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: ["/og.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

const radiusValues = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
};

function hexToOklch(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "oklch(0.5 0.2 260)";
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = (max - min) * 0.4;
  
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) * 60;
    else if (max === g) h = (2 + (b - r) / (max - min)) * 60;
    else h = (4 + (r - g) / (max - min)) * 60;
  }
  if (h < 0) h += 360;
  
  return `oklch(${(l * 0.8 + 0.2).toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isEmbedRoute = pathname.startsWith("/embed");
  const isKidsRoute = pathname.startsWith("/kids");
  
  const locale = await getLocale();
  const messages = await getMessages();
  const config = await getConfig();
  const isRtl = isRtlLocale(locale);

  // Calculate theme values server-side
  const themeClasses = `theme-${config.theme.variant} density-${config.theme.density}`;
  const primaryOklch = hexToOklch(config.theme.colors.primary);
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(config.theme.colors.primary);
  const lightness = rgb 
    ? 0.2126 * (parseInt(rgb[1], 16) / 255) + 0.7152 * (parseInt(rgb[2], 16) / 255) + 0.0722 * (parseInt(rgb[3], 16) / 255)
    : 0.5;
  const foreground = lightness > 0.5 ? "oklch(0.2 0 0)" : "oklch(0.98 0 0)";
  
  const themeStyles = {
    "--radius": radiusValues[config.theme.radius],
    "--primary": primaryOklch,
    "--primary-foreground": foreground,
  } as React.CSSProperties;

  const fontClasses = isRtl 
    ? `${dmSans.variable} ${notoSansArabic.variable} ${jetbrainsMono.variable} ${sora.variable} font-arabic` 
    : `${dmSans.variable} ${jetbrainsMono.variable} ${sora.variable} font-sans`;

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning className={themeClasses} style={themeStyles}>
      <head>
        {process.env.GOOGLE_ADSENSE_ACCOUNT && (
          <meta name="google-adsense-account" content={process.env.GOOGLE_ADSENSE_ACCOUNT} />
        )}
        <WebsiteStructuredData />
      </head>
      <body className={`${fontClasses} antialiased`}>
        {process.env.GOOGLE_ANALYTICS_ID && (
          <Analytics gaId={process.env.GOOGLE_ANALYTICS_ID} />
        )}
        <Providers locale={locale} messages={messages} theme={config.theme} branding={{ ...config.branding, useCloneBranding: config.homepage?.useCloneBranding }}>
          {isEmbedRoute || isKidsRoute ? (
            children
          ) : (
            <>
              <LocaleDetector />
              <div className="relative min-h-screen flex flex-col">
                <AnnouncementBanner />
                <Header authProvider={config.auth.provider} allowRegistration={config.auth.allowRegistration} />
                <main className="flex-1">{children}</main>
                <Footer />
                <CookieConsentBanner />
              </div>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
