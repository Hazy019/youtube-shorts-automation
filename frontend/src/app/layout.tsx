import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });

export const metadata: Metadata = {
  title: "Hazy Content Factory | Enterprise AI Video Production",
  description: "High-performance, cloud-native automated production pipeline for short-form media.",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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
