import type { PictogramProps } from "./index";

/*
 * Warranty laws with teeth: the return chain closing on itself. The upper
 * plane is goods moving out through the market, stepping down along the
 * page's diagonal; the gold plane underneath is the refund driven back the
 * other way, importer-bound, by force of law. Two hard counter-currents,
 * nothing circular or soft about it.
 */
export function WarrantyLaws({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-warranty-laws"
      className={className}
    >
      <polygon points="6,18 66,10 66,30 6,38" fill="currentColor" />
      <polygon points="72,9 90,24 72,31" fill="currentColor" />
      <polygon points="30,58 90,50 90,70 30,78" fill="var(--color-brand-gold)" />
      <polygon points="24,51 6,66 24,73" fill="var(--color-brand-gold)" />
      <polygon points="42,84 78,79.5 78,88 42,92.5" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
