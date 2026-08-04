export type Teaser = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export const homeContent = {
  headline: "Send someone who actually shows up.",
  intro:
    "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong twelve years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  teasers: [
    {
      title: "The legislative agenda",
      body: "State police, a constitution that recognizes residency, a secular state, and a republic that actually federates.",
      href: "/agenda",
      linkLabel: "Read the agenda",
    },
    {
      title: "Who is OTO",
      body: "A Federal University of Technology, Minna graduate with an MSc from the University of Portsmouth, and no hunger for the avarice that passes for politics.",
      href: "/about",
      linkLabel: "Read the pedigree",
    },
    {
      title: "The campaign in pictures",
      body: "Photos and video from the trail across the Oyo South Senatorial District.",
      href: "/gallery",
      linkLabel: "See the gallery",
    },
  ] as Teaser[],
  closing: {
    title: "What we expect from you",
    body: "This campaign runs on people who talk to their neighbors, not just people who vote.",
    href: "/get-involved",
    linkLabel: "See how to help",
  },
};
