# CodeDock — Master Project Spec & Claude Code Operating Prompt

> **How to use this file:** Paste this entire document as your first message to Claude Code in the CodeDock repo, or save it as `CODEDOCK.md` / `CLAUDE.md` in the repo root so Claude Code auto-loads it as project context. It merges two prior session summaries (GPT + Claude), resolves the conflicts between them, and sets a premium, SEO-first execution plan aimed at real organic revenue.

---

## 0. Reality Check (read this before anything else)

**Owner's actual goal:** reach ~$100/month in recurring revenue (AdSense + affiliate), grown from there.

This is a **realistic, achievable goal** for a well-executed developer-tools directory — but it is won or lost on three things, in this order of importance:

1. **SEO fundamentals** (technical SEO, page speed, indexation, useful content) — this drives 90% of outcome for a tools site with no existing audience.
2. **Genuine tool quality** — tools that are faster, cleaner, and more trustworthy than the top 3 Google results for that query.
3. **Volume of tools** — more indexed, useful pages = more long-tail search entry points. But volume without #1 and #2 is wasted effort.

Do **not** chase "premium" as decoration (fancy animations, gradients, glassmorphism for its own sake). Chase premium as **substance**: sub-1s load times, zero layout shift, correct metadata, real accessibility, tools that just work. A generic-looking tool that loads instantly and does exactly what the user searched for will outrank a beautiful tool that's slow or has SEO gaps. Visual polish matters for trust/conversion *after* someone lands on the page — it does not by itself cause them to land there.

Realistic timeline: expect near-zero organic traffic for the first 2–4 months (Google sandbox + indexing lag), then gradual ramp if SEO fundamentals are solid. $100/month typically requires roughly 20,000–50,000 monthly organic pageviews depending on niche RPM and affiliate conversion — this is a traffic/content problem more than a code problem once the platform is solid.

---

## 1. Project Overview

**Project:** CodeDock
**Owner:** Muhammad Ahmad Iqbal
**Category:** Free online developer tools directory (JSON formatter, hash generator, regex tester, etc.)
**Business model:** Google organic search traffic → AdSense + affiliate links → (later) optional premium AI-powered tools/features.

**Non-goals right now:** database, auth, payments, AI backend, complex state management. The product should remain a fast, static-leaning, client-side app until there is *proven* traffic/demand that requires a backend.

---

## 2. Tech Stack (confirmed, do not change without strong reason)

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui |
| Icons | Lucide React |
| Crypto/random | Native Web Crypto API only (`crypto.subtle`, `crypto.getRandomValues`, `crypto.randomUUID`) |
| Hosting | Vercel |
| VCS | Git + GitHub, feature-branch commits |

**Rule:** no external dependency should be added for something the browser/Node standard library or a tiny hand-rolled utility can already do. Every dependency is a bundle-size and maintenance cost, and this project's whole pitch (privacy, speed) depends on staying lean.

---

## 3. Architecture — Registry-Driven (single source of truth)

```
URL (/tools/[slug])
   → getToolBySlug(slug)
   → ALL_TOOLS registry entry
   → TOOL_RENDERERS[slug] component
   → ToolLayout
       → ToolHeader
       → <Tool Component>
       → ToolFeatures
       → ToolFAQ
       → RelatedTools
```

**Decision (resolving conflict between the two prior summaries):** adopt the **more granular folder structure** below. It separates true cross-tool primitives (`shared/`) from tool-page composition primitives (`tool-page/`), which scales better past 50+ tools than the flatter `components/layout` + `components/tools` split used in the earlier session.

```
src/
  app/
    tools/
      [slug]/page.tsx
    sitemap.ts
    robots.ts
    icon.tsx
    apple-icon.tsx
  components/
    layout/            # Container, Section
    navbar/             # Navbar, Logo, NavLink, MobileNav, ThemeToggle, nav-links.ts
    footer/             # Footer, FooterColumn, footer-links.ts
    categories/         # Categories, CategoryCard
    shared/              # ToolToolbar, TextStats, ToolError  (generic, reused everywhere, no page-composition logic)
    tool-page/           # ToolLayout, ToolHeader, ToolFeatures, ToolFAQ, RelatedTools (page composition)
    tools/
      json-formatter/
      jwt-decoder/
      base64-encoder-decoder/
      url-encoder-decoder/
      regex-tester/
      password-generator/
      uuid-generator/
      hash-generator/
      unix-timestamp-converter/
      lorem-ipsum-generator/
      color-converter/
      html-formatter/
  constants/
    all-tools.ts        # THE registry — see §4
    categories.ts
```

**Every new tool requires exactly three additions — never more, never less:**
1. A component in `components/tools/<slug>/`
2. An entry in `ALL_TOOLS` (in `constants/all-tools.ts`)
3. A mapping in `TOOL_RENDERERS`

If a tool ever needs a fourth kind of change to "hook up," that's a sign the registry abstraction has leaked and needs fixing — flag it, don't route around it.

**Known past bug to guard against:** a slug mismatch between `ALL_TOOLS` (`base64-encoder-decoder`) and `TOOL_RENDERERS` (`base64-encoder`) previously caused a tool to silently render "Coming Soon." Whenever a tool shows unexpected "Coming Soon," check in this order: (1) `ALL_TOOLS` slug, (2) `TOOL_RENDERERS` slug, (3) `status` field. All three must match exactly. Consider adding a build-time or test-time assertion that every `ALL_TOOLS` slug with `status: "live"` has a matching `TOOL_RENDERERS` key — this class of bug should become impossible, not just "checked for."

---

## 4. The Registry — `constants/all-tools.ts`

This supersedes the old `constants/tools.ts` entirely. `tools.ts` no longer exists in the repo, and `ToolCard`, `FeaturedTools`, `RelatedTools`, and tool routing all already import from `all-tools.ts` — this migration is done, not outstanding.

```ts
interface ToolInfo {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategorySlug;
  icon: LucideIcon;
  status: "live" | "coming-soon";
  featured?: boolean;
  seo?: { title?: string; description?: string; canonical?: string };
  features?: { title: string; description: string }[];
  faqs?: { question: string; answer: string }[];
  keywords?: string[];
}
```

**Helper functions — required set:**
- `getToolBySlug(slug)`
- `getFeaturedTools()`
- `getToolsByCategory(category)`
- `getLiveTools()` — critical: homepage/nav must filter to `status: "live"` only, so unfinished tools are never linked before they're ready
- `getRelatedTools(tool)` — currently intentionally simple: same-category, up to 3 tools. Do not over-engineer this (no tag-similarity scoring, no ML) until there are enough tools per category for it to matter.
- `getCategoriesWithCounts()` — built, and wired into the homepage's `Categories` section (previously that section showed hand-typed, inaccurate counts instead of calling this).
- `searchTools(query)` — built, but not yet wired to any UI. The Hero's search bar currently just scrolls to the on-page tools grid rather than calling this — real search UI (likely a `/tools` directory page, Phase C) is still outstanding.

---

## 5. Shared Components (cross-tool primitives, no per-tool logic)

| Component | Purpose |
|---|---|
| `ToolToolbar` | Generic action bar. Takes `actions: ToolAction[]` (label/icon/onClick/disabled/variant), renders shadcn `Button`s, has a `children` slot (pushed right) for mode/flag toggles. UI/action wiring only — no business logic lives here. |
| `TextStats` | Characters / lines / words / bytes, reused wherever a tool has text I/O. |
| `ToolError` | Standard error banner. Convention: **Input → Error → Statistics → Output**, red border on the invalid input field, error rendered directly beneath it. Reserved for real failures — never used to scold "imperfect" input. |

## 6. Tool-Page Composition Components

| Component | Purpose |
|---|---|
| `ToolLayout` | Page shell — renders `ToolHeader` then `children`. |
| `ToolHeader` | Icon + title + description + category badge. |
| `ToolFeatures` | "Why use this tool" grid — also SEO content surface. |
| `ToolFAQ` | Accordion (shadcn `Accordion`) — SEO + real user value (targets "People Also Ask" snippets). |
| `RelatedTools` | Reuses `ToolCard`, same-category cross-linking (internal linking = SEO). |

---

## 7. Tools — Consolidated, Audited Status

| # | Tool | Status | Key implementation notes |
|---|---|---|---|
| 1 | JSON Formatter | ✅ Live | Format/validate/minify, 2/4-space indent, line+column error detail (note: `JSON.parse()` doesn't always expose exact line/col — expected, not a bug), upload/download/copy. Only tool with fully fleshed-out `features`/`faqs`/`seo` metadata so far — template for the rest. |
| 2 | JWT Decoder | ✅ Live (per owner) | Decode header/payload, signature display, pretty JSON, ToolError + TextStats conventions. **Action item:** verify this against the registry — it wasn't built in either recorded session, so confirm its `ALL_TOOLS`/`TOOL_RENDERERS` entries actually exist and match, given the Base64 mismatch precedent. |
| 3 | Base64 Encoder/Decoder | ✅ Live (per owner) | Encode/decode/swap/copy/clear, Ctrl+Enter. **Action item:** this is the tool with the historical slug-mismatch bug — re-verify `ALL_TOOLS` slug (`base64-encoder-decoder`) matches `TOOL_RENDERERS` key exactly before trusting "live" status. |
| 4 | URL Encoder/Decoder | ✅ Live | Native `encodeURIComponent`/`decodeURIComponent`, encode/decode toggle, swap, Ctrl+Enter. |
| 5 | Regex Tester | ✅ Live | Flags (g/i/m/s/u/y), highlighted match preview, per-match capture groups, live matching. First "advanced interactive" tool — pattern template for future interactive tools. |
| 6 | Password Generator | ✅ Live | `crypto.getRandomValues()`, guarantees ≥1 char per enabled category, entropy + 5-tier strength meter, auto-regenerate on option change, exclude similar/ambiguous chars. **Known debt:** `react-hooks/set-state-in-effect` lint warning from auto-generating inside `useEffect` — intentionally deferred to the refactor pass (§10), not a blocker. |
| 7 | UUID Generator | ✅ Live | `crypto.randomUUID()`, qty 1–100, per-item + copy-all, download `.txt`, empty state. |
| 8 | Hash Generator | ✅ Live | `crypto.subtle.digest()` — SHA-256/384/512, async with loading-guard against overlapping requests. MD5 intentionally excluded (not in Web Crypto API). |
| 9 | Unix Timestamp Converter | ✅ Live | Bidirectional, seconds/ms (never auto-guessed), local/UTC/ISO 8601, live "current timestamp" panel. |
| 10 | Lorem Ipsum Generator | ✅ Live | Words/sentences/paragraphs modes, local word bank (no dependency), "start with Lorem ipsum" toggle, download. |
| 11 | Color Converter | ✅ Live | Native `<input type="color">` + manual hex, HEX/RGB/HSL conversion math from scratch, contrast-aware preview text. |
| 12 | HTML Formatter | ✅ Live | Hand-rolled tokenizer/pretty-printer + minifier, no external formatting dependency, no `dangerouslySetInnerHTML`. Correctly special-cases `<pre>`, `<textarea>`, `<script>`, `<style>` — their content is copied through verbatim, never reflowed. Non-fatal structural diagnostics (unclosed/unmatched tags) surface via `ToolError` without blocking output. |
| 13 | HTML Entity Encoder/Decoder | ✅ Live | Named + numeric (`&#39;`/`&#x27;`) entity support, ~133-entry hand-rolled table + full Latin-1 block. Decoding deliberately never uses the `innerHTML`/`DOMParser` trick — that can fire handlers even on a detached element — so it's regex + table lookup + `String.fromCodePoint()` only. Lenient: unrecognized/malformed entities pass through unchanged, like a browser. |
| 14 | CSS Formatter | ✅ Live | Hand-rolled recursive-descent CSS3 tokenizer, no `postcss`/parser dependency. Handles nested at-rules (`@media`, `@supports`, `@keyframes`, `@layer`, `@container`), comma-separated multi-selectors, and correctly ignores `{`/`}`/`;`/`:` inside quoted strings or `url(...)` (including `data:` URLs). |
| 15 | Number Base Converter | ✅ Live | Binary/octal/decimal/hex, all four fields update live off any one edit. Uses native `BigInt` (never `Number()`/`parseInt`) for the actual conversion, so precision holds above `Number.MAX_SAFE_INTEGER` — verified against a 20-digit decimal input. Supports negative integers. |
| 16 | JWT Generator | ✅ Live | HMAC only (HS256/HS384/HS512) — RS256/ES256 explicitly out of scope (asymmetric key UX is a much bigger tool). Signs via `crypto.subtle` per this project's crypto rule. **Verified against the canonical jwt.io HS256 test vector, byte-for-byte.** "Testing/dev only" disclaimer in the UI. Natural companion to JWT Decoder (#2). |
| 17 | Markdown Previewer | ✅ Live | Hand-rolled Markdown parser → typed node tree → real React elements via JSX — **never `dangerouslySetInnerHTML`, never a raw HTML string at any point in the pipeline.** Link/image URLs pass through an allowlist sanitizer (`http:`/`https:`/`mailto:`/relative only); a `javascript:` or `data:` URL renders as inert text, not a working link. Verified against `<img onerror>` and `javascript:` payloads. |
| 18 | JavaScript Formatter | ✅ Live | Deliberately scoped as a **safe, lightweight beautifier, not a Prettier-equivalent** — a real AST-based JS formatter risks silently corrupting code if subtly wrong, which is a worse failure mode than a CSS/HTML formatter bug. Guarantees its transformation is **whitespace-only and content-preserving by construction**: every non-whitespace character of the input appears unchanged in the output; only whitespace between tokens is ever chosen. Verified via an 18-case whitespace-stripped equality self-check (nested template literals, regex-vs-division, ASI hazards, etc.) before being wired in. Indents by `{`/`}` depth only — doesn't line-wrap long argument lists like Prettier would. |
| 19 | XML Formatter | ✅ Live | Sibling to HTML Formatter but with real XML semantics, not HTML's: tag names are case-**sensitive**, there's no void-element list (self-closing is purely a property of the source text), `<?xml ...?>`/other processing instructions and `<!DOCTYPE>` pass through unmodified, and `<![CDATA[...]]>` is copied through completely verbatim, exactly like HTML's `<pre>`/`<script>` handling. Generic — works for SVG, RSS, config files, anything well-formed. |
| 20 | SQL Formatter | ✅ Live | Same safety philosophy as the JavaScript Formatter — **whitespace-only, content-preserving by construction**, since a real dialect-aware SQL parser risks silently corrupting a query if subtly wrong. The one narrow, opt-in exception: an off-by-default "Uppercase keywords" toggle that only changes case on confidently-recognized keyword tokens (safe because SQL keywords are case-insensitive everywhere) — string literals, quoted identifiers, and comments are never touched. Formats by clause (SELECT/FROM/WHERE/JOIN variants/etc.) and `(`/`)` nesting depth. Self-checked against 10 queries × 2 modes × keyword-toggle on/off. |

**Phase B complete at 20 tools** — the spec's own checkpoint for pausing to do an architecture/SEO/performance review before Phase C (see §12).

**Immediate action items from this audit — all complete as of the Phase A pass:**
- [x] Confirmed JWT Decoder and Base64 Encoder/Decoder have correct, matching entries in `ALL_TOOLS` and `TOOL_RENDERERS` with `status: "live"`. (Found and fixed a live instance of the same bug class on Regex Tester instead — its `ALL_TOOLS` slug had been typo'd to a single space, `" "`, silently 404ing the page. Also added a build-time guard: `app/tools/[slug]/page.tsx` now throws during `next build` if any `status: "live"` tool has no matching `TOOL_RENDERERS` key, so this bug class can no longer ship silently as "Coming Soon.")
- [x] Finished HTML Formatter.
- [x] `tools.ts` no longer exists in the repo — `all-tools.ts` is already the sole registry; nothing left to migrate.
- [x] Backfilled `features` / `faqs` / `seo` metadata for every tool (1–12) — JSON Formatter was actually missing `features` too, not just tools 2–11 as originally audited; fixed.
- [x] Also fixed, beyond this checklist: `app/tools/[slug]/page.tsx` had no `generateMetadata` at all (every tool page served the identical homepage `<title>`/description to Google), and `sitemap.ts` never listed a single tool page. Both are now wired to the registry, plus JSON-LD (`SoftwareApplication`/`FAQPage`) and static prerendering (`generateStaticParams`) were added per §11.

---

## 8. Conventions Every Tool Must Follow

- Two-panel responsive layout: `grid-cols-1 lg:grid-cols-2`, stacks to one column on mobile.
- `ToolToolbar` for all actions; `ToolError` for real failures only.
- `TextStats` reused wherever semantically meaningful.
- Native browser/Web Crypto APIs only — no external libraries for formatting/hashing/encoding/random unless genuinely unavoidable.
- Full keyboard support (`Ctrl+Enter` to run, etc.) and ARIA accessibility.
- All processing client-side. No user input (passwords, JWTs, tokens, private code) should ever touch a server. This is both a real security property and a genuine, honestly-marketable differentiator — say it explicitly on tool pages ("100% client-side — nothing you type is ever sent to a server").

---

## 9. Design & UX — Premium Direction (now that you have Claude Code)

Since you're moving from free Claude to Claude Code, use the extra capability for **substance upgrades**, not decoration:

1. **Performance is the premium feature.** Sub-second Time to Interactive, zero Cumulative Layout Shift, no unnecessary client JS on pages that don't need it (use React Server Components for anything static — `ToolFeatures`, `ToolFAQ` content, headers). This is worth more to SEO ranking and to "feels premium" than any visual flourish.
2. **One consistent design language, applied rigorously** — the existing dark-glass navbar + indigo→cyan (`#6366F1 → #22D3EE`) gradient accent is a fine, distinctive brand mark. Keep it as the *only* recurring accent (don't let individual tools invent their own color schemes) — consistency reads as premium; novelty-per-page reads as amateur.
3. **Real empty/loading/error states everywhere**, not just happy-path — this is what separates "hobby project" from "product" on inspection.
4. ~~Dark/light theme should actually work~~ — done. `ThemeToggle` was presentation-only (flipped its own icon, never touched the DOM), and worse, `<html>` had no `.dark` class and no `prefers-color-scheme` fallback either, so the live site was actually rendering in light mode by default — not the intended dark-glass design. Fixed with `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` — the design is dark-first throughout, including plenty of literal `white/10`-style overlays that assume a dark canvas, so system-preference light mode isn't offered as a silent default; the toggle still genuinely switches to light, `globals.css` already had full light-mode tokens defined). Same fix wired into `MobileNav`'s slide-out, which had its own separate dead Search/Moon buttons. Also removed the "Get Started" button (desktop + mobile) — it linked nowhere and doesn't correspond to any real feature; this product has no accounts/sign-up (§1 non-goals), so there was no honest destination to wire it to.
5. **Don't add:** animation-heavy hero sections, parallax, gradient text everywhere, glassmorphism on every card, or AI-generated stock-photo aesthetics. These read as "SEO spam site" to both users and, increasingly, to Google's quality systems.

---

## 10. Refactoring Policy

Don't refactor because code *looks* duplicated — refactor when duplication is *proven* across enough tools to know the right abstraction. At ~12 tools built, this threshold is being reached. Candidate extractions once justified by real repetition:

- `useCopyToClipboard()`
- `useKeyboardShortcut()`
- `ToolEditorLayout` / `ToolPanel` / `ToolSection`

Fix the Password Generator's `react-hooks/set-state-in-effect` warning during this same pass, not before.

---

## 11. SEO Strategy (this is the actual growth engine — treat it as first-class work, not an afterthought)

**Already in place:** per-tool `generateMetadata` (title/description/keywords/canonical/OG/Twitter, driven by each tool's `seo` field), `sitemap.ts` (lists every `status: "live"` tool automatically via `getLiveTools()`), `robots.ts`, JSON-LD (`SoftwareApplication` + `FAQPage`) on every tool page, and `features`/`faqs`/`seo` copy for all 12 tools. Note: earlier drafts of this doc claimed metadata/sitemap were "already in place" when they weren't — `generateMetadata` didn't exist at all (every tool page served the identical homepage title/description to Google) and `sitemap.ts` never listed a single tool page. Both were fixed in the Phase A pass; verify against the actual files if this doc and the repo ever disagree again.

**Must-do, ranked by leverage:**

1. ~~Metadata + FAQ + features content for every existing tool~~ — done (see above).
2. **Core Web Vitals** — measure with Lighthouse/PageSpeed Insights on every tool page, not just the homepage. This is a direct ranking factor. (Tool pages are now statically prerendered via `generateStaticParams`, which should help, but hasn't been measured yet.)
3. **Internal linking** via `RelatedTools` and a real `/tools` directory/search page — `searchTools()` is built but not yet wired to any UI; the actual directory/search page is still Phase C work. Google needs a crawlable path to every tool, and users need to discover tools they didn't search for by name.
4. ~~Structured data (JSON-LD)~~ — done (see above).
5. **Canonical URLs**, correct `og:` / Twitter card metadata for shareability — done per-tool; still worth a manual spot-check with a social share debugger once the site is live.
6. **Off-site**: submit to relevant developer-tool directories, post on Product Hunt / Hacker News / r/webdev when there's a real milestone (e.g., 20 tools), and get a few genuine backlinks — this materially affects how fast Google trusts a brand-new domain.
7. **Google Search Console from day one** — submit the sitemap immediately, monitor indexation and query data; this is how you'll actually learn which tools/keywords are working.

---

## 12. Roadmap

**Phase A — complete.** HTML Formatter finished, `all-tools.ts` confirmed as the sole registry, SEO metadata backfilled for all 12 tools, JSON-LD structured data added, JWT/Base64/Regex registry correctness verified (and guarded at build time going forward).

**Phase B (current) — Developer Essentials (next tools, in this order):**
~~CSS Formatter → JavaScript Formatter → HTML Entity Encoder/Decoder → Number Base Converter → JWT Generator → Markdown Previewer → XML Formatter → SQL Formatter~~ — **all eight done. Phase B complete, 20 tools live.**

Also done, ahead of schedule:
- A real **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) page, wired into the footer and sitemap — a Phase D prerequisite (AdSense requires a privacy policy) pulled forward since it was cheap and unblocks something real.
- Real **category pages** (`/categories/[slug]`) — the homepage's category cards used to link to `/tools/{category-slug}`, which collided with the tool-detail route and 404'd for every category. They now link to a real page listing that category's live tools (or an honest "no tools yet" state), reusing `getLiveTools()`/`ToolCard`, and added to the sitemap.

**20-tool checkpoint review (done):**
- ✅ **`"use client"` discipline** — `ToolLayout`/`ToolHeader`/`ToolFeatures`/`ToolFAQ`/`RelatedTools` and everything in `shared/` are Server Components; only `Hero.tsx` and each tool's own interactive component are client, as intended.
- ✅ **SEO pipeline, verified against actual build output** — `sitemap.xml` has exactly 29 URLs (home + 20 tools + 6 categories + privacy + terms); spot-checked `.html` output confirms real per-page `<title>`/`<meta description>` (e.g. CSS Formatter's page ships its own title/description, not the homepage default).
- ✅ **Registry integrity** — 20 unique slugs, every tool has all of `seo`/`features`/`faqs` (60 occurrences = 3 × 20, verified by count).
- ✅ **Dead code removed** — `components/shared/ToolCard.tsx` and `components/home/SearchSection.tsx` were empty, unreferenced files; deleted. (`WhyCodeDock.tsx`/`LatestArticles.tsx` are intentionally-commented-out placeholders in `page.tsx`, not dead code — left alone.)
- ⚠️ **Bundle-splitting gap found — decision made: defer.** Every tool page currently ships the same shared JS bundle containing **all 20 tools' code**, confirmed by diffing chunk references across several tool pages' built HTML and grepping tool component names inside the resulting chunk file. Root cause: all 20 tools live under one `[slug]` catch-all route (`app/tools/[slug]/page.tsx`), and Next.js compiles one client bundle per route template regardless of how many static params it has. Tried wrapping `TOOL_RENDERERS` entries in `next/dynamic()` — measured that it did **not** split the bundle (all 20 still landed in one ~184KB chunk) and added complexity for no benefit, so that change was reverted.

  The real fix (moving to a real static route per tool instead of the single `[slug]` + registry lookup) was scoped and explicitly **not** done now: at this stage there's ~0 real traffic (per §0, expect near-zero for 2–4 months), so there's no live Core Web Vitals field data being hurt today, and restructuring now risks being redone anyway as more tools land. **Explicit trigger to revisit:** when real PageSpeed Insights / Search Console field data becomes available, or Phase D reaches ~50 tools — whichever comes first. At that point, re-open this note and actually do the per-route restructuring (it conflicts with §3's "exactly three additions" recipe — budget for updating that convention too, not just the routing).

**Phase C (~20 tools) — complete.** Architecture + SEO + performance review done (see above). Built the real `/tools` directory page: live search-as-you-type + category filter chips over all live tools (client-side, no backend needed — the tool list is small), reads an initial `?q=` from the URL so the Hero's search bar and every "All Tools"/"Explore Tools" link now land somewhere real instead of a scroll-to-anchor placeholder. `getCategoriesWithCounts()` was already wired into the homepage; `getCategoriesWithCounts()`-style live filtering is now also what powers `/tools` and `/categories/[slug]`, though `/tools` does its own inline filtering rather than calling the existing `searchTools()` helper directly (kept the matching logic local to the page since it also needs to combine with the category filter — `searchTools()` remains available for any future non-UI/API use). Added to the sitemap; verified via build output (30 sitemap URLs, own `<title>`).

**Phase D (25 → 50 → 100+ tools):** Continue by category (JSON/Data, Encoding, Security, Text, Web Dev, Developer Utilities — see full category list in the tool roadmap backlog). Introduce AdSense once there's real traffic (don't add ad slots to a site with no visitors — it adds nothing but latency and looks unfinished during a Search Console/Google review).

**Phase E (only if traffic justifies it):** favorites/recently-used (localStorage-based, no backend needed), keyboard shortcut/command palette for tool search, then — only if there's real demand signal — consider premium AI-powered tools with a backend (Postgres/Prisma, auth via Clerk/Better Auth, Stripe).

---

## 13. Testing Standard (every tool, before merging)

- `npm run lint` and `npm run build` must pass clean.
- Manual check: desktop / tablet / mobile, valid input, invalid input, empty state, copy, clear, download, upload (where applicable), keyboard shortcuts, error states, loading states, related tools render correctly, zero console errors.

---

## 14. Instructions to Claude Code (what to actually do with this file)

When operating on this repo:

1. Treat this document as ground truth over any conflicting inference from existing code — but if the actual repo state contradicts something here (e.g., a tool marked "live" is actually broken, or the folder structure differs), **say so explicitly and ask before mass-refactoring**, rather than silently picking one.
2. Before building a new tool, always: check `ALL_TOOLS` and `TOOL_RENDERERS` for consistency first (§3's known bug class), then follow the 3-step "new tool" recipe exactly.
3. Prioritize the Phase A backlog (§12) over new tools — SEO metadata backfill on existing tools is higher-leverage right now than tool #13.
4. Every new/edited tool page must include: full `ToolInfo` metadata (`seo`, `features`, `faqs`, `keywords`), `JSON-LD` structured data, and pass the testing checklist in §13.
5. Do not introduce new dependencies, a database, auth, payments, or a design system change without flagging it as a decision point first.
6. Keep the indigo→cyan gradient as the single recurring brand accent; don't introduce new colors per tool.
7. Optimize for Core Web Vitals on every change — prefer Server Components, avoid unnecessary `"use client"`.
