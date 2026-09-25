import { cn } from "@/lib/cn";

/**
 * Illustrated placeholder shown when a dish has no photo yet. Deterministic
 * (same dish → same artwork) and lightweight (inline SVG, no network).
 * Replace with real photography by uploading an image in Partner → Menu.
 */

type Kind = "plate" | "seafood" | "drink" | "cocktail" | "dessert" | "patty" | "bowl" | "breakfast";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function dishKind(name: string, category = ""): Kind {
  const n = `${name} ${category}`.toLowerCase();
  if (/cocktail|martini|mojito|sangria|rum punch|guinness/.test(n)) return "cocktail";
  if (/drink|juice|sorrel(?! sangria)|coffee|coconut water|ginger beer|soft drink|punch|beetroot|bag juice|ting/.test(n)) return "drink";
  if (/dessert|cake|pudding|drops|sundae/.test(n)) return "dessert";
  if (/patty|patties|coco bread|bulla|bakery/.test(n)) return "patty";
  if (/ackee|callaloo|rundown|breakfast/.test(n)) return "breakfast";
  if (/fish|snapper|shrimp|lobster|seafood|crab/.test(n)) return "seafood";
  if (/side|rice|festival|plantain|bammy|vegetable|breadfruit|mac|stew\b|ital|wrap|bowl|pasta/.test(n)) return "bowl";
  return "plate";
}

const BACKGROUNDS = [
  ["#f3d9b8", "#e7b98a"],
  ["#f1d3c4", "#e3a88c"],
  ["#e7dcc1", "#cdb98a"],
  ["#dfe6d3", "#b7c7a0"],
  ["#f4e2c6", "#e9c68f"],
  ["#ecd5cb", "#d6a797"],
];
const DRINKS: Record<string, string> = {
  sorrel: "#8e1b2d",
  carrot: "#e8752a",
  ginger: "#e2b861",
  coffee: "#3b2416",
  coconut: "#f3efe4",
  beetroot: "#7a1633",
  soursop: "#f1ead8",
  punch: "#d9433a",
  ting: "#e9e2a4",
  default: "#d9433a",
};

export function DishArt({ name, category, className, rounded = true }: { name: string; category?: string; className?: string; rounded?: boolean }) {
  const h = hash(name);
  const kind = dishKind(name, category);
  const [bg1, bg2] = BACKGROUNDS[h % BACKGROUNDS.length];
  const rot = (h % 50) - 25;
  const id = `d${h.toString(36)}`;

  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("block h-full w-full", rounded && "rounded-[inherit]", className)}
      role="img"
      aria-label={`Illustration of ${name}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg1} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
        <radialGradient id={`${id}plate`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#efe6d6" />
        </radialGradient>
        <filter id={`${id}sh`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#3b2416" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}bg)`} />
      {/* table texture */}
      <g opacity="0.12" stroke="#6b3a1f" strokeWidth="1.5">
        {[40, 95, 150, 205, 260].map((y) => (
          <path key={y} d={`M0 ${y} Q 200 ${y + ((h >> 3) % 14) - 7} 400 ${y}`} fill="none" />
        ))}
      </g>
      {kind === "drink" && <Drink name={name} h={h} id={id} />}
      {kind === "cocktail" && <Cocktail name={name} h={h} id={id} />}
      {kind === "dessert" && <Dessert h={h} id={id} />}
      {kind === "patty" && <Patty h={h} id={id} />}
      {(kind === "plate" || kind === "seafood" || kind === "bowl" || kind === "breakfast") && (
        <g filter={`url(#${id}sh)`}>
          <ellipse cx="200" cy="158" rx="128" ry="112" fill={`url(#${id}plate)`} />
          <ellipse cx="200" cy="158" rx="104" ry="90" fill="none" stroke="#e2d6c2" strokeWidth="2" />
          <g transform={`rotate(${rot} 200 158)`}>
            {kind === "plate" && <Protein h={h} />}
            {kind === "seafood" && <Fish h={h} />}
            {kind === "bowl" && <Side h={h} name={name} />}
            {kind === "breakfast" && <Breakfast h={h} />}
          </g>
        </g>
      )}
    </svg>
  );
}

function Leaves({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C 10 -14, 26 -12, 30 0 C 20 6, 8 6, 0 0 Z" fill="#3a7a5a" />
      <path d="M4 4 C 0 -12, 12 -24, 24 -20 C 22 -8, 14 0, 4 4 Z" fill="#4f9470" />
      <path d="M2 2 L 26 -2" stroke="#244c39" strokeWidth="1.2" />
    </g>
  );
}

function RiceAndPeas({ x, y }: { x: number; y: number }) {
  const dots = [
    [-22, -6], [-8, -14], [8, -8], [20, 2], [-14, 8], [2, 12], [16, 16], [-26, 12], [28, -10], [-2, -2],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx="46" ry="34" fill="#f1e6cf" />
      <ellipse cx="-6" cy="-6" rx="36" ry="24" fill="#f7eedc" />
      {dots.map(([dx, dy], i) => (
        <ellipse key={i} cx={dx} cy={dy} rx="4.5" ry="3.5" fill="#7a2b24" />
      ))}
    </g>
  );
}

function Protein({ h }: { h: number }) {
  const browns = ["#6e3517", "#7c3d1b", "#5b2a12"];
  const c = browns[h % browns.length];
  return (
    <g>
      <RiceAndPeas x={148} y={176} />
      <path d="M190 120 C 220 92, 282 100, 290 138 C 298 176, 256 204, 222 196 C 190 190, 168 150, 190 120 Z" fill={c} />
      <path d="M204 128 C 228 110, 268 116, 274 142" stroke="#3b1c0c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M214 160 C 236 150, 262 156, 270 170" stroke="#3b1c0c" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M200 132 C 214 120, 236 116, 250 120" stroke="#d9923f" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
      <ellipse cx="236" cy="222" rx="30" ry="12" fill="#e0a13a" transform="rotate(-12 236 222)" />
      <ellipse cx="262" cy="206" rx="26" ry="10" fill="#e8b04c" transform="rotate(-22 262 206)" />
      <Leaves x={150} y={122} s={1.1} />
      <circle cx="286" cy="120" r="7" fill="#dc5a2e" />
    </g>
  );
}

function Fish({ h }: { h: number }) {
  return (
    <g>
      <path d="M110 160 C 150 110, 250 108, 286 158 C 250 206, 150 208, 110 160 Z" fill={h % 2 ? "#c9542b" : "#b8472a"} />
      <path d="M286 158 L 326 128 L 318 160 L 326 190 Z" fill="#a33d22" />
      <circle cx="136" cy="152" r="6" fill="#fff5e6" />
      <circle cx="136" cy="152" r="3" fill="#1a1310" />
      {[170, 200, 230, 256].map((x) => (
        <path key={x} d={`M${x} 124 Q ${x + 10} 160 ${x} 196`} stroke="#8e3219" strokeWidth="3" fill="none" opacity="0.6" />
      ))}
      <path d="M150 150 L 270 142" stroke="#f2c14e" strokeWidth="5" strokeLinecap="round" />
      <path d="M156 166 L 262 172" stroke="#e8752a" strokeWidth="5" strokeLinecap="round" />
      <path d="M170 158 L 250 156" stroke="#f7eedc" strokeWidth="4" strokeLinecap="round" />
      <Leaves x={210} y={214} s={0.9} />
      <circle cx="120" cy="214" r="16" fill="#e6c77a" />
      <circle cx="120" cy="214" r="10" fill="#d4b062" />
    </g>
  );
}

function Side({ h, name }: { h: number; name: string }) {
  const n = name.toLowerCase();
  if (/plantain/.test(n)) {
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={150 + i * 26} cy={150 + (i % 2) * 18} rx="30" ry="14" fill={i % 2 ? "#c9701f" : "#dc8a2a"} transform={`rotate(${-20 + i * 8} ${150 + i * 26} ${150 + (i % 2) * 18})`} />
        ))}
      </g>
    );
  }
  if (/festival|bammy|breadfruit/.test(n)) {
    return (
      <g>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={170 + i * 30} cy={146 + i * 14} rx="44" ry="17" fill={i % 2 ? "#e0a13a" : "#d18f2c"} transform={`rotate(-18 ${170 + i * 30} ${146 + i * 14})`} />
        ))}
      </g>
    );
  }
  if (/vegetable|callaloo|wrap|ital|bowl/.test(n)) {
    return (
      <g>
        <ellipse cx="200" cy="158" rx="70" ry="52" fill="#3a7a5a" />
        {[[-30, -10], [10, -20], [30, 10], [-10, 18], [0, 0]].map(([x, y], i) => (
          <circle key={i} cx={200 + x} cy={158 + y} r="11" fill={i % 2 ? "#e8752a" : "#5c9a74"} />
        ))}
        <Leaves x={170} y={130} />
      </g>
    );
  }
  if (/pasta|mac/.test(n)) {
    return (
      <g>
        <ellipse cx="200" cy="158" rx="72" ry="54" fill="#f0c56b" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={150 + (i % 4) * 26} y={126 + Math.floor(i / 4) * 24} width="22" height="9" rx="4" fill="#e39d3a" transform={`rotate(${(h + i * 37) % 60 - 30} ${160 + (i % 4) * 26} ${130 + Math.floor(i / 4) * 24})`} />
        ))}
        <circle cx="176" cy="150" r="7" fill="#dc5a2e" />
        <circle cx="226" cy="170" r="7" fill="#3a7a5a" />
      </g>
    );
  }
  return (
    <g>
      <RiceAndPeas x={200} y={158} />
      <Leaves x={226} y={128} s={0.8} />
    </g>
  );
}

function Breakfast({ h }: { h: number }) {
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => (
        <ellipse key={i} cx={170 + (i % 3) * 22} cy={130 + Math.floor(i / 3) * 20} rx="14" ry="10" fill={i % 2 ? "#f6d54a" : "#f2c93a"} />
      ))}
      <path d="M160 170 Q 190 184 226 170" stroke="#dc5a2e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M170 116 Q 200 106 226 118" stroke="#3a7a5a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="262" cy="176" r="20" fill="#d9a441" />
      <circle cx="248" cy="206" r="18" fill="#cf9a3f" />
      <ellipse cx="144" cy="196" rx="28" ry="10" fill="#e8dcae" transform={`rotate(${(h % 30) - 15} 144 196)`} />
    </g>
  );
}

function Drink({ name, h, id }: { name: string; h: number; id: string }) {
  const key = Object.keys(DRINKS).find((k) => name.toLowerCase().includes(k)) ?? "default";
  const color = DRINKS[key];
  const coffee = key === "coffee";
  return (
    <g filter={`url(#${id}sh)`}>
      {coffee ? (
        <g>
          <ellipse cx="200" cy="232" rx="96" ry="22" fill="#fffdf8" />
          <path d="M140 120 L 260 120 L 250 220 Q 200 236 150 220 Z" fill="#fffdf8" />
          <ellipse cx="200" cy="122" rx="60" ry="14" fill={color} />
          <path d="M260 140 C 300 140, 300 190, 254 196" stroke="#fffdf8" strokeWidth="12" fill="none" />
          <path d="M184 96 C 176 80, 196 72, 188 56 M214 98 C 206 82, 226 74, 218 58" stroke="#fffdf8" strokeWidth="4" fill="none" opacity="0.7" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M150 70 L 250 70 L 238 250 Q 200 260 162 250 Z" fill="#ffffff" opacity="0.55" />
          <path d="M156 110 L 244 110 L 236 246 Q 200 256 164 246 Z" fill={color} />
          <rect x="170" y="120" width="26" height="24" rx="5" fill="#ffffff" opacity="0.45" transform="rotate(-12 183 132)" />
          <rect x="204" y="132" width="24" height="22" rx="5" fill="#ffffff" opacity="0.35" transform="rotate(14 216 143)" />
          <path d="M226 40 L 214 180" stroke={h % 2 ? "#dc5a2e" : "#3a7a5a"} strokeWidth="8" strokeLinecap="round" />
          <path d="M150 70 L 250 70" stroke="#ffffff" strokeWidth="4" opacity="0.8" />
        </g>
      )}
    </g>
  );
}

function Cocktail({ h, id }: { name: string; h: number; id: string }) {
  const colors = ["#e0532f", "#c8243f", "#e8a33a", "#8e1b2d", "#3b2416"];
  const c = colors[h % colors.length];
  return (
    <g filter={`url(#${id}sh)`}>
      <path d="M120 80 L 280 80 L 206 170 L 194 170 Z" fill="#ffffff" opacity="0.55" />
      <path d="M136 92 L 264 92 L 204 162 L 196 162 Z" fill={c} />
      <rect x="196" y="168" width="8" height="70" fill="#ffffff" opacity="0.7" />
      <ellipse cx="200" cy="244" rx="44" ry="9" fill="#ffffff" opacity="0.7" />
      <circle cx="262" cy="84" r="22" fill="#9bc53d" />
      <circle cx="262" cy="84" r="16" fill="#c8e07a" />
      {[0, 60, 120].map((a) => (
        <path key={a} d="M262 68 L 262 100" stroke="#9bc53d" strokeWidth="2" transform={`rotate(${a} 262 84)`} />
      ))}
      <path d="M150 88 L 250 88" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
    </g>
  );
}

function Dessert({ h, id }: { h: number; id: string }) {
  return (
    <g filter={`url(#${id}sh)`}>
      <ellipse cx="200" cy="200" rx="130" ry="40" fill="#fffdf8" />
      <path d="M120 190 L 280 190 L 280 150 L 150 110 Z" fill={h % 2 ? "#5b2a12" : "#7a3d1b"} />
      <path d="M120 190 L 280 190 L 280 176 L 120 176 Z" fill="#3b1c0c" opacity="0.4" />
      <path d="M150 110 L 280 150" stroke="#e0b25f" strokeWidth="8" strokeLinecap="round" />
      <circle cx="248" cy="120" r="12" fill="#c8243f" />
      <path d="M248 108 Q 252 96 262 94" stroke="#3a7a5a" strokeWidth="3" fill="none" />
    </g>
  );
}

function Patty({ h, id }: { h: number; id: string }) {
  return (
    <g filter={`url(#${id}sh)`}>
      <path d="M110 200 A 90 90 0 0 1 290 200 Z" fill={h % 2 ? "#e6a92f" : "#eab43d"} />
      <path d="M110 200 L 290 200" stroke="#c98a1f" strokeWidth="10" strokeLinecap="round" />
      {Array.from({ length: 11 }).map((_, i) => (
        <path key={i} d={`M${120 + i * 16} 196 l 6 10`} stroke="#b57a18" strokeWidth="3" strokeLinecap="round" />
      ))}
      <path d="M150 150 Q 200 120 250 150" stroke="#f6d27a" strokeWidth="6" fill="none" opacity="0.6" strokeLinecap="round" />
    </g>
  );
}
