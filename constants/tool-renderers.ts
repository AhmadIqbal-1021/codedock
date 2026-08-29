import JsonFormatter from "@/components/tools/json-formatter/JsonFormatter";
import { JwtDecoder } from "@/components/tools/jwt-decoder/JwtDecoder";
import { Base64Encoder } from "@/components/tools/base64-encoder/Base64Encoder";
import { UrlEncoder } from "@/components/tools/url-encoder/UrlEncoder";
import { RegexTester } from "@/components/tools/regex-tester/RegexTester";
import { PasswordGenerator } from "@/components/tools/password-generator/PasswordGenerator"
import { UuidGenerator } from "@/components/tools/uuid-generator/UuidGenerator"
import { HashGenerator } from "@/components/tools/hash-generator/HashGenerator"
import { UnixTimestampConverter } from "@/components/tools/unix-timestamp-converter/UnixTimestampConverter"
import { LoremIpsumGenerator } from "@/components/tools/lorem-ipsum-generator/LoremIpsumGenerator"
import { ColorConverter } from "@/components/tools/color-converter/ColorConverter"
import { HtmlFormatter } from "@/components/tools/html-formatter/HtmlFormatter"
import { HtmlEntityEncoder } from "@/components/tools/html-entity-encoder/HtmlEntityEncoder"
import { CssFormatter } from "@/components/tools/css-formatter/CssFormatter"
import { NumberBaseConverter } from "@/components/tools/number-base-converter/NumberBaseConverter"
import { JwtGenerator } from "@/components/tools/jwt-generator/JwtGenerator"
import { MarkdownPreviewer } from "@/components/tools/markdown-previewer/MarkdownPreviewer"
import { JsFormatter } from "@/components/tools/js-formatter/JsFormatter"
import { XmlFormatter } from "@/components/tools/xml-formatter/XmlFormatter"
import { SqlFormatter } from "@/components/tools/sql-formatter/SqlFormatter"

/**
 * NOTE on bundle size (see CodeDock.md §9, the Phase B->C review): every
 * tool page currently ships all 20 tools' client JS in one shared bundle,
 * because they all live under one `[slug]` catch-all route and Next
 * compiles one client bundle per route template regardless of static
 * params. Wrapping these in `next/dynamic()` was tried and measured —
 * it did NOT split the bundle (confirmed: all 20 components still landed
 * in a single ~184KB chunk referenced by every tool page) and added
 * complexity for no benefit, so it was reverted back to plain imports.
 * A real fix means moving off the single dynamic-route registry pattern
 * (e.g. one real static route per tool) — a bigger architectural change
 * than this file alone, flagged for a decision rather than done silently.
 */
export const TOOL_RENDERERS = {
  "json-formatter": JsonFormatter,
   "jwt-decoder": JwtDecoder,
   "base64-encoder-decoder": Base64Encoder,
    "url-encoder-decoder": UrlEncoder,
    "regex-tester": RegexTester,
    "password-generator" : PasswordGenerator,
    "uuid-generator" : UuidGenerator,
    "hash-generator" : HashGenerator,
    "unix-timestamp-converter" : UnixTimestampConverter,
    "color-converter" : ColorConverter,
    "lorem-ipsum-generator" :LoremIpsumGenerator,
    "html-formatter": HtmlFormatter,
    "html-entity-encoder-decoder": HtmlEntityEncoder,
    "css-formatter": CssFormatter,
    "number-base-converter": NumberBaseConverter,
    "jwt-generator": JwtGenerator,
    "markdown-previewer": MarkdownPreviewer,
    "javascript-formatter": JsFormatter,
    "xml-formatter": XmlFormatter,
    "sql-formatter": SqlFormatter,
};
