import Image from "next/image";

type CampaignImageTone = "green" | "green-bright" | "green-deep" | "gold" | "red";

type CampaignImageProps = {
  /*
   * Optional on purpose. The client's photos of the candidate arrive later;
   * until then every slot renders as a flat brand-color plane that is part of
   * the page's poster composition, not a placeholder graphic. No stock
   * imagery, no external URLs, ever.
   */
  src?: string;
  alt: string;
  tone?: CampaignImageTone;
  sizes?: string;
  className?: string;
};

const TONE_PLANE: Record<CampaignImageTone, string> = {
  green: "bg-brand-green",
  "green-bright": "bg-brand-green-bright",
  "green-deep": "bg-brand-green-deep",
  gold: "bg-brand-gold",
  red: "bg-brand-red",
};

export function CampaignImage({
  src,
  alt,
  tone = "green",
  sizes,
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
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
