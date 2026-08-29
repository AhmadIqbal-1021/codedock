import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: {
    default: "CodeDock - Free Developer Tools",
    template: "%s | CodeDock",
  },
  description:
    "Free, fast, 100% client-side developer tools — JSON formatter, JWT decoder, regex tester, hash generator, and more. Nothing you type is ever sent to a server.",
  keywords: [
    "developer tools",
    "online tools",
    "json formatter",
    "regex tester",
    "jwt decoder",
    "coding utilities",
  ],
  authors: [
    {
      name: "CodeDock",
    },
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "CodeDock - Free Developer Tools",
    description:
      "Fast, free, 100% client-side developer tools. Nothing you type is ever sent to a server.",
    url: SITE_URL,
    siteName: "CodeDock",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeDock - Free Developer Tools",
    description:
      "Fast, free, 100% client-side developer tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
