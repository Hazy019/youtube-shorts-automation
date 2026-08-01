import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shortsautomations.vercel.app"),
  title: {
    default: "Shorts Automation",
    template: "%s | Shorts Automation",
  },
  description:
    "A fully autonomous serverless video pipeline. Script, voice, render, and publish short-form content to YouTube, TikTok, and Instagram 24/7.",
  keywords: [
    "Short Automation",
    "shorts automation",
    "YouTube Shorts automation",
    "Kyrell Santillan",
    "kyrell santillan",
    "TikTok automation",
    "Remotion video engine",
    "AWS Lambda render",
    "AI video pipeline",
    "serverless video generation",
  ],
  authors: [{ name: "Kyrell Santillan", url: "https://shortsautomations.vercel.app" }],
  creator: "Kyrell Santillan",
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
    canonical: "https://shortsautomations.vercel.app",
  },
  openGraph: {
    title: "Hazy Shorts Automation | Autonomous Content Engine",
    description:
      "Script, voice, render, and publish short-form content to YouTube, TikTok, and Instagram 24/7 with zero human editing.",
    url: "https://shortsautomations.vercel.app",
    siteName: "Hazy Shorts Automation",
    images: [{ url: "/brand-image.png", width: 1200, height: 630, alt: "Hazy Shorts Automation Engine" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hazy Shorts Automation | Autonomous Content Engine",
    description: "Zero Human Edit. Pure Content Scale. Autonomous serverless video pipeline.",
    images: ["/brand-image.png"],
    creator: "@hazy019",
    site: "@hazy019",
  },
  icons: {
    icon: [{ url: "/favicon-adaptive.svg", type: "image/png", sizes: "128x128" }],
    shortcut: "/favicon-adaptive.svg",
    apple: "/favicon-adaptive.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://shortsautomations.vercel.app/#person",
        "name": "Kyrell Santillan",
        "additionalName": "HAZY",
        "jobTitle": "Software Developer & Systems Architect",
        "url": "https://hazyfactory.vercel.app/",
        "sameAs": [
          "https://github.com/Hazy019",
          "https://linkedin.com/in/kyrell-santillan"
        ],
      },
      {
        "@type": "WebApplication",
        "@id": "https://shortsautomations.vercel.app/#application",
        "name": "Hazy Shorts Automation",
        "url": "https://shortsautomations.vercel.app/",
        "description": "Autonomous serverless video pipeline that scripts, voices, renders, and publishes short-form content 24/7.",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "All",
      },
    ],
  };

  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable} dark scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0B0F17] text-[#94A3B8] font-sans antialiased selection:bg-[#AAFF5E]/30 selection:text-[#AAFF5E] min-h-screen">
        {children}
      </body>
    </html>
  );
}
