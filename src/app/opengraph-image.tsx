import { ImageResponse } from "next/og";

export const alt = "Theo's Restaurant & Lounge — island soul food, late-night lounge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #1a1310 0%, #33261f 60%, #9d361a 140%)", color: "#f8f1e6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: "#dc5a2e", display: "flex" }} />
          <div style={{ fontSize: 30, letterSpacing: 8, color: "#e0b25f", textTransform: "uppercase" }}>Restaurant & Lounge</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontStyle: "italic", fontWeight: 700, lineHeight: 1 }}>Theo&apos;s</div>
          <div style={{ fontSize: 44, marginTop: 20, color: "#efe4d2" }}>Island soul food. Late-night lounge.</div>
        </div>
        <div style={{ fontSize: 28, color: "#e0b25f" }}>Order online · Pickup & delivery · Kingston, Jamaica</div>
      </div>
    ),
    size,
  );
}
