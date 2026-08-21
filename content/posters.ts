export type Poster = {
  id: string;
  src: string;
  alt: string;
  downloadName: string;
};

/*
 * Fixed print assets, not editable prose: unlike the CMS-backed content in
 * this directory, these five posters live at public/posters and only change
 * when the campaign ships new artwork, so they stay a plain static list
 * rather than a getSiteContent()-backed type in the schema registry.
 */
export const posters: Poster[] = [
  {
    id: "poster-1",
    src: "/posters/poster-1.jpg",
    alt: "OTO for Senate campaign poster, design 1",
    downloadName: "OTO-for-Senate-poster-1.jpg",
  },
  {
    id: "poster-2",
    src: "/posters/poster-2.jpg",
    alt: "OTO for Senate campaign poster, design 2",
    downloadName: "OTO-for-Senate-poster-2.jpg",
  },
  {
    id: "poster-3",
    src: "/posters/poster-3.jpg",
    alt: "OTO for Senate campaign poster, design 3",
    downloadName: "OTO-for-Senate-poster-3.jpg",
  },
  {
    id: "poster-4",
    src: "/posters/poster-4.jpg",
    alt: "OTO for Senate campaign poster, design 4",
    downloadName: "OTO-for-Senate-poster-4.jpg",
  },
  {
    id: "poster-5",
    src: "/posters/poster-5.jpg",
    alt: "OTO for Senate campaign poster, design 5",
    downloadName: "OTO-for-Senate-poster-5.jpg",
  },
];
