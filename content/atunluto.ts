import { getSiteContent } from "@/lib/content/site-content";

export type AtunlutoStat = {
  figure: string;
  label: string;
};

export type ProgrammeGroup = {
  title: string;
  entries: string[];
};

/*
 * Facts here come from the Atunluto Group's own site content and stay
 * exactly as researched: founding date, membership, LGA spread, the
 * running interventions and the Six Pillars. Nothing is embellished.
 */
export const atunlutoContentDefault = {
  answer: "He is not promising one. He already built it.",
  caucusLine:
    "OTO comes to this race from the Atunluto caucus within the Zenith Labour Party: the Atunluto Group, a grassroots political association founded in Oyo State in March 2024 and focused on the Oyo South Senatorial District. Built as a resilient structure since then, it has grown into a major caucus in the Oyo Zenith Labour Party.",
  model:
    "It practises cooperative politics. Members fund and own the structure the way a cooperative thrift works, sponsor candidates from their own ranks, and keep the power to remove them if they underperform.",
  stats: [
    {
      figure: "2024",
      label: "founded, in March, on the members' own commitment.",
    },
    {
      figure: "800+",
      label: "members funding and owning the structure together.",
    },
    {
      figure: "5 of 9",
      label: "LGAs of Oyo South already active, aiming for all nine.",
    },
  ] as AtunlutoStat[],
  running: {
    title: "Already running",
    entries: [
      "Interest-free member loans, in 50,000 to 100,000 naira tiers.",
      "WAEC fee support for students.",
    ],
  } as ProgrammeGroup,
  pillars: {
    title: "From the Six Pillars for 2027",
    entries: [
      "Agriculture: farm mechanization, 10 tractors per agrarian LGA.",
      "Healthcare: universal health insurance for 500+ vulnerable people per LGA.",
      "Transport: high-capacity CNG buses.",
    ],
  } as ProgrammeGroup,
  link: {
    href: "https://www.atunluto.com",
    label: "atunluto.com",
  },
};

export async function getAtunlutoContent() {
  return getSiteContent("atunluto", atunlutoContentDefault);
}
