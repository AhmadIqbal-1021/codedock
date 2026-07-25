"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent
} from "react";
import { Check, Copy, Download, Upload, Wand2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import { JsonEditor } from "./JsonEditor";
import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";


const SAMPLE_PLACEHOLDER = `{
  "paste": "your JSON here",
  "then": "click Format"
}`;

/**
 * JSON Formatter's working UI: toolbar + input/output editors.
 * No network calls — parsing, validation, formatting, file upload,
 * and file download all happen in the browser.
 *
 * All business logic (format/clear/copy/upload/download) lives here;
 * ToolToolbar just renders whatever `actions` array it's handed.
 *
 * This is meant to be rendered as `children` inside ToolLayout, which
 * supplies the page's icon/title/description/category header:
 *
 * <ToolLayout icon={Braces} title="JSON Formatter" description="..." category="Developer Tools">
 *   <JsonFormatter />
 *   <ToolFeatures features={...} />
 *   <ToolFAQ items={...} />
 *   <RelatedTools tools={...} />
 * </ToolLayout>
 */


const INDENT_OPTIONS = [2, 4] as const;
type Indent = (typeof INDENT_OPTIONS)[number];

type JsonError = {
  message: string;
  line?: number;
  column?: number;
};
function getJsonErrorDetails(
  error: unknown,
  json: string
): JsonError {

  const message =
    error instanceof Error
      ? error.message
      : "Invalid JSON";


  let position = -1;


  const positionMatch =
    message.match(/position (\d+)/);


  if (positionMatch) {
    position = Number(positionMatch[1]);
  }


  if (position === -1) {

    const badCharMatch =
      message.match(/token ['"](.+?)['"]/);


    if (badCharMatch) {

      const badChar =
        badCharMatch[1];


      position =
        json.indexOf(badChar);

    }

  }


  if (position === -1) {

    return {
      message,
    };

  }


  const beforeError =
    json.slice(0, position);


  const lines =
    beforeError.split("\n");


  return {
    message,
    line: lines.length,
    column:
      lines[lines.length - 1].length + 1,
  };
}
export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error,setError] = useState<JsonError | null>(null);
  const [indent, setIndent] = useState<Indent>(2);
  const [copied, setCopied] = useState(false);
  

  const fileInputRef = useRef<HTMLInputElement>(null);


const handleFormat = useCallback(() => {

 if (!input.trim()) {

   setError({
     message:"Paste some JSON before formatting."
   });

   setOutput("");

   return;
 }


 try {

   const parsed = JSON.parse(input);

   setOutput(
     JSON.stringify(
       parsed,
       null,
       indent
     )
   );

   setError(null);


 } catch(err){

   setOutput("");

   setError(
     getJsonErrorDetails(
       err,
       input
     )
   );

 }

}, [input, indent]);

  useEffect(() => {

  const handleKeyDown = (event: KeyboardEvent) => {

    if (
      event.ctrlKey &&
      event.key === "Enter"
    ) {

      event.preventDefault();

      handleFormat();

    }

  };


  window.addEventListener(
    "keydown",
    handleKeyDown
  );


  return () => {

    window.removeEventListener(
      "keydown",
      handleKeyDown
    );

  };


}, [input, indent]);



  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
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
   if (!file.name.endsWith(".json")) {
  setError({
    message: "Please upload a JSON file.",
    line: 0,
    column: 0,
  });
  return;
}


    const reader = new FileReader();
    reader.onload = () => {
      setInput(reader.result as string);
      setError(null);
      setOutput("");
    };
    reader.readAsText(file);

    // Reset so selecting the same file again still fires onChange.
    event.target.value = "";
  };

  const handleDownload = () => {
    if (!output) return;

    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "codedock-formatted-json.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const actions: ToolAction[] = [
    { label: "Format JSON", icon: Wand2, onClick: handleFormat },
    { label: "Clear", icon: Trash2, onClick: handleClear, variant: "outline" },
    { label: "Upload", icon: Upload, onClick: handleUploadClick, variant: "outline" },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      disabled: !output,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Indent size"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {INDENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIndent(option)}
              aria-pressed={indent === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                indent === option
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option} spaces
            </button>
          ))}
        </div>
      </ToolToolbar>
                <div className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border px-1.5 py-0.5">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="rounded border px-1.5 py-0.5">
              Enter
            </kbd>
            {" to format JSON"}
          </div>

      {/* Hidden native file input driving the "Upload" toolbar action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <JsonEditor
          id="json-input"
          label="Input"
          value={input}
          onChange={setInput}
          placeholder={SAMPLE_PLACEHOLDER}
                  error=         {error && (
  <ToolError
    title="Invalid JSON"
    message={
      [
        error.line
          ? `Line: ${error.line}`
          : null,
        error.column
          ? `Column: ${error.column}`
          : null,
        error.message,
      ]
        .filter(Boolean)
        .join(" • ")
    }
  />
)}
            
     

        />
        

        <JsonEditor
          id="json-output"
          label="Formatted output"
          value={output}
          readOnly
          placeholder="Formatted JSON will appear here."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!output}
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
            
          }
        />
      </div>
      <TextStats text={input} />
    </div>
    
  );
}


export default JsonFormatter;
