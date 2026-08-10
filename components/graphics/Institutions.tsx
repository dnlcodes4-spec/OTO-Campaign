import type { PictogramProps } from "./index";

/*
 * Institutions that answer to the constitution: three agency plates standing
 * upright, each cut high on the right like the section planes. They do not
 * rest on the executive; they rest on the gold plane beneath them, the
 * constitution, which runs wider than all of them. The faint plate below is
 * the appointing power, present but no longer the foundation.
 */
export function Institutions({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-institutions"
      className={className}
    >
      <polygon points="10,20 26,18 26,54 10,56" fill="currentColor" />
      <polygon points="40,16 56,14 56,52 40,54" fill="currentColor" />
      <polygon points="70,12 86,10 86,50 70,52" fill="currentColor" />
      <polygon points="6,66 90,54 90,62 6,74" fill="var(--color-brand-gold)" />
      <polygon points="22,82 74,75.5 74,85 22,91.5" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
