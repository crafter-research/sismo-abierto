type FlagId =
  | "mx"
  | "pe"
  | "cl"
  | "us"
  | "jp"
  | "id"
  | "ph"
  | "nz"
  | "fj"
  | "to"
  | "vu"
  | "sb"
  | "tj"
  | "af"
  | "pk"
  | "ir"
  | "cn"
  | "tw"
  | "ni"
  | "sv"
  | "co"
  | "ve"
  | "ec"
  | "pt"
  | "gb"
  | "gt"
  | "cr"
  | "pa"
  | "do"
  | "pr"
  | "ar"
  | "pg"
  | "kr"
  | "in"
  | "tr"
  | "gr"
  | "ru";

/**
 * El texto de origen viene del reel y no es un código de país. Se resuelve por
 * coincidencia explícita: lo que no está en la tabla no recibe bandera, en vez
 * de adivinar una a partir de una subcadena.
 */
const ORIGIN_FLAGS: Array<[RegExp, FlagId, string]> = [
  [
    /méxico|mexico|michoacán|guerrero|chiapas|colima|veracruz|tabasco|puerto madero/i,
    "mx",
    "México",
  ],
  [/perú|peru|pisco|lurín|sechura/i, "pe", "Perú"],
  [/chile|isla de pascua|islas de pascua/i, "cl", "Chile"],
  [/alaska|california|estados unidos/i, "us", "Estados Unidos"],
  [/japón|japon/i, "jp", "Japón"],
  [/indonesia/i, "id", "Indonesia"],
  [/filipinas/i, "ph", "Filipinas"],
  [/nueva zelanda|kermadec/i, "nz", "Nueva Zelanda"],
  [/fiji/i, "fj", "Fiji"],
  [/tonga|neiafu|hihifo/i, "to", "Tonga"],
  [/vanuatu|sola/i, "vu", "Vanuatu"],
  [/salomón|salomon/i, "sb", "Islas Salomón"],
  [/tayikistán|tayikistan/i, "tj", "Tayikistán"],
  [/afganistán|afganistan|hindu kush/i, "af", "Afganistán"],
  [/pakistán|pakistan|barkhan/i, "pk", "Pakistán"],
  [/irán|iran/i, "ir", "Irán"],
  [/xinjiang|china/i, "cn", "China"],
  [/taiwán|taiwan|yilan|new taipei/i, "tw", "Taiwán"],
  [/nicaragua|masaya/i, "ni", "Nicaragua"],
  [/salvador/i, "sv", "El Salvador"],
  [/colombia/i, "co", "Colombia"],
  [/venezuela/i, "ve", "Venezuela"],
  [/ecuador|galápagos|galapagos/i, "ec", "Ecuador"],
  [/azores/i, "pt", "Portugal"],
  [/ascensión|ascension|sandwich/i, "gb", "Reino Unido"],
];

const H = { h1: "0 0 24 16" };

function Flag({ id, title }: { id: FlagId; title: string }) {
  const common = {
    viewBox: H.h1,
    role: "img" as const,
    "aria-label": `Bandera de ${title}`,
    className:
      "h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] border border-black/10",
  };
  switch (id) {
    case "mx":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#006847" d="M0 0h8v16H0z" />
          <path fill="#fff" d="M8 0h8v16H8z" />
          <path fill="#CE1126" d="M16 0h8v16h-8z" />
        </svg>
      );
    case "pe":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#D91023" d="M0 0h8v16H0zM16 0h8v16h-8z" />
          <path fill="#fff" d="M8 0h8v16H8z" />
        </svg>
      );
    case "cl":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v8H0z" />
          <path fill="#D52B1E" d="M0 8h24v8H0z" />
          <path fill="#0039A6" d="M0 0h8v8H0z" />
        </svg>
      );
    case "us":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v16H0z" />
          <path
            fill="#B22234"
            d="M0 0h24v2H0zm0 4h24v2H0zm0 4h24v2H0zm0 4h24v2H0z"
          />
          <path fill="#3C3B6E" d="M0 0h10v8H0z" />
        </svg>
      );
    case "jp":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v16H0z" />
          <circle cx="12" cy="8" r="4.4" fill="#BC002D" />
        </svg>
      );
    case "id":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#CE1126" d="M0 0h24v8H0z" />
          <path fill="#fff" d="M0 8h24v8H0z" />
        </svg>
      );
    case "ph":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#0038A8" d="M0 0h24v8H0z" />
          <path fill="#CE1126" d="M0 8h24v8H0z" />
          <path fill="#fff" d="M0 0l10 8-10 8z" />
        </svg>
      );
    case "nz":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#00247D" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 0h11v7H0z" />
          <path
            fill="#CC142B"
            d="M18 4l.7 2h2l-1.6 1.3.6 2-1.7-1.2-1.7 1.2.6-2L15.3 6h2z"
          />
        </svg>
      );
    case "fj":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#68BFE5" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 0h11v7H0z" />
        </svg>
      );
    case "to":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#C10000" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 0h10v7H0z" />
          <path fill="#C10000" d="M4 1.2h2v4.6H4z" />
          <path fill="#C10000" d="M2.7 2.5h4.6v2H2.7z" />
        </svg>
      );
    case "vu":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#D21034" d="M0 0h24v8H0z" />
          <path fill="#009543" d="M0 8h24v8H0z" />
          <path fill="#000" d="M0 0l10 8-10 8z" />
        </svg>
      );
    case "sb":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#0051BA" d="M0 0h24v16H0z" />
          <path fill="#215B33" d="M0 16h24L0 0z" />
          <path fill="#FCD116" d="M0 16L24 0v1.6L2.4 16z" />
        </svg>
      );
    case "tj":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#CC0000" d="M0 0h24v5.3H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <path fill="#006600" d="M0 10.7h24V16H0z" />
        </svg>
      );
    case "af":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#000" d="M0 0h8v16H0z" />
          <path fill="#BF0000" d="M8 0h8v16H8z" />
          <path fill="#009900" d="M16 0h8v16h-8z" />
        </svg>
      );
    case "pk":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#01411C" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 0h6v16H0z" />
          <circle cx="15" cy="8" r="4" fill="#fff" />
          <circle cx="16.6" cy="6.9" r="4" fill="#01411C" />
        </svg>
      );
    case "ir":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#239F40" d="M0 0h24v5.3H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <path fill="#DA0000" d="M0 10.7h24V16H0z" />
        </svg>
      );
    case "cn":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#DE2910" d="M0 0h24v16H0z" />
          <path
            fill="#FFDE00"
            d="M4 2.4l.9 2.7H8l-2.5 1.7.9 2.7L4 7.8 1.6 9.5l.9-2.7L0 5.1h3.1z"
          />
        </svg>
      );
    case "tw":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FE0000" d="M0 0h24v16H0z" />
          <path fill="#000095" d="M0 0h12v8H0z" />
          <circle cx="6" cy="4" r="2.2" fill="#fff" />
        </svg>
      );
    case "ni":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#0067C6" d="M0 0h24v5.3H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <path fill="#0067C6" d="M0 10.7h24V16H0z" />
        </svg>
      );
    case "sv":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#0F47AF" d="M0 0h24v5.3H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <path fill="#0F47AF" d="M0 10.7h24V16H0z" />
        </svg>
      );
    case "co":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FCD116" d="M0 0h24v8H0z" />
          <path fill="#003893" d="M0 8h24v4H0z" />
          <path fill="#CE1126" d="M0 12h24v4H0z" />
        </svg>
      );
    case "ve":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FFCC00" d="M0 0h24v5.3H0z" />
          <path fill="#00247D" d="M0 5.3h24v5.4H0z" />
          <path fill="#CF142B" d="M0 10.7h24V16H0z" />
        </svg>
      );
    case "ec":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FFDD00" d="M0 0h24v8H0z" />
          <path fill="#034EA2" d="M0 8h24v4H0z" />
          <path fill="#ED1C24" d="M0 12h24v4H0z" />
        </svg>
      );
    case "pt":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FF0000" d="M0 0h24v16H0z" />
          <path fill="#006600" d="M0 0h9.6v16H0z" />
          <circle cx="9.6" cy="8" r="3" fill="#FFFF00" />
        </svg>
      );
    case "gb":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#012169" d="M0 0h24v16H0z" />
          <path stroke="#fff" strokeWidth="3" d="M0 0l24 16M24 0L0 16" />
          <path stroke="#fff" strokeWidth="5" d="M12 0v16M0 8h24" />
          <path stroke="#C8102E" strokeWidth="3" d="M12 0v16M0 8h24" />
        </svg>
      );
    case "gt":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#4997D0" d="M0 0h8v16H0zM16 0h8v16h-8z" />
          <path fill="#fff" d="M8 0h8v16H8z" />
        </svg>
      );
    case "cr":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#002B7F" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 3h24v10H0z" />
          <path fill="#CE1126" d="M0 6h24v4H0z" />
        </svg>
      );
    case "pa":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v16H0z" />
          <path fill="#DA121A" d="M12 0h12v8H12z" />
          <path fill="#072357" d="M0 8h12v8H0z" />
        </svg>
      );
    case "do":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#002D62" d="M0 0h24v16H0z" />
          <path fill="#CE1126" d="M0 8h11v8H0zM13 0h11v8H13z" />
          <path fill="#fff" d="M11 0h2v16h-2zM0 7h24v2H0z" />
        </svg>
      );
    case "pr":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v16H0z" />
          <path
            fill="#ED0000"
            d="M0 0h24v3.2H0zm0 6.4h24v3.2H0zm0 6.4h24V16H0z"
          />
          <path fill="#0050F0" d="M0 0l11 8L0 16z" />
        </svg>
      );
    case "ar":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#74ACDF" d="M0 0h24v16H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <circle cx="12" cy="8" r="1.6" fill="#F6B40E" />
        </svg>
      );
    case "pg":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#CE1126" d="M0 0h24v16H0z" />
          <path fill="#000" d="M0 16V0h24z" />
        </svg>
      );
    case "kr":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v16H0z" />
          <path fill="#CD2E3A" d="M12 4.8a3.2 3.2 0 010 6.4z" />
          <path fill="#0047A0" d="M12 4.8a3.2 3.2 0 000 6.4z" />
        </svg>
      );
    case "in":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#FF9933" d="M0 0h24v5.3H0z" />
          <path fill="#fff" d="M0 5.3h24v5.4H0z" />
          <path fill="#138808" d="M0 10.7h24V16H0z" />
          <circle
            cx="12"
            cy="8"
            r="1.6"
            fill="none"
            stroke="#000080"
            strokeWidth="0.6"
          />
        </svg>
      );
    case "tr":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#E30A17" d="M0 0h24v16H0z" />
          <circle cx="9" cy="8" r="3.2" fill="#fff" />
          <circle cx="10.2" cy="8" r="2.6" fill="#E30A17" />
        </svg>
      );
    case "gr":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#0D5EAF" d="M0 0h24v16H0z" />
          <path
            fill="#fff"
            d="M0 1.8h24v1.8H0zm0 3.6h24v1.8H0zm0 3.6h24v1.8H0zm0 3.6h24v1.8H0z"
          />
          <path fill="#0D5EAF" d="M0 0h9v9H0z" />
          <path fill="#fff" d="M3.6 0h1.8v9H3.6zM0 3.6h9v1.8H0z" />
        </svg>
      );
    case "ru":
      return (
        <svg {...common}>
          <title>{`Bandera de ${title}`}</title>
          <path fill="#fff" d="M0 0h24v5.3H0z" />
          <path fill="#0039A6" d="M0 5.3h24v5.4H0z" />
          <path fill="#D52B1E" d="M0 10.7h24V16H0z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Marcador para un origen que no corresponde a un país, como una dorsal oceánica
 * o un archipiélago sin bandera propia. Se muestra en vez de forzar una bandera
 * incorrecta.
 */
function OceanMark() {
  return (
    <svg
      viewBox={H.h1}
      role="img"
      aria-label="Origen oceánico, sin bandera de país"
      className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] border border-black/10"
    >
      <title>Origen oceánico, sin bandera de país</title>
      <path fill="#0e7490" d="M0 0h24v16H0z" />
      <path
        stroke="#fff"
        strokeWidth="1.2"
        fill="none"
        d="M-1 6c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2M-1 11c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2"
      />
    </svg>
  );
}

export function OriginFlag({ origin }: { origin: string }) {
  if (
    /océano|oceano|atlántico|atlantico|pacífico|pacifico|dorsal/i.test(origin)
  ) {
    return <OceanMark />;
  }
  for (const [pattern, id, title] of ORIGIN_FLAGS) {
    if (pattern.test(origin)) return <Flag id={id} title={title} />;
  }
  return <OceanMark />;
}

/** Países que un destino puede nombrar y que no aparecen como origen. */
const EXTRA_FLAGS: Array<[RegExp, FlagId, string]> = [
  // Departamentos peruanos: un destino puede nombrarlos sin nombrar al país.
  [
    /\b(ica|lima|callao|loreto|tumbes|piura|áncash|ancash|la libertad|arequipa|tacna|cusco|puno|moquegua|junín|junin|huancavelica|ayacucho|pasco|huánuco|huanuco|lambayeque|cajamarca|amazonas|san martín|san martin)\b/i,
    "pe",
    "Perú",
  ],
  [/guatemala/i, "gt", "Guatemala"],
  [/costa rica/i, "cr", "Costa Rica"],
  [/panamá|panama/i, "pa", "Panamá"],
  [/república dominicana|republica dominicana/i, "do", "República Dominicana"],
  [/puerto rico/i, "pr", "Puerto Rico"],
  [/argentina/i, "ar", "Argentina"],
  [/papúa nueva guinea|papua nueva guinea/i, "pg", "Papúa Nueva Guinea"],
  [/corea/i, "kr", "Corea del Sur"],
  [/india/i, "in", "India"],
  [/turquía|turquia/i, "tr", "Turquía"],
  [/grecia/i, "gr", "Grecia"],
  [/rusia/i, "ru", "Rusia"],
];

/**
 * Un destino puede nombrar varios países en una frase ("México o Panamá e islas
 * del Caribe"). Devuelve una bandera por país nombrado, sin repetir, en el orden
 * en que aparecen. Los términos que no son un país no reciben bandera: la celda
 * ya muestra el texto completo.
 */
export function TargetFlags({
  target,
  max = 4,
}: {
  target: string;
  max?: number;
}) {
  const seen = new Set<FlagId>();
  const found: Array<{ id: FlagId; title: string; at: number }> = [];
  for (const [pattern, id, title] of [...ORIGIN_FLAGS, ...EXTRA_FLAGS]) {
    const hit = pattern.exec(target);
    if (!hit || seen.has(id)) continue;
    seen.add(id);
    found.push({ id, title, at: hit.index });
  }
  if (found.length === 0) return null;
  const shown = found.sort((a, b) => a.at - b.at).slice(0, max);
  return (
    <span className="mr-1.5 inline-flex shrink-0 items-center gap-0.5 align-[-2px]">
      {shown.map((flag) => (
        <Flag key={flag.id} id={flag.id} title={flag.title} />
      ))}
    </span>
  );
}
