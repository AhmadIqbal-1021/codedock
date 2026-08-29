import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/shared/Container";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "August 29, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to using CodeDock's free developer tools.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />

      <main className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <div className="mt-10 flex flex-col gap-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Acceptance of terms</h2>
              <p>
                By using CodeDock, you agree to these terms. If you don&apos;t agree with them,
                please don&apos;t use the site.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">The service</h2>
              <p>
                CodeDock provides free, browser-based developer tools — formatters, converters,
                generators, and similar utilities. All processing happens locally in your browser;
                see our{" "}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:text-indigo-400"
                >
                  Privacy Policy
                </a>{" "}
                for details.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
              <p>
                Use the tools for lawful purposes only. You&apos;re responsible for the content you
                process through them and for how you use the output. Don&apos;t attempt to
                disrupt, overload, or gain unauthorized access to the site or its infrastructure.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                No warranty, provided &ldquo;as is&rdquo;
              </h2>
              <p>
                CodeDock&apos;s tools are provided free of charge, &ldquo;as is,&rdquo; without
                warranties of any kind, express or implied — including, without limitation, any
                warranty of accuracy, reliability, or fitness for a particular purpose. Always
                verify results independently before relying on them for anything important
                (production systems, security-sensitive contexts, or similar).
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
              <p>
                To the fullest extent permitted by law, CodeDock and its operator are not liable
                for any indirect, incidental, or consequential damages arising from your use of
                the site or its tools.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Intellectual property</h2>
              <p>
                CodeDock&apos;s branding, design, and site content belong to CodeDock. Content you
                create by using a tool (e.g. formatted output) is yours — the tools are just
                processing what you already provided.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Advertising and third-party links
              </h2>
              <p>
                CodeDock may display third-party advertising (see our{" "}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:text-indigo-400"
                >
                  Privacy Policy
                </a>
                ) and may link to third-party sites. We aren&apos;t responsible for the content or
                practices of those third parties.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Changes to these terms</h2>
              <p>
                These terms may be updated as CodeDock changes. The &ldquo;Last updated&rdquo; date
                at the top of this page reflects the most recent revision. Continued use of the
                site after a change means you accept the updated terms.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              <p>
                Questions about these terms can be sent to{" "}
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
