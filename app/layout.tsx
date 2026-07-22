import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "CodeDock - Free Developer Tools & AI Utilities",
    template: "%s | CodeDock",
  },
  description:
    "CodeDock provides free developer tools, AI utilities, formatters, converters, and productivity tools for developers.",
  keywords: [
    "developer tools",
    "online tools",
    "JSON formatter",
    "regex tester",
    "AI tools",
    "coding utilities",
  ],
  authors: [
    {
      name: "CodeDock",
    },
  ],
  openGraph: {
    title: "CodeDock - Free Developer Tools",
    description:
      "Fast, free developer tools and AI-powered utilities.",
    url: "https://codedock.com",
    siteName: "CodeDock",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeDock - Free Developer Tools",
    description:
      "Free developer tools and AI utilities.",
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
