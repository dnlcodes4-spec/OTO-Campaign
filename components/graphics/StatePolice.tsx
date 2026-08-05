import type { PictogramProps } from "./index";

/*
 * State police: one federal monolith devolving into local commands. A single
 * wide plane sits at the top; below the fault line it breaks into smaller
 * plates that step up along the page's diagonal, multiplying as they go.
 * The gold plate is a state force picked out of the row. All edges are hard
 * and every cut runs high on the right, like the section planes themselves.
 */
export function StatePolice({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-state-police"
      className={className}
    >
      <polygon points="6,14 90,4 90,26 6,36" fill="currentColor" />
      <polygon points="6,50 30,47 30,63 6,66" fill="currentColor" />
      <polygon points="36,46.5 60,43.5 60,59.5 36,62.5" fill="var(--color-brand-gold)" />
      <polygon points="66,43 90,40 90,56 66,59" fill="currentColor" />
      <polygon points="18,74 40,71.5 40,82 18,84.5" fill="currentColor" fillOpacity="0.45" />
      <polygon points="52,70 74,67.5 74,78 52,80.5" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
