"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Check, Copy, Download, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import TextStats from "@/components/shared/TextStats";
import {
  parseMarkdown,
  type BlockNode,
  type InlineNode,
  type ListItemNode,
} from "./markdown-render";

/**
 * Markdown Previewer's working UI: toolbar + a live source/preview split.
 * No network calls, no external Markdown parser — parsing happens via the
 * hand-rolled tree-based parser in `markdown-render.ts`.
 *
 * Security note: the parser never produces an HTML string. It returns a
 * plain node tree, and the `renderInline`/`renderBlock` functions below
 * walk that tree and build real React elements via normal JSX. Every piece
 * of user-typed text ends up as a JSX text child (or a React prop we set
 * ourselves), which React escapes automatically — it is never interpreted
 * as markup. There is no `dangerouslySetInnerHTML` anywhere in this tool.
 * Link/image URLs are pre-sanitized by the parser (`javascript:`/`data:`/
 * other unrecognized schemes resolve to `href: null` / `src: null`), and
 * a null href/src is rendered as inert text here — never as a clickable
 * element with the unsafe URL silently dropped.
 *
 * Meant to be rendered as `children` inside ToolLayout, which supplies the
 * page's icon/title/description/category header:
 *
 * <ToolLayout icon={FileText} title="Markdown Previewer" description="..." category="Text">
 *   <MarkdownPreviewer />
 *   <ToolFeatures features={...} />
 *   <ToolFAQ items={...} />
 *   <RelatedTools tools={...} />
 * </ToolLayout>
 */

const SAMPLE_PLACEHOLDER = `# Hello, Markdown!

Type **bold**, _italic_, or \`inline code\`.

- Live preview, no Render button needed
- No external Markdown dependency
- 100% client-side — nothing you type ever leaves your browser

> Paste your own Markdown here to see it rendered on the right.

[CodeDock](https://codedock.example)`;

const HEADING_SIZE_CLASSES: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "text-2xl font-semibold",
  2: "text-xl font-semibold",
  3: "text-lg font-semibold",
  4: "text-base font-semibold",
  5: "text-sm font-semibold",
  6: "text-sm font-semibold text-muted-foreground",
};

/** Walks inline nodes and produces real React elements/text — never HTML. */
function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "break":
        return <br key={index} />;
      case "bold":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "italic":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "code":
        return (
          <code
            key={index}
            className="rounded bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {node.value}
          </code>
        );
      case "link":
        return node.href ? (
          <a
            key={index}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
          >
            {renderInline(node.children)}
          </a>
        ) : (
          <span
            key={index}
            title="Link blocked: unsupported or unsafe URL scheme"
            className="text-muted-foreground underline decoration-dotted underline-offset-2"
          >
            {renderInline(node.children)}
          </span>
        );
      case "image":
        // Simplification: images render as a plain link to the (sanitized)
        // source rather than an <img>, per the tool's documented scope.
        return node.src ? (
          <a
            key={index}
            href={node.src}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 align-middle text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            {node.alt || node.src}
          </a>
        ) : (
          <span key={index} className="text-muted-foreground">
            {node.alt ? `[image: ${node.alt}]` : "[image]"}
          </span>
        );
      default:
        return null;
    }
  });
}

function renderListItem(item: ListItemNode, key: number): ReactNode {
  return (
    <li key={key} className="leading-relaxed">
      {renderInline(item.content)}
      {item.children && item.children.length > 0 && (
        <div className="mt-1">{item.children.map((block, index) => renderBlock(block, index))}</div>
      )}
    </li>
  );
}

/** Walks block nodes and produces real React elements — never HTML. */
function renderBlock(node: BlockNode, key: number): ReactNode {
  switch (node.type) {
    case "heading": {
      const className = `mt-6 mb-2 first:mt-0 text-foreground ${HEADING_SIZE_CLASSES[node.level]}`;
      const children = renderInline(node.children);
      switch (node.level) {
        case 1:
          return <h1 key={key} className={className}>{children}</h1>;
        case 2:
          return <h2 key={key} className={className}>{children}</h2>;
        case 3:
          return <h3 key={key} className={className}>{children}</h3>;
        case 4:
          return <h4 key={key} className={className}>{children}</h4>;
        case 5:
          return <h5 key={key} className={className}>{children}</h5>;
        default:
          return <h6 key={key} className={className}>{children}</h6>;
      }
    }
    case "paragraph":
      return (
        <p key={key} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
          {renderInline(node.children)}
        </p>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="mb-3 border-l-2 border-white/20 pl-4 text-muted-foreground italic last:mb-0"
        >
          {node.children.map((block, index) => renderBlock(block, index))}
        </blockquote>
      );
    case "code-block":
      return (
        <div key={key} className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-foreground/[0.03] last:mb-0">
          {node.lang && (
            <div className="border-b border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {node.lang}
            </div>
          )}
          <pre className="overflow-x-auto p-3">
            <code className="font-mono text-sm text-foreground/90">{node.value}</code>
          </pre>
        </div>
      );
    case "list": {
      const items = node.items.map((item, index) => renderListItem(item, index));
      return node.ordered ? (
        <ol key={key} className="mb-3 list-decimal space-y-1 pl-6 text-foreground/90 last:mb-0">
          {items}
        </ol>
      ) : (
        <ul key={key} className="mb-3 list-disc space-y-1 pl-6 text-foreground/90 last:mb-0">
          {items}
        </ul>
      );
    }
    case "hr":
      return <hr key={key} className="my-4 border-white/10" />;
    default:
      return null;
  }
}

export function MarkdownPreviewer() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const blocks = useMemo(() => parseMarkdown(input), [input]);

  const handleClear = () => {
    setInput("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions denied or unavailable; fail silently.
    }
  };

  // Upload: clicking the toolbar button just forwards to the hidden
  // native file input — the browser's file picker does the real work.
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setInput(reader.result as string);
    };
    reader.readAsText(file);

    // Reset so selecting the same file again still fires onChange.
    event.target.value = "";
  };

  const handleDownload = () => {
    if (!input) return;

    const blob = new Blob([input], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "codedock-markdown.md";
    link.click();

    URL.revokeObjectURL(url);
  };

  const actions: ToolAction[] = [
    { label: "Clear", icon: Trash2, onClick: handleClear, variant: "outline" },
    { label: "Upload", icon: Upload, onClick: handleUploadClick, variant: "outline" },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      disabled: !input,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions} />

      {/* Hidden native file input driving the "Upload" toolbar action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-white/10 bg-foreground/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <label htmlFor="markdown-input" className="text-sm font-medium text-foreground">
              Markdown source
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!input}
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <Textarea
            id="markdown-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={SAMPLE_PLACEHOLDER}
            spellCheck={false}
            className="min-h-[320px] flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-white/10 bg-foreground/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Preview</span>
          </div>

          <div className="min-h-[320px] flex-1 overflow-auto p-4">
            {input.trim() ? (
              blocks.map((block, index) => renderBlock(block, index))
            ) : (
              <p className="text-sm text-muted-foreground">
                Your rendered Markdown will appear here as you type.
              </p>
            )}
          </div>
        </div>
      </div>

      <TextStats text={input} />
    </div>
  );
}

export default MarkdownPreviewer;
