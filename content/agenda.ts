import { getSiteContent } from "@/lib/content/site-content";

export type AgendaRoute = {
  title: string;
  points?: string[];
};

export type AgendaItem = {
  number?: string;
  title: string;
  thesis: string;
  points?: string[];
  routes?: AgendaRoute[];
  note?: string;
};

export type Pledge = {
  title?: string;
  detail: string;
};

export const agendaContentDefault = {
  intro:
    "The question most people going to the Senate from Oyo South never answered before they took their seat. Little wonder their four or more years were usually uneventful, and their names are appended to no piece of legislation. So here is the agenda, in writing, before you vote.",
  items: [
    {
      number: "1",
      title: "State police",
      thesis:
        "A state police bill is already being worked at nationally. OTO will study its provisions and put input into an amendment bill that shores up a viable state policing system. Should it not materialise in this Senate, the thinking below stands ready for its creation or its amendment, by whichever of two routes moves.",
      routes: [
        {
          title: "Negotiate the caucuses",
          points: [
            "Sit with senators across the six geopolitical zones, Northern and Southern caucuses jointly, and secure their buy-in before the legislation is ever introduced.",
            "Disabuse the notion that state police would aid secession.",
            "Start with non-lethal force of arms, pistols capped at twelve rounds, with armored personnel carriers for maximum protection of personnel.",
            "Cap the number of recruits per population sample.",
          ],
        },
        {
          title: "Redraft the Civil Defence law",
          points: [
            "Turn the Civil Defence corps from a national force into six independent regional commands, personnel returning to their regions under a new nomenclature.",
            "Empower them by law to prosecute certain crimes directly, independent of the police.",
            "A Commandant General nominated by the regions in turn, rotating between North and South rather than by ballot, starting from the region opposite the sitting president's zone.",
            "Funded 30 percent by the federation and 70 percent by the states of the zone.",
            "Operationally answerable to each state governor: a standing force every governor can call on when peace is threatened in that state.",
          ],
        },
      ],
    },
    {
      number: "2",
      title: "Residency over state of origin",
      thesis:
        "Amend the constitution so that where you live and pay your way counts for more than where your grandfather was born.",
      points: [
        "Anyone who has lived an entire lifetime in a state can claim legal residency there and every benefit that accrues to indigenes.",
        "Their children become naturalized indigenes of that state by virtue of birth.",
        "Eases ethnic tension, engenders patriotism, and turns residents into contributors: if everyone living in Oyo State paid their taxes into Oyo State, the state would be markedly better off.",
      ],
    },
    {
      number: "3",
      title: "A secular state, in writing",
      thesis:
        "Amend the constitution to expressly provide for the secularity of the Nigerian state, and take religion out of government policy altogether.",
      points: [
        "State categorically that no one may govern Nigeria through the tenets of any particular religion, with prescribed punishment for violations, up to impeachment.",
        "Benin Republic, Sierra Leone and Burkina Faso each carry Muslim populations of around 60 percent and none of Nigeria's religious tension, because their constitutions declare the state secular and keep religion a private matter.",
        "Governance by constitution, not by religious laws. Anyone could lead the country, whatever their faith, because faith would carry no weight in office.",
        "Nigeria's constitution carries the opening statement and then laces everything after it with religious innuendo and dogma. The secularity clause belongs directly under that opening line, tied expressly to the article of impeachment.",
      ],
    },
    {
      number: "4",
      title: "Six zones, truly federating",
      thesis:
        "Make Nigeria truly a republic and truly federating in spirit and letter, starting from the six geopolitical zones as the federating units.",
      points: [
        "Each zone free to choose its own name, which takes the air out of unending secessionist agitation.",
        "Each zone controls its own education and its own economy.",
        "The center keeps a single foreign ministry, one Army, immigration, and the Central Bank.",
        "One currency with regional variation: a Biafran Naira equals an Oduduwa Naira equals every other Naira, all bearing the same security features and symbols.",
      ],
    },
    {
      number: "5",
      title: "Warranty laws with teeth",
      thesis:
        "Our warranty laws are too weak and inoperable, steeped in the production and service ethics of 1960. Revamp them with punishment and enforcement built in.",
      points: [
        "A mandatory refund policy with every sale.",
        "A minimum warranty period and a return period per item, across categories.",
        "The chain enforces itself: the end user returns defective goods to the retailer, who by law must refund and pass them back to the distributor, who does likewise all the way to the importer.",
        "When importers know every defective item comes back to them for a refund, they stop going overseas for fake and substandard products.",
      ],
    },
    {
      number: "6",
      title: "Institutions that answer to the constitution",
      thesis:
        "An Inspector General of Police, of Customs, of the EFCC swears an oath to assume office, then is left defenceless the moment duty runs against the person who appointed them. That exposure corrupts every such agency. Change the law so their boss is the constitution.",
      points: [
        "Empower agency heads by law to obey only the constitution of the republic, at all times.",
        "Rewrite the oath: whoever appoints you does so as a servant of the constitution, so any directive contrary to it is ultra vires.",
        "Where an executive is adamant, the office holder writes to the Senate and the judiciary at once, and the judiciary must empanel judges to interpret the bone of contention.",
        "Agencies gain standing to sue the government themselves. A president who knows these scenarios are possible stops treating agencies of government as attack dogs.",
      ],
    },
  ] as AgendaItem[],
  pledgesIntro:
    "Much of this costs the office nothing but follow-through: connecting opportunities that already exist in the district with investors who are already looking for them.",
  pledgesPull:
    "Not everything requires money. Most of what fails in society fails for lack of planning.",
  pledges: [
    {
      title: "Scholarships",
      detail: "To deserving students across the district.",
    },
    {
      title: "Schools renovated",
      detail: "Renovation of schools and classrooms, and provision of teaching aids.",
    },
    {
      title: "Fertilizer supply",
      detail: "Fighting for adequate fertilizer supply to the Southern district.",
    },
    {
      title: "Tractor loans",
      detail:
        "Syndicated loans for tractor purchases, after reorganizing farmers into sectional associations.",
    },
    {
      title: "Buses rerouted",
      detail:
        "So every route no longer starts and terminates at the same two spots. Some still run Dugbe to Mokola, but branch into the inner roads people actually live on.",
    },
    {
      title: "Rail within the city",
      detail:
        "Investors for rail carriages on existing tracks, now that the NRC has liberalized carriage provision. A short line: Omi-Adio, Apata, Dugbe, Mokola, Bodija.",
    },
    {
      title: "Multi-level parking",
      detail: "Investors for parking facilities across Ibadan, easing congestion off the roads.",
    },
    {
      title: "More transformers",
      detail:
        "Additional transformers to improve electricity supply across the communities of Oyo South.",
    },
  ] as Pledge[],
};

export async function getAgendaContent() {
  return getSiteContent("agenda", agendaContentDefault);
}
