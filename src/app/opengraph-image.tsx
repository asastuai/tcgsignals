import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TCGSignals - Real-Time TCG Price Tracking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path d="M18.5 4L8 18h7l-1.5 10L24 14h-7l1.5-10z" fill="#6c5ce7" />
          </svg>
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#f0f0f5", letterSpacing: "-2px" }}>
            TCG<span style={{ color: "#6c5ce7" }}>Signals</span>
          </span>
        </div>
        <p style={{ fontSize: "28px", color: "#9898b0", maxWidth: "600px", textAlign: "center", lineHeight: 1.4 }}>
          Real-time price tracking for 21,000+ trading cards
        </p>
        <div style={{ display: "flex", gap: "32px", marginTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,203,5,0.15)", padding: "12px 24px", borderRadius: "12px" }}>
            <span style={{ fontSize: "20px", color: "#FFCB05", fontWeight: 700 }}>Pokemon TCG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(226,27,38,0.15)", padding: "12px 24px", borderRadius: "12px" }}>
            <span style={{ fontSize: "20px", color: "#E21B26", fontWeight: 700 }}>One Piece TCG</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
