/**
 * Hand-drawn line illustrations, as inline SVG.
 *
 * These are drawn here rather than imported: a Framer code component can't rely
 * on an asset pipeline, and inline paths cost nothing to load, scale cleanly, and
 * inherit `currentColor` so they follow the surrounding text.
 *
 * They exist because an error or an empty result is where a page usually feels
 * most broken, and a drawing turns a dead end into something a person is willing
 * to read. The style — open strokes, round caps, a few loose sparks — is the
 * marker idiom; every path below is original.
 */

type DoodleProps = {
    /** Rendered width in pixels; height follows the viewBox. */
    size?: number
}

/** Shared stroke treatment. Round joins are most of what reads as "drawn". */
const ink = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const

/** Small four-point spark, used to add life around the larger drawings. */
export function Sparkle({ size = 16 }: DoodleProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M12 2c1.2 5.4 3.4 7.6 8.8 8.8-5.4 1.2-7.6 3.4-8.8 8.8-1.2-5.4-3.4-7.6-8.8-8.8C8.6 9.6 10.8 7.4 12 2Z"
                fill="currentColor"
            />
        </svg>
    )
}

/**
 * The hero drawing: a winding dashed route with milestones and a flag.
 *
 * The product is called Skillpath, and a path is the one image the name already
 * carries — so the hero draws the literal thing rather than a generic mascot.
 */
export function PathDoodle({ size = 340 }: DoodleProps) {
    return (
        <svg
            width={size}
            viewBox="0 0 340 260"
            aria-hidden="true"
            style={{ maxWidth: "100%", height: "auto" }}
        >
            {/* The route itself, dashed like a map trail */}
            <path
                {...ink}
                strokeWidth={2.8}
                strokeDasharray="10 11"
                d="M24 236c46-6 40-52 88-64s44-56 92-70c30-9 44-28 62-48"
            />

            {/* Milestones along the way — three, matching the three steps a
                learner actually takes: start, practise, ship. */}
            <circle {...ink} cx="24" cy="236" r="7" />
            <circle {...ink} cx="112" cy="172" r="9" />
            <circle {...ink} cx="204" cy="102" r="9" />

            {/* The flag at the end of the route */}
            <path {...ink} d="M266 54V16" />
            <path {...ink} d="M266 20c12 2 20 8 34 5-4 8-4 14 0 21-14 3-22-3-34-5" />

            {/* Loose marks: the small arcs and sparks a marker sketch collects */}
            <path {...ink} strokeWidth={2} d="M60 196c6-5 13-6 20-3" />
            <path {...ink} strokeWidth={2} d="M156 136c7-5 14-5 21-1" />
            <g style={{ opacity: 0.9 }}>
                <g transform="translate(292 96)">
                    <Sparkle size={22} />
                </g>
                <g transform="translate(38 92)">
                    <Sparkle size={16} />
                </g>
                <g transform="translate(232 194)">
                    <Sparkle size={14} />
                </g>
            </g>
        </svg>
    )
}

/** Shown when a search matches nothing: a lens that found empty space. */
export function SearchDoodle({ size = 132 }: DoodleProps) {
    return (
        <svg width={size} viewBox="0 0 140 130" aria-hidden="true">
            <circle {...ink} strokeWidth={2.8} cx="58" cy="54" r="31" />
            <path {...ink} strokeWidth={3.4} d="M81 77l28 29" />
            {/* An empty lens — nothing caught in it */}
            <path {...ink} strokeWidth={2} d="M46 60c8 5 16 5 24 0" />
            <g transform="translate(100 18)">
                <Sparkle size={18} />
            </g>
            <g transform="translate(16 96)">
                <Sparkle size={14} />
            </g>
        </svg>
    )
}

/** Shown when a request failed: a cable that came apart in the middle. */
export function UnpluggedDoodle({ size = 132 }: DoodleProps) {
    return (
        <svg width={size} viewBox="0 0 140 130" aria-hidden="true">
            {/* Left half, ending in a plug */}
            <path {...ink} d="M8 40c26 0 34 14 34 26" />
            <path {...ink} strokeWidth={2.8} d="M32 66h20v14a10 10 0 0 1-20 0z" />
            {/* Right half, ending in a socket */}
            <path {...ink} d="M132 40c-26 0-34 14-34 26" />
            <path {...ink} strokeWidth={2.8} d="M88 66h20v14a10 10 0 0 1-20 0z" />
            {/* The break between them */}
            <path {...ink} strokeWidth={2} d="M64 100l8-12h-6l8-12" />
            <path {...ink} strokeWidth={2} d="M56 112c10 4 20 4 30 0" />
        </svg>
    )
}

/** Shown when the catalogue is genuinely empty: an open, waiting box. */
export function EmptyBoxDoodle({ size = 132 }: DoodleProps) {
    return (
        <svg width={size} viewBox="0 0 140 130" aria-hidden="true">
            <path {...ink} strokeWidth={2.8} d="M28 54l42-16 42 16-42 16z" />
            <path {...ink} strokeWidth={2.8} d="M28 54v38l42 16V70" />
            <path {...ink} strokeWidth={2.8} d="M112 54v38l-42 16" />
            {/* Open flaps, so it reads as waiting to be filled rather than lost */}
            <path {...ink} strokeWidth={2} d="M32 48L18 32" />
            <path {...ink} strokeWidth={2} d="M108 48l14-16" />
            <g transform="translate(64 6)">
                <Sparkle size={16} />
            </g>
        </svg>
    )
}

/** Shown on the 404 page: a signpost pointing two ways at once. */
export function SignpostDoodle({ size = 200 }: DoodleProps) {
    return (
        <svg width={size} viewBox="0 0 200 180" aria-hidden="true">
            <path {...ink} strokeWidth={3} d="M100 158V38" />
            {/* Upper sign, pointing right */}
            <path {...ink} strokeWidth={2.8} d="M100 50h56l14 13-14 13h-56z" />
            {/* Lower sign, pointing left */}
            <path {...ink} strokeWidth={2.8} d="M100 92H44L30 105l14 13h56z" />
            {/* Ground */}
            <path {...ink} strokeWidth={2.4} d="M64 158c22 6 50 6 72 0" />
            <g transform="translate(150 132)">
                <Sparkle size={18} />
            </g>
            <g transform="translate(28 24)">
                <Sparkle size={14} />
            </g>
        </svg>
    )
}

/** The disc glyph inside an eyebrow pill. */
export function EyebrowIcon() {
    return (
        <span className="sp-eyebrow-icon" aria-hidden="true">
            <Sparkle size={12} />
        </span>
    )
}
