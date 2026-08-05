/*
 * Custom pictograms for the legislative agenda, drawn in the site's own
 * visual language: flat filled planes, hard edges, and the diagonal cut
 * that runs high on the right across every section of the page. No stroke
 * grammar, no rounded caps, nothing from an icon library. Color arrives
 * through currentColor plus the brand gold token, so the same drawing
 * reads on the deep green agenda plane and on light planes alike. Every
 * pictogram is decorative (aria-hidden); the ledger text carries meaning.
 */
export type PictogramProps = {
  className?: string;
};

export { StatePolice } from "./StatePolice";
export { Residency } from "./Residency";
export { SecularState } from "./SecularState";
export { FederatingZones } from "./FederatingZones";
