import { ImageResponse } from "next/og";

export const alt =
  "CancelKit — Your cancel button fires instantly. Fix that in 5 minutes.";
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
          background: "#FAFAF9",
          color: "#16181D",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#4353FF" }}>
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
          Your cancel button fires instantly. Fix that in 5 minutes.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#5C616B" }}>
          One script tag. $39/mo. One saved customer pays for the year.
        </div>
      </div>
    ),
    size
  );
}
