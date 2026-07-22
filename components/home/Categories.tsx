import { Section } from "@/components/shared/Section";
import { Container } from "@/components/shared/Container";
import { CategoryCard } from "./CategoryCard";
import { CATEGORIES } from "@/constants/categories";

/**
 * Renders the full category grid from CATEGORIES. Add a category to
 * src/constants/categories.ts and it appears here automatically —
 * no changes needed in this file.
 */
export function Categories() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Browse by category
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Every tool is organized so you can find what you need in seconds,
            not tabs.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export default Categories;
