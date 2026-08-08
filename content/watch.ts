export type WatchContent = {
  /*
   * THE SWAP: when the client uploads the campaign film, replace null with
   * the video's 11-character YouTube id (the v= value in the watch URL).
   * That one edit is the whole release: the section drops its held plane
   * and renders the click-to-load player on its own, nothing else changes.
   */
  videoId: string | null;
  /*
   * Names the film for assistive tech everywhere it surfaces: the embed's
   * title attribute, the facade thumbnail's alt, the play control's label.
   */
  title: string;
  answer: string;
  body: string;
  /*
   * The held plane's copy while videoId is null. Written as a real promise
   * in the page's voice, not filler: the plane must read as designed, and
   * this is the only place its words live.
   */
  coming: {
    line: string;
    detail: string;
  };
};

export const watchContent: WatchContent = {
  videoId: null,
  title: "OTO for Senate: the campaign film",
  answer: "Watch him say it himself.",
  body: "Every answer on this page is a commitment the candidate makes in his own voice. The campaign is putting that case on film so you can weigh the messenger along with the message, and hold him to every word of it.",
  coming: {
    line: "The film is coming.",
    detail: "",
  },
};
