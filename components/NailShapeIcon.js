// Nail-shape pictures for the booking form: a fingertip with a glossy
// polished nail, so clients can see exactly how each shape looks on a finger.

const NAILS = {
  Oval:
    "M20 92 V46 C20 22 30 11 40 11 C50 11 60 22 60 46 V92 Q40 101 20 92 Z",
  Square:
    "M20 92 V15 Q20 13 22 13 H58 Q60 13 60 15 V92 Q40 101 20 92 Z",
  Squoval:
    "M20 92 V30 Q20 13 35 13 H45 Q60 13 60 30 V92 Q40 101 20 92 Z",
  Almond:
    "M20 92 V56 C20 38 31 22 36 16 Q40 11 44 16 C49 22 60 38 60 56 V92 Q40 101 20 92 Z",
  Coffin:
    "M20 92 V62 L31 18 Q32 15 35 15 H45 Q48 15 49 18 L60 62 V92 Q40 101 20 92 Z",
  Stiletto:
    "M20 92 V66 C20 46 33 24 40 3 C47 24 60 46 60 66 V92 Q40 101 20 92 Z",
};

export default function NailShapeIcon({ shape, selected, height }) {
  const d = NAILS[shape] || NAILS.Oval;
  const key = String(shape).toLowerCase();
  const h = height || 72;

  return (
    <svg
      viewBox="0 0 80 140"
      height={h}
      width={(h * 80) / 140}
      aria-hidden="true"
      className="mx-auto block"
    >
      <defs>
        <linearGradient id={"skin-" + key} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c98a63" />
          <stop offset="50%" stopColor="#e0a982" />
          <stop offset="100%" stopColor="#b97a55" />
        </linearGradient>
        <linearGradient id={"polish-" + key} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={selected ? "#a0303f" : "#8b2635"} />
          <stop offset="100%" stopColor="#4a0f18" />
        </linearGradient>
      </defs>

      {/* fingertip */}
      <path
        d="M12 140 V62 C12 42 24 32 40 32 C56 32 68 42 68 62 V140 Z"
        fill={"url(#skin-" + key + ")"}
      />
      <path d="M26 118 H54 M28 126 H52" stroke="#a8683f" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />

      {/* polished nail */}
      <path
        d={d}
        fill={"url(#polish-" + key + ")"}
        stroke={selected ? "#f0d58f" : "#2a080e"}
        strokeWidth={selected ? 2 : 1.2}
        strokeLinejoin="round"
      />
      {/* gloss */}
      <path
        d="M29 86 V50"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M36 90 V80"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
