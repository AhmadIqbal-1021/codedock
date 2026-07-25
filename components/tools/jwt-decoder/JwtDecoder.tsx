"use client";

import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";

type JwtPart = {
  value: string;
  json: string;
};

type JwtError = {
  message: string;
};

function decodeBase64Url(value: string): string {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  const binary = atob(padded);

  const bytes = Uint8Array.from(
    binary,
    (char) => char.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

function decodeJwtPart(value: string): JwtPart {
  const decoded = decodeBase64Url(value);
  const parsed = JSON.parse(decoded);

  return {
    value,
    json: JSON.stringify(parsed, null, 2),
  };
}

export function JwtDecoder() {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState<JwtPart | null>(null);
  const [payload, setPayload] = useState<JwtPart | null>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<JwtError | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleDecode = () => {
    setError(null);
    setHeader(null);
    setPayload(null);
    setSignature("");

    const token = input.trim();

    if (!token) {
      setError({
        message: "Paste a JWT token before decoding.",
      });
      return;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      setError({
        message:
          "Invalid JWT. A JWT must contain three parts separated by dots.",
      });
      return;
    }

    try {
      const decodedHeader = decodeJwtPart(parts[0]);
      const decodedPayload = decodeJwtPart(parts[1]);

      setHeader(decodedHeader);
      setPayload(decodedPayload);
      setSignature(parts[2]);
    } catch {
      setError({
        message:
          "Invalid JWT. The header or payload could not be decoded.",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setHeader(null);
    setPayload(null);
    setSignature("");
    setError(null);
    setCopied(null);
  };

  const handleCopy = async (
    value: string,
    type: string
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      setTimeout(() => {
        setCopied(null);
      }, 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  const actions: ToolAction[] = [
    {
      label: "Decode JWT",
      onClick: handleDecode,
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions} />

      <div className="space-y-2">
        <label
          htmlFor="jwt-input"
          className="text-sm font-medium"
        >
          JWT Token
        </label>

        <textarea
          id="jwt-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste your JWT token here..."
          className="min-h-40 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring"
          spellCheck={false}
        />
      </div>

          {error && (
        <ToolError
          title="Invalid JWT"
          message={error.message}
        />
      )}

      {(header || payload || signature) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {header && (
            <section className="rounded-xl border">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-semibold">
                  Header
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      header.json,
                      "header"
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied === "header"
                    ? "Copied"
                    : "Copy"}
                </Button>
              </div>

              <pre className="overflow-x-auto p-4 font-mono text-sm">
                {header.json}
              </pre>
            </section>
          )}

          {payload && (
            <section className="rounded-xl border">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-semibold">
                  Payload
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      payload.json,
                      "payload"
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied === "payload"
                    ? "Copied"
                    : "Copy"}
                </Button>
              </div>

              <pre className="overflow-x-auto p-4 font-mono text-sm">
                {payload.json}
              </pre>
            </section>
          )}

          {signature && (
            <section className="rounded-xl border lg:col-span-2">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-semibold">
                  Signature
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      signature,
                      "signature"
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied === "signature"
                    ? "Copied"
                    : "Copy"}
                </Button>
              </div>

              <pre className="overflow-x-auto break-all p-4 font-mono text-sm">
                {signature}
              </pre>
            </section>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Decoding a JWT does not verify its signature.
        Do not trust decoded claims without validating
        the token server-side.
      </p>
    </div>
  );
}

export default JwtDecoder;