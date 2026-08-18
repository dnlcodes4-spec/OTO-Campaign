import type { SocialMarkProps } from "./index";

/*
 * The platform's note-and-loop mark, drawn as one flat fill so it takes
 * currentColor like the rest of the family instead of the two-tone treatment
 * the platform's own brand mark uses.
 */
export function TikTokMark({ className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="social-mark-tiktok"
      className={className}
    >
      <path
        fill="currentColor"
        d="M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
      />
    </svg>
  );
}
