import type { Metadata } from "next";
import { clashDisplay, switzer } from "./fonts";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTO for Senate | Oyo South Senatorial District",
  description:
    "Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${switzer.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface font-body text-ink antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
