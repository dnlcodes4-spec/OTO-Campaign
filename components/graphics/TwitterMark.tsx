import type { SocialMarkProps } from "./index";

/*
 * The platform's current X mark, drawn as one flat fill with the broken
 * diagonal cut out through the even-odd rule. The component and its
 * accessible label stay "Twitter": that is still the name people know the
 * channel by, only the glyph moved on.
 */
export function TwitterMark({ className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="social-mark-twitter"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.1h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.2 2.3h6.9l4.7 6.2 5.4-6.2Zm-1.1 17.5h1.8L6.9 4.2H5l12.1 15.6Z"
      />
    </svg>
  );
}
