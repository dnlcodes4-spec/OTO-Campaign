import type { PictogramProps } from "./index";

/*
 * A secular state, in writing: two planes held apart by a clean diagonal
 * gap. The upper plane is the state; the gold seam along its underside is
 * the written constitutional line that draws the separation. The lower
 * plane, faith, sits at reduced weight: present, private, and untouched.
 * The empty gap between them is the message.
 */
export function SecularState({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-secular-state"
      className={className}
    >
      <polygon points="6,10 90,10 90,30 6,44" fill="currentColor" />
      <polygon points="6,44 90,30 90,36 6,50" fill="var(--color-brand-gold)" />
      <polygon points="6,66 90,52 90,88 6,88" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
