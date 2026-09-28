import { ImageResponse } from "next/og";

export const alt =
  "CancelKit — Catch the cancel. Never trap it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0F1E36",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#FFB400" }}>
          CancelKit
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Catch the cancel. Never trap it.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#AAB6C8" }}>
          One fair offer before Stripe cancels. “Cancel anyway” always one click away.
        </div>
      </div>
    ),
    size
  );
}
