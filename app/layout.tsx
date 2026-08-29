import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/*
          The site's whole visual identity (dark-glass navbar, gradient
          accents) is designed dark-first, so the default stays dark for
          everyone rather than following system preference — the toggle
          still genuinely switches to light (globals.css defines full
          light-mode tokens), it just isn't the silent default.
          suppressHydrationWarning on <html> is required by next-themes:
          it sets the class attribute before React hydrates to avoid a
          flash of the wrong theme, which necessarily differs from the
          server-rendered markup for that one attribute.
        */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
