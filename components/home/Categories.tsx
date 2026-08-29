import { Section } from "@/components/shared/Section";
import { Container } from "@/components/shared/Container";
import { CategoryCard } from "./CategoryCard";
import { getCategoriesWithCounts } from "@/constants/all-tools";

/**
 * Renders the full category grid from CATEGORIES, with live tool
 * counts computed from ALL_TOOLS rather than hand-maintained numbers
 * (which drift out of sync as tools are added). Add a category to
 * src/constants/categories.ts and it appears here automatically —
 * no changes needed in this file.
 */
export function Categories() {
  const categories = getCategoriesWithCounts();

  return (
    <Section id="categories">
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
          {categories.map((category) => (
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
