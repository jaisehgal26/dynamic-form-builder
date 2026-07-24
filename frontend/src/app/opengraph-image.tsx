import { ImageResponse } from "next/og";
import { LogoMarkGraphic } from "@/components/brand/logo-mark-graphic";
import { siteConfig } from "@/lib/site";
export const runtime = "edge";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 50%, #16162a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoMarkGraphic />
          </div>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {siteConfig.name}
          </span>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900, letterSpacing: "-0.03em" }}>
          {siteConfig.tagline}
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#a1a1aa", maxWidth: 820, lineHeight: 1.4 }}>
          Dynamic forms with conditional logic, multi-step flows, and real-time analytics.
        </div>
      </div>
    ),
    { ...size },
  );
}
