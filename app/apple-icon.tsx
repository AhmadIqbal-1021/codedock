import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — same gradient mark as icon.tsx and Logo.tsx,
 * just scaled up for iOS home-screen bookmarks. Apple icons render
 * best without transparency and with a slightly larger corner radius
 * proportionally, so this isn't a 1:1 crop of icon.tsx, it's the same
 * design redrawn at 180x180.
 */
export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 88,
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
