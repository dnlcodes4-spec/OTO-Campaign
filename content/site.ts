import { cache } from "react";
import { getSiteContent } from "@/lib/content/site-content";

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  href: string;
};

const KNOWN_PLATFORMS: readonly SocialPlatform[] = ["facebook", "instagram", "youtube", "tiktok"];

/*
 * `content/schemas/site.ts` deliberately leaves `platform` out of the
 * socials list-item schema (it's meant to stay a fixed, non-editable key),
 * which means `SchemaForm`'s generic list "Add" button - which always
 * appends an empty `{}` - produces a social entry with no `platform` at
 * all. `getSiteContent`'s deep merge replaces arrays wholesale rather than
 * merging item-by-item, so a malformed entry like that would otherwise
 * reach every consumer of this function unmodified and crash
 * `SocialLinks.tsx` (`MARKS[undefined]` is `undefined`, and rendering an
 * undefined component throws). Filter here, at the source, so nothing that
 * calls `getSiteContentData()` - now or in the future - can receive one.
 */
function isKnownSocialLink(social: unknown): social is SocialLink {
  if (!social || typeof social !== "object") return false;
  const platform = (social as { platform?: unknown }).platform;
  return typeof platform === "string" && (KNOWN_PLATFORMS as readonly string[]).includes(platform);
}

/*
 * Site-wide identity assets. The round green mark always appears beside the
 * OTO wordmark, never in place of it: the wordmark stays the accessible name
 * and the visual identity, the mark supports it. That is why the alt is
 * intentionally empty. Screen readers hear "OTO" once instead of a redundant
 * "OTO logo, OTO".
 *
 * The Zenith Labour Party badge is the opposite case: it is the party's
 * endorsement of the candidate, information the nearby copy does not
 * always spell out, so it carries a plain descriptive alt everywhere it
 * appears. The badge is the party's official mark, a white rounded card
 * with the red, white and green panels, and is always placed as that
 * card on the page's colored planes, never recolored or cropped.
 *
 * The real profile URLs below (facebook/instagram/youtube/tiktok, no
 * twitter — the campaign has no account there) are the confirmed live
 * handles. Once this content type has ever been saved through the CMS
 * (which is the normal path in production — every content area ships with
 * a seeded row), the database row wins over this array entirely; editing
 * this file alone will not change what's live. Update the real profile
 * URLs at /admin/content/site instead. This array still matters as the
 * shape SchemaForm renders against, and as the fallback an empty/unseeded
 * database degrades to.
 */
export const siteContentDefault = {
  logo: {
    src: "/images/oto-logo.png",
    alt: "",
  },
  partyLogo: {
    src: "/images/zlp-logo.png",
    alt: "Zenith Labour Party logo",
  },
  socials: [
    { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/otosenate2027" },
    { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/otosenate2027/" },
    { platform: "youtube", label: "YouTube", href: "https://youtube.com/@otosenate2027" },
    { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@otosenate2027" },
  ] as SocialLink[],
};

/*
 * Wrapped in React's cache() so multiple call sites within the same
 * request/render pass (app/(site)/layout.tsx, app/(site)/page.tsx,
 * Footer.tsx) share one underlying Supabase query instead of each issuing
 * their own round trip for the same row.
 */
export const getSiteContentData = cache(async () => {
  const content = await getSiteContent("site", siteContentDefault);
  return {
    ...content,
    socials: content.socials.filter(isKnownSocialLink),
  };
});
