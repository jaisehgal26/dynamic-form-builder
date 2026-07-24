import { ImageResponse } from "next/og";
import { LogoMarkGraphic } from "@/components/brand/logo-mark-graphic";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
        }}
      >
        <LogoMarkGraphic />
      </div>
    ),
    { ...size },
  );
}
