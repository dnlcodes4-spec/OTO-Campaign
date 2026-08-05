import type { Metadata } from "next";
import { clashDisplay, switzer } from "./fonts";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const description =
  "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OTO for Senate | Oyo South Senatorial District",
    template: `%s | ${SITE_NAME}`,
  },
  description,
  openGraph: {
    title: "OTO for Senate | Oyo South Senatorial District",
    description,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${switzer.variable} h-full motion-safe:scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-surface font-body text-ink antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
