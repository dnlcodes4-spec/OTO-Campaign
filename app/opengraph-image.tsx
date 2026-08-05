import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CANDIDATE_NAME, CANDIDATE_RACE } from "@/lib/site";

/*
 * The share card is the one asset almost nobody reading this codebase will
 * ever open: it is rendered once at build time and then lives inside
 * WhatsApp, X and iMessage previews. Satori (the renderer behind
 * next/og's ImageResponse) only understands a flexbox subset of CSS, so
 * this stays deliberately simple: two flat planes on the shared brand
 * diagonal, the round mark, and three lines of strong type. No clip-path
 * (unsupported by Satori), no remote fonts (bundled type is woff2, which
 * ImageResponse cannot parse; ttf/otf/woff only) - a bold system sans
 * keeps this legible at WhatsApp's thumbnail size without a network
 * fetch at build time.
 */
export const alt = `${CANDIDATE_NAME}, ${CANDIDATE_RACE}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const logoData = await readFile(
  join(process.cwd(), "public/images/oto-logo.png"),
  "base64",
);
const logoSrc = `data:image/png;base64,${logoData}`;

const BRAND_GREEN_DEEP = "#132d1f";
const BRAND_GREEN_BRIGHT = "#009846";
const BRAND_GOLD = "#f5b700";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: BRAND_GREEN_DEEP,
          fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 640,
            height: 640,
            right: -220,
            bottom: -260,
            borderRadius: 9999,
            backgroundColor: BRAND_GREEN_BRIGHT,
            opacity: 0.16,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "72px 84px",
          }}
        >
          <img
            src={logoSrc}
            width={112}
            height={112}
            alt=""
            style={{ borderRadius: 9999, marginBottom: 36 }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 148,
              fontWeight: 700,
              color: "#fefefe",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            OTO
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 42,
              fontWeight: 600,
              color: "#fefefe",
            }}
          >
            {CANDIDATE_NAME}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 44,
                height: 6,
                borderRadius: 9999,
                backgroundColor: BRAND_GOLD,
                marginRight: 18,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 500,
                color: BRAND_GOLD,
              }}
            >
              {CANDIDATE_RACE}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
