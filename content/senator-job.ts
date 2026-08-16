import { getSiteContent } from "@/lib/content/site-content";

export type JobSegment = {
  number: string;
  title: string;
  detail: string;
};

export const senatorJobContentDefault = {
  intro:
    "People look at the Senate and say the job should be part-time. That is a job-description problem, not a workload problem. The work divides into four measurable segments.",
  segments: [
    {
      number: "1",
      title: "Make the laws",
      detail:
        "Amendment of existing laws, repeal of the ones that have failed, enactment of new ones, and deliberation on the vital issues of national importance.",
    },
    {
      number: "2",
      title: "Watch the budget",
      detail:
        "Scrutiny of the national budget, passage after amendments are proposed, then monitoring of its implementation, including approval of the instruments that make it work, like external and internal borrowing.",
    },
    {
      number: "3",
      title: "Fight for the district's share",
      detail:
        "Constant correspondence and travel: writing state governments, ministries, departments and agencies, asking questions, demanding meetings. If 20,000 tractors are provided in the budget, someone must fight through for the 183 due to Oyo South. Even when allocations are not fully released, the one who fights gets some.",
    },
    {
      number: "4",
      title: "Bring the investors",
      detail:
        "Direct financing of projects with commercial value: the mountain ranges from Idere to Aiyete and Tapa in Ibarapa could open Oyo South to the tourism industry. Every holiday directory lists The Gambia. We have as much here to turn into money.",
    },
  ] as JobSegment[],
  challenge:
    "Now ask: which of these has the current crop done satisfactorily? And if those who did nothing in the House of Representatives are attempting the Senate, ask exactly what they will do differently.",
};

export async function getSenatorJobContent() {
  return getSiteContent("senator-job", senatorJobContentDefault);
}
