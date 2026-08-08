/*
 * Site-wide identity assets. The round green mark always appears beside the
 * OTO wordmark, never in place of it: the wordmark stays the accessible name
 * and the visual identity, the mark supports it. That is why the alt is
 * intentionally empty. Screen readers hear "OTO" once instead of a redundant
 * "OTO logo, OTO".
 */
export const siteContent = {
  logo: {
    src: "/images/oto-logo.png",
    alt: "",
  },
  /*
   * The Zenith Labour Party badge is the opposite case: it is the party's
   * endorsement of the candidate, information the nearby copy does not
   * always spell out, so it carries a plain descriptive alt everywhere it
   * appears. The badge is the party's official mark, a white rounded card
   * with the red, white and green panels, and is always placed as that
   * card on the page's colored planes, never recolored or cropped.
   */
  partyLogo: {
    src: "/images/zlp-logo.png",
    alt: "Zenith Labour Party logo",
  },
};

export type SocialPlatform = "facebook" | "twitter" | "instagram" | "youtube";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  href: string;
};

/*
 * PLACEHOLDERS: the campaign's profiles are not live yet, so every href
 * points at the platform's root. When the client shares the real profile
 * URLs, swap each href below in place, one line per platform. Labels and
 * platform keys stay as they are; every rendered row reads from this array,
 * so nothing else changes. The Twitter entry keeps "Twitter" as its
 * accessible label while the rendered glyph is the X mark.
 */
export const socials: SocialLink[] = [
  { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
  { platform: "twitter", label: "Twitter", href: "https://x.com/" },
  { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
];
