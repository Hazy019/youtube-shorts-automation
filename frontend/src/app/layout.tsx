import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });

export const metadata: Metadata = {
  metadataBase: new URL('https://shortsautomations.vercel.app'),
  title: {
    default: "ShortsAutomation | YouTube Shorts & TikTok Automation by Kyrell Santillan",
    template: "%s | ShortsAutomation"
  },
  description: "ShortsAutomation is a fully automated, cloud-native YouTube Shorts and TikTok video automation system engineered by Kyrell Santillan. It researches, writes, voices, renders, and distributes faceless short-form content 24/7.",
  keywords: [
    "shortsautomation",
    "ShortsAutomation",
    "Kyrell Santillan",
    "Kyrell Santillan automation",
    "Kyrell Santillan developer",
    "YouTube Shorts automation",
    "faceless channel automation",
    "AI video generator",
    "TikTok automation",
    "serverless video production",
    "hazy",
    "Hazy019",
    "Bacolod City developer",
    "software developer Philippines"
  ],
  authors: [{ name: "Kyrell Santillan", url: "https://hazyfactory.vercel.app/" }],
  creator: "Kyrell Santillan",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://shortsautomations.vercel.app',
  },
  openGraph: {
    title: "ShortsAutomation | YouTube Shorts & TikTok Automation by Kyrell Santillan",
    description: "ShortsAutomation is a cloud-native pipeline that produces and syndicates short-form video content 24/7, engineered by Kyrell Santillan.",
    url: "https://shortsautomations.vercel.app",
    siteName: "ShortsAutomation",
    images: [{ url: "/brand-image.png", width: 1200, height: 630, alt: "ShortsAutomation Engine" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShortsAutomation | YouTube Shorts & TikTok Automation by Kyrell Santillan",
    description: "A fully automated, serverless video machine. Zero local hardware. 24/7 production by Kyrell Santillan.",
    images: ["/brand-image.png"],
    creator: "@hazy019",
    site: "@hazy019",
  },
  icons: {
    icon: [{ url: '/favicon-circle.png', type: 'image/png', sizes: '128x128' }],
    shortcut: '/favicon-circle.png',
    apple: '/favicon-circle.png',
  },
  other: {
    'geo.region': 'PH-WLG',
    'geo.placename': 'Bacolod City',
    'geo.position': '10.6765;122.9509',
    'ICBM': '10.6765, 122.9509',
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
        "image": "https://hazyfactory.vercel.app/hazy-logo.png",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bacolod City",
          "addressRegion": "Negros Occidental",
          "addressCountry": "PH"
        },
        "sameAs": [
          "https://github.com/Hazy019",
          "https://linkedin.com/in/kyrell-santillan"
        ],
        "knowsAbout": [
          "Software Engineering",
          "Full-Stack Development",
          "Web Development",
          "Python Automation",
          "Cybersecurity",
          "Next.js",
          "Django",
          "React",
          "Node.js",
          "WebSockets"
        ]
      },
      {
        "@type": "WebApplication",
        "@id": "https://shortsautomations.vercel.app/#application",
        "name": "ShortsAutomation",
        "url": "https://shortsautomations.vercel.app/",
        "description": "A fully automated, cloud-native YouTube Shorts and TikTok video automation engine that researches, writes, voices, renders, and distributes faceless short-form content 24/7.",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "All",
        "creator": {
          "@id": "https://shortsautomations.vercel.app/#person"
        },
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://shortsautomations.vercel.app/#website",
        "url": "https://shortsautomations.vercel.app/",
        "name": "ShortsAutomation - Faceless Video Automation Engine",
        "description": "Cloud-native pipeline that produces and syndicates short-form video content 24/7, engineered by Kyrell Santillan.",
        "publisher": {
          "@id": "https://shortsautomations.vercel.app/#person"
        }
      }
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
