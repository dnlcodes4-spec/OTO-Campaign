import type { ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { getSiteContentData } from "@/content/site";

/*
 * The public campaign site's chrome lives here rather than in the root
 * layout so that the admin and dev routes - which render their own <main>
 * and want no campaign navigation - sit outside it. `(site)` is a route
 * group: it adds no URL segment, so `/`, `/gallery` and `/story` are
 * unchanged.
 *
 * Nav is a client component and cannot await CMS-backed content itself, so
 * this server layout fetches it once and passes the pieces Nav needs down
 * as props. Footer fetches its own copy directly since it stays a server
 * component.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { logo, partyLogo, socials } = await getSiteContentData();
  return (
    <>
      <Nav logo={logo} partyLogo={partyLogo} socials={socials} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
