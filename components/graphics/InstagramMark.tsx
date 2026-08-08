import type { SocialMarkProps } from "./index";

/*
 * Instagram's camera tile: the rounded frame, the lens, the dot. Drawn as
 * flat rings through the even-odd rule rather than strokes, so the mark
 * stays a fill like every other drawing on the site and inherits the link
 * color through currentColor.
 */
export function InstagramMark({ className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="social-mark-instagram"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.1 2h9.8A5.1 5.1 0 0 1 22 7.1v9.8a5.1 5.1 0 0 1-5.1 5.1H7.1A5.1 5.1 0 0 1 2 16.9V7.1A5.1 5.1 0 0 1 7.1 2Zm0 1.9a3.2 3.2 0 0 0-3.2 3.2v9.8a3.2 3.2 0 0 0 3.2 3.2h9.8a3.2 3.2 0 0 0 3.2-3.2V7.1a3.2 3.2 0 0 0-3.2-3.2H7.1ZM12 6.9a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2Zm0 1.9a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.35-3.4a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
      />
    </svg>
  );
}
