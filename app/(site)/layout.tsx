import type { ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

/*
 * The public campaign site's chrome lives here rather than in the root
 * layout so that the admin and dev routes - which render their own <main>
 * and want no campaign navigation - sit outside it. `(site)` is a route
 * group: it adds no URL segment, so `/`, `/gallery` and `/story` are
 * unchanged.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
