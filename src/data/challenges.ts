// ---- palette ---------------------------------------------------------------
export const C = {
  bg: "#10130F",
  surface: "#1A1F18",
  surface2: "#222822",
  line: "rgba(255,255,255,0.08)",
  line2: "rgba(255,255,255,0.16)",
  text: "#ECEFE9",
  mute: "#B2B1A7",
  green: "#00AB61",
  teal: "#009A9B",
  amber: "#E8A33D",
  red: "#E5564E",
};

export const CAT: Record<string, string> = {
  "Warm-up": "#B2B1A7",
  Strike: "#00AB61",
  "Low point": "#009A9B",
  Tempo: "#E8A33D",
  Shaping: "#C9A227",
  Routine: "#6FC2B0",
  Pressure: "#E5564E",
  Speed: "#D98032",
};

export const KIT_LABEL: Record<string, string> = {
  spray: "Impact spray",
  tape: "Impact tape",
  towel: "Towel",
  tee: "Tee",
  stick: "Alignment stick",
};

export type ChallengeMode = "streak" | "count" | "rate" | "reps";

export interface Challenge {
  id: string;
  name: string;
  cat: keyof typeof CAT;
  kit: string[];
  mode: ChallengeMode;
  target?: number;
  do: string;
  feel: string;
  helps: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "wakeup",
    name: "Wake-up ladder",
    cat: "Warm-up",
    kit: [],
    mode: "reps",
    target: 15,
    do: "Five half swings, five three-quarter, five full — build speed gradually. No full belts cold.",
    feel: "You're loose and the strike feels solid before the session proper starts.",
    helps: "Stops the first ten balls being a warm-up and protects your back.",
  },
  {
    id: "purefive",
    name: "Pure five",
    cat: "Strike",
    kit: ["spray"],
    mode: "streak",
    target: 5,
    do: "Hit until you string five in a row you'd honestly call centre-struck. Miss one, back to zero.",
    feel: "Spray dots cluster in the middle; the strike feels and sounds flush.",
    helps: "Centredness under self-imposed pressure — the only honest strike test into a net.",
  },
  {
    id: "spray",
    name: "Spray spotter",
    cat: "Strike",
    kit: ["spray"],
    mode: "count",
    target: 10,
    do: "Spray the face. Hit ten, read the mark each time. Goal: eight of ten in the centre third.",
    feel: "You can name where each one came off before you look.",
    helps: "Builds the feedback loop you can't get from ball flight in a net.",
  },
  {
    id: "toeheel",
    name: "Toe-heel ladder",
    cat: "Strike",
    kit: ["spray"],
    mode: "count",
    target: 9,
    do: "On demand: three off the toe, three off the heel, three dead centre. Prove you can place it.",
    feel: "You're moving the strike where you choose, not where the swing dumps it.",
    helps: "Face awareness — you can't fix a miss you can't feel.",
  },
  {
    id: "towel",
    name: "Towel behind",
    cat: "Low point",
    kit: ["towel"],
    mode: "count",
    target: 10,
    do: "Lay a folded towel a hand's width behind the ball. Ten shots, ball-first, never clip the towel.",
    feel: "Contact is crisp and forward of the ball position.",
    helps: "Forward low point — the fat-shot killer.",
  },
  {
    id: "line",
    name: "Line in the mat",
    cat: "Low point",
    kit: ["spray"],
    mode: "streak",
    target: 8,
    do: "Spray a line across the mat at the ball. Brush mark must start on or ahead of the line, never behind.",
    feel: "The mat brushes after the ball, every time.",
    helps: "Trains ball-then-turf without needing a divot.",
  },
  {
    id: "teeclip",
    name: "Tee clip",
    cat: "Low point",
    kit: ["tee"],
    mode: "count",
    target: 10,
    do: "Push a broken tee into the mat a few inches in front of the ball. Clip the tee on the way through.",
    feel: "Low point is past the ball; you nick the tee cleanly.",
    helps: "Reinforces hitting down and through, not scooping.",
  },
  {
    id: "count31",
    name: "Three-one count",
    cat: "Tempo",
    kit: [],
    mode: "rate",
    do: "Count 'one-two-three' back, 'one' down — same count on all ten swings. Speed up nothing.",
    feel: "Same rhythm whether it's a wedge or a driver.",
    helps: "A repeatable tempo travels to the course; a fast one doesn't.",
  },
  {
    id: "slowmo",
    name: "Half to full",
    cat: "Tempo",
    kit: [],
    mode: "rate",
    do: "Three swings at 50%, three at 75%, three at 100% — holding the exact same rhythm throughout.",
    feel: "Effort changes, rhythm doesn't.",
    helps: "Separates effort from tempo so adding speed doesn't wreck timing.",
  },
  {
    id: "gate",
    name: "Start-line gate",
    cat: "Shaping",
    kit: ["stick"],
    mode: "count",
    target: 10,
    do: "Set two tees or a stick as a narrow gate a foot in front of the ball. Start every ball through it.",
    feel: "The ball launches dead through the gate before the net swallows it.",
    helps: "Start direction is the one flight cue a net can actually give you.",
  },
  {
    id: "feelshape",
    name: "Feel the shape",
    cat: "Shaping",
    kit: [],
    mode: "count",
    target: 8,
    do: "Alternate a draw setup and a fade setup. Swing, then grade whether the feel matched the intent.",
    feel: "Setup and release feel different on purpose for each shape.",
    helps: "Rehearses shot-shaping intent you'll commit to under pressure.",
  },
  {
    id: "effort",
    name: "Effort reps",
    cat: "Speed",
    kit: ["spray"],
    mode: "count",
    target: 6,
    do: "Six swings chasing the fastest speed you can still find the centre with. Spray checks honesty.",
    feel: "Fast, but the dot's still in the middle.",
    helps: "Builds speed without trading away the strike.",
  },
  {
    id: "routine",
    name: "Full routine, every ball",
    cat: "Routine",
    kit: [],
    mode: "count",
    target: 10,
    do: "Complete your entire pre-shot routine on all ten. No raking a second ball over, no rushing.",
    feel: "Every shot gets the same deliberate process a course shot would.",
    helps: "This is what actually transfers from net to first tee.",
  },
  {
    id: "oneball",
    name: "One-ball pressure",
    cat: "Pressure",
    kit: [],
    mode: "streak",
    target: 6,
    do: "Pick a shot that matters. Full routine, one swing, honest self-grade. Fresh setup each time.",
    feel: "Same nerves you'd feel needing a fairway at the 18th.",
    helps: "Rehearses commitment when there's no second go.",
  },
  {
    id: "switch",
    name: "Random club switch",
    cat: "Pressure",
    kit: [],
    mode: "rate",
    do: "Never the same club twice running. Full routine each time, twelve shots, no grooving.",
    feel: "Every shot is a cold first attempt, like on the course.",
    helps: "Kills the false confidence of block-hitting the same club.",
  },
];

// ---- session config --------------------------------------------------------
export const FOCUS: Record<string, string[] | null> = {
  Mixed: null,
  Strike: ["Strike", "Speed"],
  "Low point": ["Low point"],
  Tempo: ["Tempo"],
  Shaping: ["Shaping"],
  "Routine & pressure": ["Routine", "Pressure"],
};

export const SESSION_SHAPE: Record<number, { warm: number; tech: number; fin: number }> = {
  5:  { warm: 0, tech: 1, fin: 1 },
  10: { warm: 1, tech: 1, fin: 1 },
  20: { warm: 1, tech: 2, fin: 1 },
  30: { warm: 1, tech: 3, fin: 1 },
};
