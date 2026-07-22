import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { JsonFormatter } from "@/components/tools/json-formatter/JsonFormatter";

export const metadata = {
  title: "JSON Formatter - Format JSON Online",
  description:
    "Free online JSON formatter and validator. Beautify, validate and format JSON instantly.",
};

export default function Page() {
  return (
    <Section>
      <Container>
        <JsonFormatter />
      </Container>
    </Section>
  );
}