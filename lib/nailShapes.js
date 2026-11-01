// Nail outlines for the try-on. Coordinates match the booking shape pictures:
// the nail base is at y = 96 and the nail is 40 wide, centred on x = 40.

export const NAIL_BASE_Y = 96;

export const TRY_SHAPES = [
  {
    name: "Almond",
    tipY: 9,
    lenFactor: 1.12,
    d: "M20 92 V56 C20 36 31 20 36 14 Q40 9 44 14 C49 20 60 36 60 56 V92 Q40 101 20 92 Z",
  },
  {
    name: "Coffin",
    tipY: 15,
    lenFactor: 1.12,
    d: "M20 92 V62 L31 18 Q32 15 35 15 H45 Q48 15 49 18 L60 62 V92 Q40 101 20 92 Z",
  },
  {
    name: "Stiletto",
    tipY: 3,
    lenFactor: 1.3,
    d: "M20 92 V66 C20 46 33 24 40 3 C47 24 60 46 60 66 V92 Q40 101 20 92 Z",
  },
  {
    name: "Square",
    tipY: 13,
    lenFactor: 1.0,
    d: "M20 92 V15 Q20 13 22 13 H58 Q60 13 60 15 V92 Q40 101 20 92 Z",
  },
  {
    name: "Squoval",
    tipY: 13,
    lenFactor: 1.0,
    d: "M20 92 V30 Q20 13 35 13 H45 Q60 13 60 30 V92 Q40 101 20 92 Z",
  },
  {
    name: "Oval",
    tipY: 11,
    lenFactor: 1.0,
    d: "M20 92 V46 C20 22 30 11 40 11 C50 11 60 22 60 46 V92 Q40 101 20 92 Z",
  },
];

export const TRY_FINISHES = ["Gloss", "Matte", "Chrome", "Glitter", "Shimmer"];
