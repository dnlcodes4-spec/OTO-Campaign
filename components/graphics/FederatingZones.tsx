import type { PictogramProps } from "./index";

/*
 * Six zones, truly federating: six near-equal plates lock into one composed
 * field. The mid seam runs on the page's diagonal and the vertical seams
 * offset between rows, so the plates interlock rather than stack, and the
 * hairline gaps keep each unit distinct inside the whole. The gold plate,
 * bottom left, is the South West: one zone picked out of one republic.
 */
export function FederatingZones({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-federating-zones"
      className={className}
    >
      <polygon points="6,12 32,9.5 32,47.5 6,50" fill="currentColor" />
      <polygon points="36,9 62,6.5 62,44.5 36,47" fill="currentColor" />
      <polygon points="66,6 90,4 90,42 66,44" fill="currentColor" />
      <polygon points="6,54 28,52 28,90 6,92" fill="var(--color-brand-gold)" />
      <polygon points="32,51.5 58,49 58,87 32,89.5" fill="currentColor" />
      <polygon points="62,48.5 90,46 90,84 62,86.5" fill="currentColor" />
    </svg>
  );
}
