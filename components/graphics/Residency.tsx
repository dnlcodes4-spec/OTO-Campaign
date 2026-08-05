import type { PictogramProps } from "./index";

/*
 * Residency over state of origin: belonging is where you live and pay your
 * way. An angular figure (faceted head plate over a tapering shoulder plane)
 * stands on the ground plane of its home state and sinks a gold taproot
 * straight through the surface: the contribution that earns the claim. The
 * faint plate on the left horizon is the state of origin, left behind.
 */
export function Residency({ className }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      data-testid="pictogram-residency"
      className={className}
    >
      <polygon points="6,40 26,37.5 26,54 6,56.5" fill="currentColor" fillOpacity="0.35" />
      <polygon points="6,60 90,50 90,88 6,88" fill="currentColor" />
      <polygon points="40,52 58,52 49,80" fill="var(--color-brand-gold)" />
      <polygon points="34,26 64,22 56,48 42,48" fill="currentColor" />
      <polygon points="40,6 58,4 58,18 40,20" fill="currentColor" />
    </svg>
  );
}
