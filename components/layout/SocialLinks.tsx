import type { ComponentType } from "react";
import type { SocialLink, SocialPlatform } from "@/content/site";
import {
  FacebookMark,
  InstagramMark,
  TwitterMark,
  YouTubeMark,
  type SocialMarkProps,
} from "@/components/graphics";

type SocialLinksPlane = "light" | "dark";

const MARKS: Record<SocialPlatform, ComponentType<SocialMarkProps>> = {
  facebook: FacebookMark,
  twitter: TwitterMark,
  instagram: InstagramMark,
  youtube: YouTubeMark,
};

/*
 * Same plane split Nav, Footer and Button already use, for the same WCAG
 * 1.4.11 reasons: brand-green rings on the light header bar (7.05:1 on
 * bg-surface), brand-gold rings on the green and deep-green planes (4.16:1
 * and 8.19:1). Rest and hover colors follow the link grammar of each plane:
 * ink turning green in the header, soft inverse turning gold on the dark
 * planes.
 */
const PLANE_LINK: Record<SocialLinksPlane, string> = {
  light:
    "text-ink hover:text-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
  dark: "text-ink-inverse/80 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
};

type SocialLinksProps = {
  plane: SocialLinksPlane;
  /*
   * The Nav placements render inside a "use client" component tree, which
   * cannot await the CMS-backed content itself, so every placement takes
   * the resolved list as a prop from a server-rendered ancestor instead of
   * importing it directly.
   */
  socials: SocialLink[];
  /*
   * Mark size is a per-placement decision (subordinate beside the desktop
   * nav links, larger in the overlay coda), so the caller sets it.
   */
  markClassName?: string;
  className?: string;
};

/*
 * One row, three placements (header, overlay coda, footer), all reading the
 * same placeholder-driven array sourced from content/site.ts. Every link
 * opens the platform in a new tab and is named "OTO on <platform>"; the
 * glyphs stay decorative.
 */
export function SocialLinks({
  plane,
  socials,
  markClassName = "h-5 w-5",
  className = "",
}: SocialLinksProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {socials.map((social) => {
        const Mark = MARKS[social.platform];
        return (
          <a
            key={social.platform}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`OTO on ${social.label}`}
            className={`inline-flex transition-colors ${PLANE_LINK[plane]}`}
          >
            <Mark className={markClassName} />
          </a>
        );
      })}
    </div>
  );
}
