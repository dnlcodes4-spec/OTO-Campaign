export type EducationEntry = {
  period: string;
  school: string;
  credential: string;
};

export const aboutContent = {
  nameParts: ["Oluwasegun", "Theophilus", "Oladimeji"],
  nameNote: "Three names. Their first letters are what Oyo South calls him: OTO.",
  party: "Zenith Labour Party",
  district: "Oyo South Senatorial District",
  abujaAnswer: "OTO is very hardworking.",
  abujaSupport:
    "So often we send people to Abuja whose sole interest is the perks of office, people with no idea why they are heading to the red chambers. The person who represents us well must be hardworking.",
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
};
