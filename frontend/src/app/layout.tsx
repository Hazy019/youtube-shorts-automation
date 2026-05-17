import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });

export const metadata: Metadata = {
  metadataBase: new URL('https://hazy-factory.vercel.app'),
  title: "Hazy Content Factory — Autonomous AI Video Production at Scale",
  description: "A fully automated, cloud-native video production system that researches, writes, voices, renders, and distributes short-form content 24/7 across YouTube, TikTok, and Meta — zero human intervention.",
  keywords: ["AI video automation", "YouTube Shorts automation", "content factory", "serverless video production", "Gemini AI", "AWS Lambda Remotion"],
  authors: [{ name: "Kyrell Santillan" }],
  openGraph: {
    title: "Hazy Content Factory — Autonomous AI Video Production",
    description: "Cloud-native pipeline that produces and syndicates short-form video content 24/7. Built with Gemini, AWS Lambda, and React Remotion.",
    url: "https://hazy-factory.vercel.app",
    siteName: "Hazy Content Factory",
    images: [{ url: "/brand-image.png", width: 1200, height: 630, alt: "Hazy Content Factory" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hazy Content Factory — Autonomous AI Video Production",
    description: "A fully automated, serverless video machine. Zero local hardware. 24/7 production.",
    images: ["/brand-image.png"],
  },
  icons: {
    icon: [{ url: '/favicon-circle.png', type: 'image/png', sizes: '128x128' }],
    shortcut: '/favicon-circle.png',
    apple: '/favicon-circle.png',
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
