import { getSiteContent } from "@/lib/content/site-content";

export type StorySection = {
  heading: string;
  body?: string[];
};

/*
 * Everything here comes from the candidate's own revised brief (the "But Who
 * Is OTO" section). The teaser carries the condensed spine on the landing
 * page; the page content carries the full narrative on /story. Nothing is
 * embellished beyond the brief's own account.
 */
export const storyContentDefault = {
  teaser: {
    paragraphs: [
      "Born in Eruwa 58 years ago to two teachers whose salaries could not always feed the house, OTO read quantity surveying at the Federal University of Technology, Minna, and reached the United Kingdom on an uncle's half-paid tuition and years of back-breaking work for the rest.",
      "What turned the business he built there into a calling was a dream with three assignments: win the war over poverty for yourself, for your family, for your people. The first two are won. The third is why he is on your ballot.",
      "He gives the way he wished someone had given to him: scholarships of 75,000 naira a semester with no cameras invited, and cash gifts to fifty widows this September that he refused to let the party televise.",
    ],
    cta: "Read the full story",
    href: "/story",
  },
  page: {
    title: "The OTO Story",
    lead: "Oluwasegun Theophilus Oladimeji. Three names, one acronym, and a road to this ballot that began under extreme poverty in Eruwa.",
    sections: [
      {
        heading: "A childhood in Eruwa",
        body: [
          "OTO was born fifty-eight years ago at Eruwa, into a hardworking family of two teachers who struggled to raise their children on a teacher's pay, through years when the Shagari government withheld salaries outright. The family grew under extreme poverty. He went to Baptist Day School in Eruwa, then Obaseeku High School, and for university travelled far from home to Minna.",
        ],
      },
      {
        heading: "Minna, Kano, Portsmouth",
        body: [
          "At the Federal University of Technology, Minna, he read quantity surveying for six years, in a set promised a Master of Technology until the government reneged and graduated them with a B.Tech. NYSC posted him to Kano, and shortly after, he left for the United Kingdom to continue his studies at the University of Portsmouth.",
          "An uncle helped pay half the tuition. Raising the balance was tough, back-breaking work, and he remains eternally grateful for the opportunity that half-payment bought.",
        ],
      },
      {
        heading: "The dream with three assignments",
        body: [
          "In 1992 he had dreamt he would be sent to a foreign country, trained there, and brought back for an assignment. In 1998, lying on his bed in the UK and wondering whether some people are simply created for suffering, he slept and dreamt again: a hand tapped him and asked three things of him. Win the war over poverty for yourself, and start with this business. Win the war over poverty for your family. Win the war over poverty for your people.",
        ],
      },
      {
        heading: "Two wars won",
        body: [
          "He went on with the business he was shown, and the funds began to come. Soon there was enough to bring all of his siblings to the UK, where they are doing very well today.",
          "As CEO of Glory Educational Services Ltd he brought UK universities into Nigeria and became known for the mass recruitment of Nigerian students, leading delegations into tie-up agreements: Cranfield University with the University of Ibadan, Durham University with Covenant University, the University of Portsmouth with the Federal University of Technology, Minna.",
        ],
      },
      {
        heading: "The quiet giving",
        body: [
          "The scholarships he gives are 75,000 naira per student per semester, and no cameras are invited. His mother gives money to widows every year, and he provides the cash. This September she asked whether she should reduce it, since his hands were full with the campaign. He told her: Mama, increase it to fifty.",
          "When the party heard, they wanted radio and television on the event. He had already warned his mother never to mention his name. If they knew how bad it is for a woman to be widowed, he says, they would not think of calling a camera on them. He was very poor once, so he knows what genuine help looks like.",
        ],
      },
      {
        heading: "The third assignment",
        body: [
          "Early in 2021 he was reminded of the third part of the assignment. He said he was not sure Nigerians would listen, and the answer he received was: I have given you the grace to talk and be believed. So in late 2022 he joined the Labour Party, the first political party he had ever joined, and contested the 2023 elections. After the election, the powers that be moved against the Labour Party, so the group regrouped and joined the Zenith Labour Party.",
          "Everywhere he goes, people want him to talk about what he has already done for them. He tells them: unless that thought pattern changes, there will be no progress. He could bide his time, award 5,000-naira scholarships on radio and television to five hundred students, and be thought good. The current leaders travelled exactly that road.",
        ],
      },
    ] as StorySection[],
    closing: {
      line: "That is who OTO is.",
      cta: "Read what he intends to do with the seat",
      href: "/#agenda",
    },
  },
};

export async function getStoryContent() {
  return getSiteContent("story", storyContentDefault);
}
