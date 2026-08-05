import Image from "next/image";

type CampaignImageTone = "green" | "green-bright" | "green-deep" | "gold" | "red";

type CampaignImageFit = "cover" | "cutout";

type CampaignImageProps = {
  /*
   * Still optional on purpose. The candidate's portraits now fill the main
   * slots, but any slot whose photograph has not arrived renders as a flat
   * brand-color plane that belongs to the page's poster composition, not a
   * placeholder graphic. No stock imagery, no external URLs, ever.
   */
  src?: string;
  alt: string;
  tone?: CampaignImageTone;
  /*
   * "cover" frames conventional photography inside its box. "cutout" is for
   * the alpha-cut portraits: the full figure scales inside the box and
   * anchors to its bottom edge, so the flat crop line of the bust lands
   * exactly on whatever plane edge the section composes it against. Nothing
   * is ever painted behind a real photo; the plane the section provides shows
   * through the alpha.
   */
  fit?: CampaignImageFit;
  sizes?: string;
  /*
   * Set on the one image that is the page's largest contentful paint (the
   * hero portrait) so the browser fetches it before layout settles.
   */
  preload?: boolean;
  className?: string;
};

const TONE_PLANE: Record<CampaignImageTone, string> = {
  green: "bg-brand-green",
  "green-bright": "bg-brand-green-bright",
  "green-deep": "bg-brand-green-deep",
  gold: "bg-brand-gold",
  red: "bg-brand-red",
};

const FIT_IMAGE: Record<CampaignImageFit, string> = {
  cover: "object-cover",
  cutout: "object-contain object-bottom",
};

export function CampaignImage({
  src,
  alt,
  tone = "green",
  fit = "cover",
  sizes,
  preload,
  className = "",
}: CampaignImageProps) {
  if (!src) {
    /*
     * The empty slot is decorative until a real photograph fills it, so it is
     * hidden from assistive tech rather than announced as an image that is
     * not there. The alt is kept on the prop so the day the src lands, the
     * description ships with it.
     */
    return <div aria-hidden="true" className={`${TONE_PLANE[tone]} ${className}`} />;
  }

  return (
    <div className={`relative ${fit === "cover" ? "overflow-hidden" : ""} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={FIT_IMAGE[fit]} />
    </div>
  );
}
