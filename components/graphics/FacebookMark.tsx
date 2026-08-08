import type { SocialMarkProps } from "./index";

/*
 * Facebook's lowercase f, redrawn as a single flat fill. The letterform
 * alone, no containing tile, so the mark takes the color of the link it
 * sits in exactly like the site's text does.
 */
export function FacebookMark({ className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="social-mark-facebook"
      className={className}
    >
      <path
        fill="currentColor"
        d="M13.5 21.9v-8.4h2.82l.42-3.27h-3.24V8.14c0-.95.26-1.59 1.62-1.59h1.73V3.62c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.21 1.53-4.21 4.33v2.42H7.28v3.27h2.83v8.4h3.39Z"
      />
    </svg>
  );
}
