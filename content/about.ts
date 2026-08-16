import { getSiteContent } from "@/lib/content/site-content";

export type EducationEntry = {
  period: string;
  school: string;
  credential: string;
};

export const aboutContentDefault = {
  nameParts: ["Oluwasegun", "Theophilus", "Oladimeji"],
  nameNote: "Three names. Their first letters are what Oyo South calls him: OTO.",
  portrait: {
    src: "/images/oto-suit-2.png",
    alt: "Oluwasegun Theophilus Oladimeji in a navy pinstripe suit",
  },
  party: "Zenith Labour Party",
  district: "Oyo South Senatorial District",
  abujaAnswer: "OTO is very hardworking.",
  abujaSupport:
    "So often we send people to Abuja whose sole interest is the perks of office, people with no idea why they are heading to the red chambers. The person who represents us well must be hardworking.",
  abujaRecord: [
    "No godfather sent him. OTO has God for a godfather, is not poor, and is not in politics for what he can take out of it: there is a profitable 9-to-5 waiting for him when politics is done.",
    "Most people sent before now ran name-only businesses, no offices, no staff. He has businesses across states, run profitably, generating employment, without owing banks a dime.",
    "He has never sacked a staff member on account of bad times, not even now, when most companies are complaining.",
    "In business he deals faithfully and honestly: contracts kept going for over twenty years, and loyal customers of twenty-four.",
  ] as string[],
  character:
    "Quiet but resilient. Tough natured, yet good mannered and compassionate. A firm believer in equity who cannot take part in cheating anybody, and a man with no personal hunger pushing him into politics for what he can take out of it.",
  quote:
    "Yes, you have brilliant ideas but can you do it? Do you have what it takes? The answer is yes! And yes!",
  education: [
    {
      period: "1992/93",
      school: "Federal University of Technology, Minna",
      credential: "Bachelor's degree, graduated with honours",
    },
    {
      period: "After NYSC",
      school: "University of Portsmouth, United Kingdom",
      credential: "Master of Science",
    },
  ] as EducationEntry[],
  tieUps: {
    lead: "He has led delegations from UK universities into tie-up agreements with Nigerian universities:",
    pairs: [
      { uk: "Cranfield University", ng: "University of Ibadan" },
      { uk: "Durham University", ng: "Covenant University" },
      { uk: "University of Portsmouth", ng: "Federal University of Technology, Minna" },
    ],
  } as { lead: string; pairs: { uk: string; ng: string }[] },
};

export async function getAboutContent() {
  return getSiteContent("about", aboutContentDefault);
}
