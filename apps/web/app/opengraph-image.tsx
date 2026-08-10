import { ImageResponse } from "next/og";

export const alt =
  "Sismo Abierto: actividad sísmica oficial de Perú y Colombia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Flag({ country }: { country: "peru" | "colombia" }) {
  return country === "colombia" ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 72,
        height: 48,
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid #d4d4d4",
      }}
    >
      <div style={{ display: "flex", flex: 2, background: "#FCD116" }} />
      <div style={{ display: "flex", flex: 1, background: "#003893" }} />
      <div style={{ display: "flex", flex: 1, background: "#CE1126" }} />
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        width: 72,
        height: 48,
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid #d4d4d4",
      }}
    >
      <div style={{ display: "flex", flex: 1, background: "#D91023" }} />
      <div style={{ display: "flex", flex: 1, background: "white" }} />
      <div style={{ display: "flex", flex: 1, background: "#D91023" }} />
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        color: "#171717",
        padding: "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 30,
          fontWeight: 700,
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 42,
            height: 42,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            background: "#171717",
            color: "white",
            fontSize: 24,
          }}
        >
          S
        </div>
        Sismo Abierto
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 750,
            lineHeight: 1.05,
            letterSpacing: -3,
            maxWidth: 980,
          }}
        >
          Actividad sísmica oficial, abierta y trazable
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid #d4d4d4",
              borderRadius: 12,
              padding: "14px 18px",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            <Flag country="peru" /> Perú · IGP
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid #d4d4d4",
              borderRadius: 12,
              padding: "14px 18px",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            <Flag country="colombia" /> Colombia · SGC
          </div>
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 20, color: "#737373" }}>
        Mapas, catálogos, API y CLI con procedencia en cada dato
      </div>
    </div>,
    size,
  );
}
