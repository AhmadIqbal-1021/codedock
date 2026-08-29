import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/shared/Container";
import { ToolsDirectory } from "@/components/tools-directory/ToolsDirectory";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse and search every free, 100% client-side developer tool on CodeDock — formatters, converters, generators, and more.",
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
};

export default function ToolsPage() {
  return (
    <>
      <Navbar />

      <main className="py-16 sm:py-20">
        <Container>
          <ToolsDirectory />
        </Container>
      </main>

      <Footer />
    </>
  );
}
