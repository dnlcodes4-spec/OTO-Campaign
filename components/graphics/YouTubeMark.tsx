import type { SocialMarkProps } from "./index";

/*
 * YouTube's rounded screen with the play triangle cut straight out of the
 * fill through the even-odd rule, so whatever plane the mark sits on shows
 * through the triangle instead of a second painted color.
 */
export function YouTubeMark({ className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="social-mark-youtube"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 4.8c-4.1 0-6.9.3-6.9.3-1.1.13-2 1-2.2 2.14C2.7 8.5 2.6 10.2 2.6 12s.1 3.5.3 4.76c.2 1.13 1.1 2 2.2 2.13 0 0 2.8.31 6.9.31s6.9-.31 6.9-.31c1.1-.13 2-1 2.2-2.13.2-1.26.3-2.96.3-4.76s-.1-3.5-.3-4.76c-.2-1.13-1.1-2-2.2-2.14 0 0-2.8-.3-6.9-.3ZM10.1 8.9 15.6 12l-5.5 3.1V8.9Z"
      />
    </svg>
  );
}
