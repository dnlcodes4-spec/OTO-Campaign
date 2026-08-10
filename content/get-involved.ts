export type Ask = {
  number: string;
  title: string;
  detail: string;
};

export type VoteTarget = {
  figure: string;
  label: string;
};

export type TurnoutStat = {
  figure: string;
  label: string;
};

export const getInvolvedContent = {
  turnoutStats: [
    {
      figure: "4,000,000",
      label: "registered voters in Oyo State, more or less.",
    },
    {
      figure: "1 in 4",
      label: "is all that consistently shows up.",
    },
  ] as TurnoutStat[],
  turnoutBody:
    "Three million people sit out every cycle: no confidence in the process, no appetite for a vote-buying charade, no faith it is worth their time. Under BVAS, INEC's Bimodal Voter Accreditation System, the brazen rigging is finished. Nobody thumbprints from a hotel room anymore, and every figure collated must tally with the count posted at the polling unit. This time the campaign will have adequate hands at the units to help guard the result, and even a wrong announcement is a lot easier to overturn at the tribunal. If citizens do their part at the polls, it never gets that far.",
  image: {
    src: "/images/oto-suit-1.png",
    alt: "OTO in a grey suit, facing the voters he is asking to show up",
  },
  asks: [
    {
      number: "1",
      title: "Make up your mind",
      detail:
        "Vote for the Zenith Labour Party across the board in the 2027 election, and for OTO as your senator.",
    },
    {
      number: "2",
      title: "Talk to ten",
      detail:
        "Start talking to others about this opportunity to right past wrongs, and get everyone you convince to talk to at least ten more people each.",
    },
    {
      number: "3",
      title: "Volunteer on the trail",
      detail:
        "Volunteer to help out during the campaign and at the polling units on election day. We need a sea of volunteers.",
    },
    {
      number: "4",
      title: "Be financially committed",
      detail:
        "A campaign that answers to its people must be funded by its people. This one runs the Atunluto way, on the commitment of its own members and not the purse of a godfather. Every contribution, however small, keeps the message moving through all nine LGAs of Oyo South.",
    },
    {
      number: "5",
      title: "Commit to the count",
      detail: "Help raise the votes that send this agenda to Abuja.",
    },
  ] as Ask[],
  targetsLead: "The commitment this campaign asks of the district, counted out loud:",
  targets: [
    {
      figure: "1,000,000",
      label: "votes for the Zenith Labour Party at the Oyo South Senatorial District.",
    },
  ] as VoteTarget[],
  targetsSupport:
    "No matter how bad it gets, from this target there is enough to win it.",
  epigraph:
    "…and when they heard of it, it grieved them exceedingly that there was come a man to seek the welfare of the children of Oyo South Senatorial District",
};
