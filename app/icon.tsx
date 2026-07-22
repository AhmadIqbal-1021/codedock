import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon — mirrors Logo.tsx's icon mark exactly (same gradient,
 * same ">_" glyph, same corner radius proportion) so the browser
 * tab icon and the in-app logo never drift apart. If you change the
 * gradient or glyph in Logo.tsx, update the values here to match.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
          borderRadius: 7,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "monospace",
            lineHeight: 1,
          }}
        >
          &gt;_
        </span>
      </div>
    ),
    { ...size }
  );
}
