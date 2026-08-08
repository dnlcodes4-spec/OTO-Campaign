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
