import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });

export const metadata: Metadata = {
  metadataBase: new URL('https://shortsautomation.vercel.app'),
  title: "YouTube Shorts Automation | Faceless Video Generator",
  description: "A fully automated, cloud-native YouTube Shorts automation system that researches, writes, voices, renders, and distributes faceless short-form content 24/7.",
  keywords: ["YouTube Shorts automation", "faceless channel automation", "AI video generator", "ShortsAutomation", "TikTok automation", "serverless video production", "Kyrell Santillan"],
  authors: [{ name: "Kyrell Santillan" }],
  openGraph: {
    title: "YouTube Shorts Automation | Faceless Video Generator",
    description: "Cloud-native pipeline that produces and syndicates short-form video content 24/7.",
    url: "https://shortsautomations.vercel.app",
    siteName: "ShortsAutomation",
    images: [{ url: "/brand-image.png", width: 1200, height: 630, alt: "Shorts Automation Engine" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Shorts Automation | Faceless Video Generator",
    description: "A fully automated, serverless video machine. Zero local hardware. 24/7 production.",
    images: ["/brand-image.png"],
  },
  icons: {
    icon: [{ url: '/favicon-circle.png', type: 'image/png', sizes: '128x128' }],
    shortcut: '/favicon-circle.png',
    apple: '/favicon-circle.png',
  },
  verification: {
    google: "jurX14tSOTCPj1zMR21guSGjlv22Q17yRsd9fNjop5g",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
