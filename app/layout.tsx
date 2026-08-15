import type { Metadata } from "next";
import { clashDisplay, switzer } from "./fonts";
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

/*
 * The root layout owns only the document shell: <html>, the fonts, the
 * global stylesheet and the default metadata. The public site's Nav/Footer
 * chrome lives in app/(site)/layout.tsx, so that /admin/* and /dev/* -
 * which render their own <main> - do not inherit a second landmark or the
 * campaign navigation.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${switzer.variable} h-full motion-safe:scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-surface font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
