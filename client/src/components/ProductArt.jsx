import { useId } from 'react'

/**
 * ProductArt — generates crisp, brand-owned SVG artwork for every product type.
 * Dark studio backdrop + soft volt ring + stylized product silhouette.
 */

const Studio = ({ children, bg = true }) => {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`bg${uid}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#18222E" />
          <stop offset="100%" stopColor="#0A0E13" />
        </radialGradient>
        <linearGradient id={`sheen${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {bg && <rect width="200" height="200" fill={`url(#bg${uid})`} />}
      {bg && (
        <circle cx="100" cy="96" r="72" fill="none" stroke="#C6F53F" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="3 7" />
      )}
      <ellipse cx="100" cy="172" rx="56" ry="9" fill="#000" opacity="0.35" />
      {children}
      <rect width="200" height="200" fill={`url(#sheen${uid})`} />
    </svg>
  )
}

export function JerseyArt({ primary = '#7C1D2E', secondary = '#F5E9DC', number = '10', name = 'FLEET', view = 'front' }) {
  const uid = useId().replace(/:/g, '')
  const body = 'M68 22 C80 34 120 34 132 22 L158 34 L178 88 L146 100 L142 80 L142 194 L58 194 L58 80 L54 100 L22 88 L42 34 Z'
  return (
    <Studio>
      <defs>
        <linearGradient id={`sh${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g transform="translate(0,-2)">
        <path d={body} fill={primary} stroke="#00000055" strokeWidth="1.5" />
        <g clipPath={`url(#clip${uid})`}>
          <rect x="14" y="82" width="36" height="12" fill={secondary} transform="rotate(-22 32 88)" />
          <rect x="14" y="98" width="36" height="12" fill={secondary} transform="rotate(-22 32 104)" />
          <rect x="150" y="82" width="36" height="12" fill={secondary} transform="rotate(22 168 88)" />
          <rect x="150" y="98" width="36" height="12" fill={secondary} transform="rotate(22 168 104)" />
          <path d="M58 194 L142 194 L142 186 L58 186 Z" fill="#00000033" />
          <path d={body} fill={`url(#sh${uid})`} />
        </g>
        <path d="M68 22 C80 34 120 34 132 22 L127 27 C115 38 85 38 73 27 Z" fill="#0A0E13" />
        {view === 'front' ? (
          <>
            <text x="100" y="66" textAnchor="middle" fontFamily="Bebas Neue" fontSize="15" letterSpacing="3" fill={secondary} opacity="0.9">FLEETMART</text>
            <text x="100" y="152" textAnchor="middle" fontFamily="Bebas Neue" fontSize="72" fontWeight="700" fill={secondary} stroke="#00000033" strokeWidth="1">{number}</text>
          </>
        ) : (
          <>
            <text x="100" y="62" textAnchor="middle" fontFamily="Bebas Neue" fontSize="17" letterSpacing="4" fill={secondary}>{name}</text>
            <text x="100" y="158" textAnchor="middle" fontFamily="Bebas Neue" fontSize="72" fontWeight="700" fill={secondary} stroke="#00000033" strokeWidth="1">{number}</text>
          </>
        )}
      </g>
    </Studio>
  )
}

export function BootArt({ primary = '#C6F53F', secondary = '#0A0E13' }) {
  return (
    <Studio>
      <g transform="translate(4,6) scale(1.02)">
        <path
          d="M34 66 C34 48 52 36 74 36 C96 36 104 50 116 68 C127 84 146 94 166 102 C182 108 186 122 178 132 L170 140 L46 140 C34 140 28 126 32 104 Z"
          fill={primary}
          stroke="#00000055"
          strokeWidth="1.5"
        />
        <path d="M34 66 C34 48 52 36 74 36 C84 36 92 39 98 44 L60 140 L46 140 C34 140 28 126 32 104 Z" fill="#ffffff" opacity="0.08" />
        <path d="M170 140 L46 140 C40 140 36 136 36 130 L172 122 Z" fill={secondary} opacity="0.85" />
        <path d="M36 132 L178 124 L184 138 C185 146 178 150 170 150 L44 150 C36 150 32 142 36 132 Z" fill={secondary} />
        <path d="M44 150 L170 150 L168 158 L48 158 Z" fill="#00000066" />
        {[56, 84, 112, 140, 164].map((x) => (
          <path key={x} d={`M${x - 4} 158 L${x + 6} 158 L${x + 8} 166 L${x - 2} 166 Z`} fill={primary} opacity="0.9" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${62 + i * 17} ${52 + i * 6} L${78 + i * 17} ${44 + i * 6}`} stroke={secondary} strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
        ))}
      </g>
    </Studio>
  )
}

export function BallArt({ primary = '#F5F7F4', secondary = '#0A0E13', accent = '#C6F53F' }) {
  const uid = useId().replace(/:/g, '')
  return (
    <Studio>
      <defs>
        <radialGradient id={`ball${uid}`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="62" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="62" fill={`url(#ball${uid})`} />
      <path d="M100 82 L114 92 L109 108 L91 108 L86 92 Z" fill={secondary} />
      <g stroke={secondary} strokeWidth="3.5" strokeLinecap="round">
        <path d="M100 82 L100 44" />
        <path d="M114 92 L148 74" />
        <path d="M109 108 L134 136" />
        <path d="M91 108 L66 136" />
        <path d="M86 92 L52 74" />
      </g>
      <g fill={secondary} opacity="0.85">
        <path d="M100 44 L110 52 L100 58 L90 52 Z" />
        <path d="M148 74 L154 84 L146 90 L140 80 Z" />
        <path d="M134 136 L124 142 L118 132 L126 124 Z" />
        <path d="M66 136 L76 142 L82 132 L74 124 Z" />
        <path d="M52 74 L46 84 L54 90 L60 80 Z" />
      </g>
      <path d="M100 38 C124 38 144 50 154 68" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 10" />
    </Studio>
  )
}

export function GloveArt({ primary = '#E8C36A', secondary = '#0A0E13', accent = '#C6F53F' }) {
  return (
    <Studio>
      <g transform="translate(6,2)">
        <path d="M78 40 C78 32 122 32 122 40 L124 108 C124 140 112 158 100 158 C88 158 76 140 76 108 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
        <path d="M76 78 C60 76 48 86 50 100 C52 112 66 118 76 112 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
        <path d="M78 40 C78 32 122 32 122 40 L122 52 L78 52 Z" fill={secondary} />
        <rect x="74" y="142" width="52" height="18" rx="4" fill={secondary} />
        <g fill={accent} opacity="0.9">
          <circle cx="88" cy="72" r="3.4" />
          <circle cx="100" cy="68" r="3.4" />
          <circle cx="112" cy="72" r="3.4" />
          <circle cx="88" cy="88" r="3.4" />
          <circle cx="100" cy="84" r="3.4" />
          <circle cx="112" cy="88" r="3.4" />
          <circle cx="88" cy="104" r="3.4" />
          <circle cx="100" cy="100" r="3.4" />
          <circle cx="112" cy="104" r="3.4" />
        </g>
        <path d="M78 40 C78 34 122 34 122 40 L78 40" fill="#ffffff" opacity="0.15" />
      </g>
    </Studio>
  )
}

export function ConeArt({ primary = '#C6F53F', secondary = '#0A0E13' }) {
  return (
    <Studio>
      <path d="M100 44 L132 142 L68 142 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <path d="M100 44 L112 82 L88 82 Z" fill="#ffffff" opacity="0.14" />
      <path d="M84 106 L116 106 L120 120 L80 120 Z" fill={secondary} />
      <rect x="56" y="142" width="88" height="12" rx="3" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <rect x="56" y="142" width="88" height="5" fill="#ffffff" opacity="0.12" />
    </Studio>
  )
}

export function LadderArt({ primary = '#FF5A1F', secondary = '#111923' }) {
  return (
    <Studio>
      <g transform="rotate(-6 100 100)">
        <rect x="52" y="36" width="7" height="122" rx="3.5" fill={secondary} />
        <rect x="141" y="36" width="7" height="122" rx="3.5" fill={secondary} />
        {[46, 68, 90, 112, 134].map((y) => (
          <rect key={y} x="52" y={y} width="96" height="7" rx="3.5" fill={primary} />
        ))}
        <rect x="48" y="32" width="15" height="130" rx="4" fill="#ffffff" opacity="0.06" />
      </g>
    </Studio>
  )
}

export function BibArt({ primary = '#1D5C9E', secondary = '#F5F7F4' }) {
  return (
    <Studio>
      <path d="M74 36 L88 46 C96 50 104 50 112 46 L126 36 L146 50 L134 76 L128 68 L128 158 L72 158 L72 68 L66 76 L54 50 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <path d="M72 158 L128 158 L128 150 L72 150 Z" fill="#00000033" />
      <text x="100" y="122" textAnchor="middle" fontFamily="Bebas Neue" fontSize="44" fill={secondary} opacity="0.95">7</text>
      <path d="M54 50 L74 40 L88 46 C80 52 70 56 62 62 Z" fill="#ffffff" opacity="0.12" />
    </Studio>
  )
}

export function GuardArt({ primary = '#1D5C9E', secondary = '#F5F7F4', accent = '#C6F53F' }) {
  return (
    <Studio>
      <path d="M70 34 C92 26 108 26 130 34 L134 104 C134 136 118 158 100 166 C82 158 66 136 66 104 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <path d="M70 34 C92 26 108 26 130 34 L131 52 C110 44 90 44 69 52 Z" fill="#ffffff" opacity="0.14" />
      <path d="M100 48 L106 76 L134 76 L112 94 L120 122 L100 106 L80 122 L88 94 L66 76 L94 76 Z" fill={secondary} opacity="0.9" transform="scale(0.82) translate(22,16)" />
      <rect x="66" y="120" width="68" height="8" rx="4" fill={accent} opacity="0.85" />
    </Studio>
  )
}

export function BagArt({ primary = '#111923', secondary = '#C6F53F', accent = '#8A98A6' }) {
  return (
    <Studio>
      <path d="M46 66 L154 66 L162 160 C162 166 158 170 152 170 L48 170 C42 170 38 166 38 160 Z" fill={primary} stroke="#00000066" strokeWidth="1.5" />
      <path d="M70 66 C70 44 130 44 130 66" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
      <path d="M38 118 L162 118 L162 160 C162 166 158 170 152 170 L48 170 C42 170 38 166 38 160 Z" fill="#ffffff" opacity="0.07" />
      <rect x="72" y="126" width="56" height="30" rx="4" fill={secondary} opacity="0.95" />
      <path d="M78 126 L78 156 M122 126 L122 156" stroke="#00000044" strokeWidth="2" />
      <rect x="46" y="66" width="108" height="8" fill="#ffffff" opacity="0.1" />
    </Studio>
  )
}

export function SockArt({ primary = '#C6F53F', secondary = '#0A0E13', accent = '#F5F7F4' }) {
  const Sock = ({ x, k }) => (
    <g transform={`translate(${x},10) rotate(${k})`}>
      <path d="M70 34 L118 34 L118 104 C118 128 130 134 130 150 C130 166 116 174 102 170 L64 152 C56 148 54 140 54 130 L54 34 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
      <rect x="70" y="34" width="48" height="14" fill={accent} />
      <path d="M54 130 C54 140 56 148 64 152 L102 170 C90 160 78 148 78 128 Z" fill="#00000022" />
    </g>
  )
  return (
    <Studio>
      <Sock x={-14} k={-7} />
      <Sock x={22} k={5} />
      <g fill={accent} transform="translate(22,10) rotate(5)">
        <circle cx="88" cy="110" r="3" /><circle cx="102" cy="112" r="3" /><circle cx="95" cy="122" r="3" />
      </g>
    </Studio>
  )
}

export function ScarfArt({ primary = '#7C1D2E', secondary = '#F5E9DC', accent = '#0A0E13' }) {
  return (
    <Studio>
      <g transform="rotate(3 100 100)">
        <path d="M64 28 L136 28 L136 128 L122 148 L112 132 L100 150 L88 132 L78 148 L64 128 Z" fill={primary} stroke="#00000055" strokeWidth="1.5" />
        {[44, 62, 80, 98, 116].map((y) => (
          <rect key={y} x="64" y={y} width="72" height="7" fill={secondary} opacity="0.9" />
        ))}
        <rect x="64" y="28" width="72" height="9" fill={accent} />
        <text x="100" y="102" textAnchor="middle" fontFamily="Bebas Neue" fontSize="17" letterSpacing="2" fill={secondary}>FLEETMART</text>
      </g>
    </Studio>
  )
}

export function CapArt({ primary = '#0A0E13', secondary = '#C6F53F', accent = '#C6F53F' }) {
  return (
    <Studio>
      <path d="M56 108 C56 68 76 48 100 48 C124 48 144 68 144 108 Z" fill={primary} stroke="#00000066" strokeWidth="1.5" />
      <path d="M56 108 C56 68 76 48 100 48 L100 108 Z" fill="#ffffff" opacity="0.07" />
      <path d="M144 108 C166 106 180 112 180 122 C180 130 170 132 156 130 L144 126 Z" fill={accent} stroke="#00000066" strokeWidth="1.5" />
      <path d="M52 108 L148 108 L148 116 L52 116 Z" fill={secondary} opacity="0.9" />
      <circle cx="100" cy="56" r="4" fill={accent} />
      <path d="M100 56 L100 50" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <text x="100" y="94" textAnchor="middle" fontFamily="Bebas Neue" fontSize="26" fill={secondary}>VA</text>
    </Studio>
  )
}

export function TurfArt({ primary = '#146B45', secondary = '#0A0E13', accent = '#C6F53F' }) {
  return (
    <Studio>
      <path d="M40 118 L160 118 L160 146 C160 152 155 156 148 156 L52 156 C45 156 40 152 40 146 Z" fill={secondary} />
      <path d="M40 112 L160 112 L160 122 L40 122 Z" fill="#ffffff" opacity="0.08" />
      <g>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d={`M${44 + i * 7.6} 112 L${46 + i * 7.6} ${86 + (i % 3) * 6} L${50 + i * 7.6} 112 Z`} fill={i % 4 === 0 ? accent : primary} />
        ))}
      </g>
      <path d="M40 118 L160 118 L160 128 L40 128 Z" fill="#00000033" />
      <text x="100" y="148" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" letterSpacing="3" fill="#F5F7F4" opacity="0.85">PREMIER 50MM</text>
    </Studio>
  )
}

const REGISTRY = {
  jersey: JerseyArt,
  boots: BootArt,
  football: BallArt,
  goalkeeper: GloveArt,
  training: ConeArt,
  turf: TurfArt,
  accessories: BagArt,
  merch: ScarfArt,
}

/** Studio backdrop only — no product silhouette (used on catalog listings). */
export function StudioArt() {
  return <Studio>{null}</Studio>
}

const SUB_ART = {
  'Ladders': LadderArt,
  'Bibs': BibArt,
  'Shin Guards': GuardArt,
  'Socks': SockArt,
  'Caps': CapArt,
  'Artificial Grass': TurfArt,
}

export function ProductArt({ product, view = 'front', custom = {} }) {
  const Art =
    SUB_ART[product.subCategory] ||
    REGISTRY[product.category] ||
    BallArt
  const colors = product.team
    ? { primary: undefined, ...custom }
    : { primary: product.artColors?.primary, secondary: product.artColors?.secondary, accent: product.artColors?.accent, ...custom }

  if (product.category === 'jersey') {
    const t = product.team ? { primary: custom.primary, secondary: custom.secondary, number: custom.number, name: custom.name } : {}
    return <JerseyArt {...colors} {...t} view={view} />
  }
  return <Art {...colors} />
}
