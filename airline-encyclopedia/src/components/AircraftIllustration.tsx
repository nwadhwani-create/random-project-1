"use client";

interface Props {
  model: string;
  manufacturer: string;
  airlineColor: string;
  airlineName?: string;
}

type AircraftCategory =
  | "super-jumbo"
  | "jumbo"
  | "widebody-large"
  | "widebody"
  | "narrowbody"
  | "regional"
  | "cargo";

function getCategory(model: string): AircraftCategory {
  if (/A380/i.test(model)) return "super-jumbo";
  if (/B747|747/i.test(model)) return "jumbo";
  if (/B777-F/i.test(model)) return "cargo";
  if (/B777|777/i.test(model)) return "widebody-large";
  if (/B787|787|A350|A330|A340|B767|767/i.test(model)) return "widebody";
  if (/A220/i.test(model)) return "regional";
  if (/E170|E175|E190|E195|ERJ|CRJ/i.test(model)) return "regional";
  return "narrowbody";
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 30, g: 58, b: 95 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function SuperJumboSilhouette() {
  return (
    <g transform="translate(120, 140) scale(1.1)">
      {/* Fuselage - double deck */}
      <path
        d="M50,180 C50,170 60,155 90,152 L420,148 C440,148 460,155 470,165 L475,175 C475,185 470,195 450,198 L90,200 C60,200 50,192 50,180Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Upper deck windows */}
      {Array.from({ length: 22 }, (_, i) => (
        <rect
          key={`u${i}`}
          x={100 + i * 16}
          y={156}
          width={8}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Lower deck windows */}
      {Array.from({ length: 26 }, (_, i) => (
        <rect
          key={`l${i}`}
          x={90 + i * 14}
          y={166}
          width={7}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Cockpit windows */}
      <path
        d="M460,160 L472,168 L465,170 L455,164Z"
        fill="rgba(135,206,235,0.8)"
      />
      {/* Wing */}
      <path
        d="M200,190 L100,260 L120,262 L320,200Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M65,185 L30,220 L45,222 L100,195Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Vertical tail */}
      <path
        d="M70,180 L55,120 L65,118 L90,152Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (4) */}
      {[145, 195, 280, 330].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i < 2 ? 248 : 208}
          rx={16}
          ry={8}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function JumboSilhouette() {
  return (
    <g transform="translate(120, 150) scale(1.1)">
      {/* Fuselage */}
      <path
        d="M50,170 C50,162 58,152 85,150 L420,148 C445,148 458,155 462,162 L465,170 C465,180 460,188 440,190 L85,192 C58,192 50,182 50,170Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Upper deck hump (747 distinctive) */}
      <path
        d="M320,148 C340,138 380,132 420,134 L455,140 C462,145 462,148 460,150 L320,148Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Windows */}
      {Array.from({ length: 28 }, (_, i) => (
        <rect
          key={`w${i}`}
          x={90 + i * 13}
          y={160}
          width={7}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Upper deck windows */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={`uw${i}`}
          x={340 + i * 14}
          y={141}
          width={7}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Wing */}
      <path
        d="M180,185 L80,250 L105,252 L300,195Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Tail */}
      <path
        d="M65,168 L48,110 L60,108 L88,150Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M60,175 L25,210 L42,212 L95,185Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (4) */}
      {[130, 175, 260, 310].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i < 2 ? 238 : 202}
          rx={15}
          ry={7}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function WidebodyLargeSilhouette() {
  return (
    <g transform="translate(130, 155) scale(1.1)">
      {/* Fuselage */}
      <path
        d="M50,165 C50,157 60,148 85,146 L410,144 C435,144 450,150 455,158 L458,165 C458,174 452,182 435,184 L85,186 C60,186 50,176 50,165Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Windows */}
      {Array.from({ length: 26 }, (_, i) => (
        <rect
          key={`w${i}`}
          x={90 + i * 13}
          y={155}
          width={7}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Cockpit */}
      <path
        d="M448,155 L458,162 L452,164 L442,158Z"
        fill="rgba(135,206,235,0.8)"
      />
      {/* Wing */}
      <path
        d="M190,180 L95,240 L118,242 L310,190Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Tail */}
      <path
        d="M65,162 L50,108 L62,106 L85,146Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M58,170 L28,200 L44,202 L90,180Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (2 large) */}
      {[160, 280].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i === 0 ? 230 : 198}
          rx={18}
          ry={9}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function WidebodySilhouette() {
  return (
    <g transform="translate(140, 158) scale(1.05)">
      {/* Fuselage */}
      <path
        d="M55,165 C55,158 63,150 85,148 L400,146 C420,146 435,152 440,158 L443,165 C443,173 438,180 420,182 L85,184 C63,184 55,175 55,165Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Windows */}
      {Array.from({ length: 24 }, (_, i) => (
        <rect
          key={`w${i}`}
          x={92 + i * 13}
          y={156}
          width={6}
          height={4}
          rx={1.5}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Cockpit */}
      <path
        d="M432,155 L443,162 L437,164 L428,158Z"
        fill="rgba(135,206,235,0.8)"
      />
      {/* Wing - raked wingtips */}
      <path
        d="M185,178 L100,232 L118,234 L108,228 L295,188Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Winglet */}
      <path
        d="M100,232 L94,224 L98,226Z"
        fill="rgba(210,210,215,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.5"
      />
      {/* Tail */}
      <path
        d="M68,162 L55,112 L66,110 L85,148Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M62,170 L35,198 L48,200 L88,178Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (2) */}
      {[155, 268].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i === 0 ? 222 : 196}
          rx={15}
          ry={8}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function NarrowbodySilhouette() {
  return (
    <g transform="translate(155, 165) scale(1.0)">
      {/* Fuselage */}
      <path
        d="M60,160 C60,154 67,147 85,145 L380,143 C398,143 408,148 412,154 L415,160 C415,167 410,174 395,176 L85,178 C67,178 60,170 60,160Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Windows */}
      {Array.from({ length: 22 }, (_, i) => (
        <rect
          key={`w${i}`}
          x={92 + i * 13}
          y={153}
          width={6}
          height={3.5}
          rx={1}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Cockpit */}
      <path
        d="M405,152 L415,158 L410,160 L400,155Z"
        fill="rgba(135,206,235,0.8)"
      />
      {/* Wing */}
      <path
        d="M175,174 L110,220 L128,222 L280,182Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Winglet */}
      <path
        d="M110,220 L106,212 L108,215Z"
        fill="rgba(210,210,215,0.9)"
      />
      {/* Tail */}
      <path
        d="M72,158 L60,115 L70,113 L85,145Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M66,164 L42,190 L55,192 L86,172Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (2) */}
      {[155, 252].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i === 0 ? 212 : 190}
          rx={13}
          ry={7}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function RegionalSilhouette() {
  return (
    <g transform="translate(165, 170) scale(0.95)">
      {/* Fuselage - slightly smaller */}
      <path
        d="M65,158 C65,153 70,146 88,144 L365,142 C380,142 390,147 394,153 L396,158 C396,164 392,170 378,172 L88,174 C70,174 65,166 65,158Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Windows */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect
          key={`w${i}`}
          x={95 + i * 13}
          y={151}
          width={6}
          height={3}
          rx={1}
          fill="rgba(135,206,235,0.7)"
        />
      ))}
      {/* Cockpit */}
      <path
        d="M388,150 L396,156 L392,158 L384,153Z"
        fill="rgba(135,206,235,0.8)"
      />
      {/* Wing */}
      <path
        d="M175,170 L115,212 L130,214 L270,178Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Tail */}
      <path
        d="M76,155 L65,116 L74,114 L88,144Z"
        fill="rgba(230,230,235,0.95)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Horizontal stabilizer */}
      <path
        d="M70,162 L50,185 L62,187 L88,168Z"
        fill="rgba(220,220,225,0.9)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* Engines (2, rear-mounted style for A220) */}
      {[155, 245].map((x, i) => (
        <ellipse
          key={`e${i}`}
          cx={x}
          cy={i === 0 ? 206 : 185}
          rx={11}
          ry={6}
          fill="rgba(180,180,190,0.9)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function CargoSilhouette() {
  return (
    <g transform="translate(130, 155) scale(1.1)">
      {/* Fuselage - no windows */}
      <path
        d="M50,165 C50,157 60,148 85,146 L410,144 C435,144 450,150 455,158 L458,165 C458,174 452,182 435,184 L85,186 C60,186 50,176 50,165Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* Cargo door markings */}
      <rect x={120} y={150} width={120} height={24} rx={3} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,4" />
      <rect x={260} y={150} width={100} height={24} rx={3} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,4" />
      {/* Cockpit */}
      <path d="M448,155 L458,162 L452,164 L442,158Z" fill="rgba(135,206,235,0.8)" />
      {/* Cockpit windows only */}
      <rect x={440} y={152} width={6} height={4} rx={1} fill="rgba(135,206,235,0.7)" />
      {/* Wing */}
      <path d="M190,180 L95,240 L118,242 L310,190Z" fill="rgba(220,220,225,0.9)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {/* Tail */}
      <path d="M65,162 L50,108 L62,106 L85,146Z" fill="rgba(230,230,235,0.95)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {/* Horizontal stabilizer */}
      <path d="M58,170 L28,200 L44,202 L90,180Z" fill="rgba(220,220,225,0.9)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {/* Engines (2 large) */}
      {[160, 280].map((x, i) => (
        <ellipse key={`e${i}`} cx={x} cy={i === 0 ? 230 : 198} rx={18} ry={9} fill="rgba(180,180,190,0.9)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      ))}
      {/* CARGO text */}
      <text x={250} y={168} textAnchor="middle" fill="rgba(0,0,0,0.08)" fontSize="14" fontWeight="bold" fontFamily="system-ui">CARGO</text>
    </g>
  );
}

const categoryMap: Record<AircraftCategory, React.FC> = {
  "super-jumbo": SuperJumboSilhouette,
  jumbo: JumboSilhouette,
  "widebody-large": WidebodyLargeSilhouette,
  widebody: WidebodySilhouette,
  narrowbody: NarrowbodySilhouette,
  regional: RegionalSilhouette,
  cargo: CargoSilhouette,
};

export default function AircraftIllustration({
  model,
  manufacturer,
  airlineColor,
}: Props) {
  const category = getCategory(model);
  const Silhouette = categoryMap[category];
  const rgb = hexToRgb(airlineColor);

  const skyGradientId = `sky-${model.replace(/\s+/g, "-")}`;
  const accentGradientId = `accent-${model.replace(/\s+/g, "-")}`;

  return (
    <svg
      viewBox="0 0 800 450"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={skyGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`} />
          <stop offset="40%" stopColor="#dbeafe" />
          <stop offset="70%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id={accentGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={airlineColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={airlineColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect width="800" height="450" fill={`url(#${skyGradientId})`} />
      <rect width="800" height="450" fill={`url(#${accentGradientId})`} />

      {/* Clouds */}
      <g opacity="0.6">
        <ellipse cx="650" cy="80" rx="100" ry="30" fill="white" />
        <ellipse cx="680" cy="75" rx="70" ry="25" fill="white" />
        <ellipse cx="620" cy="85" rx="60" ry="20" fill="white" />
      </g>
      <g opacity="0.4">
        <ellipse cx="180" cy="120" rx="80" ry="22" fill="white" />
        <ellipse cx="210" cy="115" rx="55" ry="18" fill="white" />
        <ellipse cx="150" cy="125" rx="50" ry="16" fill="white" />
      </g>
      <g opacity="0.3">
        <ellipse cx="500" cy="60" rx="60" ry="16" fill="white" />
        <ellipse cx="520" cy="55" rx="40" ry="14" fill="white" />
      </g>

      {/* Aircraft */}
      <Silhouette />

      {/* Airline color stripe on tail */}
      <g>
        <clipPath id={`tail-clip-${model.replace(/\s+/g, "-")}`}>
          {category === "super-jumbo" && (
            <path d="M190,260 L175,188 L185,186 L210,292Z" />
          )}
          {category === "jumbo" && (
            <path d="M185,268 L168,220 L178,218 L208,298Z" />
          )}
          {(category === "widebody-large" || category === "cargo") && (
            <path d="M195,262 L180,218 L192,216 L215,290Z" />
          )}
          {category === "widebody" && (
            <path d="M208,262 L195,222 L206,220 L228,288Z" />
          )}
          {category === "narrowbody" && (
            <path d="M227,258 L215,230 L225,228 L247,278Z" />
          )}
          {category === "regional" && (
            <path d="M232,255 L225,230 L234,228 L248,270Z" />
          )}
        </clipPath>
      </g>

      {/* Model label */}
      <g>
        <rect
          x="20"
          y="395"
          width={Math.max(200, (manufacturer.length + model.length) * 11 + 40)}
          height="40"
          rx="6"
          fill="rgba(255,255,255,0.85)"
          style={{ backdropFilter: "blur(4px)" }}
        />
        <text x="35" y="420" fill={airlineColor} fontSize="16" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">
          {manufacturer} {model}
        </text>
      </g>
    </svg>
  );
}
