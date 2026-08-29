import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/shared/Container";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "August 29, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CodeDock handles data: what the tools do (and don't) send anywhere, and how advertising cookies work if enabled.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <div className="mt-10 flex flex-col gap-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <p>
                CodeDock provides free, browser-based developer tools (JSON formatting, hashing,
                encoding, and similar). This policy explains what happens — and, just as
                importantly, what doesn&apos;t happen — to the data you use with those tools.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                The tools themselves: 100% client-side
              </h2>
              <p>
                Every tool on CodeDock runs entirely in your browser, using standard web APIs
                (such as the Web Crypto API). Whatever you paste into a tool — JSON, a JWT, text
                to hash or encode, or anything else — is processed locally on your device and is{" "}
                <strong className="text-foreground">never transmitted to a CodeDock server</strong>
                . We have no way to see, log, or store the content you run through a tool, because
                it never leaves your browser.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">What we don&apos;t collect</h2>
              <p>
                CodeDock does not require an account, does not set its own tracking cookies, and
                does not use browser storage to save what you type into a tool. There is no
                server-side logging tied to tool input.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Standard web server logs</h2>
              <p>
                Like virtually every website, our hosting provider may automatically log basic
                technical request data — IP address, browser/device type, pages requested, and
                timestamps — for security and operational purposes (e.g. detecting abuse). This is
                routine infrastructure logging, separate from and unrelated to anything you type
                into a tool.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Advertising</h2>
              <p>
                CodeDock is free to use and may be supported by advertising, including through
                Google AdSense. If and when advertising is enabled, those third-party services may
                use cookies or similar technologies to serve relevant ads and measure ad
                performance. Google&apos;s use of advertising cookies allows it and its partners to
                serve ads based on your visits to this and other sites. You can opt out of
                personalized advertising through{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-indigo-400"
                >
                  Google Ads Settings
                </a>{" "}
                or{" "}
                <a
                  href="https://www.aboutads.info/choices"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-indigo-400"
                >
                  www.aboutads.info
                </a>
                .
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Third-party links</h2>
              <p>
                CodeDock may include outbound or affiliate links to third-party sites. Those sites
                have their own privacy practices, which this policy does not cover — please review
                their policies directly.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Children&apos;s privacy</h2>
              <p>
                CodeDock is not directed at children under 13, and we do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Changes to this policy</h2>
              <p>
                This policy may be updated as CodeDock changes (for example, if advertising is
                enabled). The &ldquo;Last updated&rdquo; date at the top of this page reflects the
                most recent revision.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              <p>
                Questions about this policy can be sent to{" "}
                <a
                  href="mailto:hello@codedock.com"
                  className="text-foreground underline underline-offset-2 hover:text-indigo-400"
                >
                  hello@codedock.com
                </a>
                .
              </p>
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
