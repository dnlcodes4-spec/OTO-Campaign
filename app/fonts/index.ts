import localFont from "next/font/local";

export const clashDisplay = localFont({
  src: [
    { path: "./files/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./files/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

export const switzer = localFont({
  src: [
    { path: "./files/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "./files/Switzer-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});
