import { addPropertyControls, ControlType } from "framer"
import { EyebrowIcon, PathDoodle } from "./doodles.tsx"
import { FONT_IMPORT, SHARED_CSS, TOKENS } from "./theme.ts"

/**
 * Skillpath — hero.
 *
 * Headline, one supporting line, one button, as the brief asks. The button is the
 * only thing on the page a first-time visitor is asked to do, so it goes to the
 * courses rather than nowhere.
 */

export interface SkillpathHeroProps {
    eyebrow?: string
    headline?: string
    /** Rendered after the headline with a marker stroke behind it. */
    highlight?: string
    subheadline?: string
    buttonLabel?: string
    /** Anchor the button scrolls to. Matches the id on the courses section. */
    buttonTarget?: string
    accent?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 */
export default function SkillpathHero({
    eyebrow = "Learn by doing",
    headline = "Learn it this week.",
    highlight = "Use it next week.",
    subheadline = "Practical courses on what creators actually get paid for. Built around execution, not theory.",
    buttonLabel = "Browse courses",
    buttonTarget = "#courses",
    accent = "#F5B93F",
    style,
}: SkillpathHeroProps) {
    return (
        <section
            className="sp-hero"
            style={{ ...style, ["--sp-accent" as string]: accent }}
        >
            <style>{HERO_STYLES}</style>

            <div className="sp-hero-inner">
                <div className="sp-hero-copy">
                    <span className="sp-eyebrow">
                        <EyebrowIcon />
                        {eyebrow}
                    </span>

                    <h1 className="sp-hero-title">
                        {headline}
                        {highlight && (
                            <>
                                {" "}
                                <span className="sp-mark">{highlight}</span>
                            </>
                        )}
                    </h1>

                    <p className="sp-hero-sub">{subheadline}</p>

                    <a className="sp-btn sp-btn--accent" href={buttonTarget}>
                        {buttonLabel}
                    </a>
                </div>

                {/* Decorative, and marked aria-hidden inside the component, so a
                    screen reader hears the headline rather than a description of
                    a drawing that carries no information. */}
                <div className="sp-hero-art">
                    <PathDoodle />
                </div>
            </div>
        </section>
    )
}

addPropertyControls(SkillpathHero, {
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "Learn by doing" },
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Learn it this week.",
    },
    highlight: {
        type: ControlType.String,
        title: "Highlighted",
        defaultValue: "Use it next week.",
    },
    subheadline: {
        type: ControlType.String,
        title: "Sub-headline",
        displayTextArea: true,
        defaultValue:
            "Practical courses on what creators actually get paid for. Built around execution, not theory.",
    },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Browse courses" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#F5B93F" },
})

const HERO_STYLES = `
${FONT_IMPORT}
.sp-hero {
  ${TOKENS}
  box-sizing: border-box;
  width: 100%;
  padding: 88px 32px 72px;
  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-body);
  -webkit-font-smoothing: antialiased;
}
.sp-hero *, .sp-hero *::before, .sp-hero *::after { box-sizing: border-box; }

${SHARED_CSS}

.sp-hero-inner {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 48px;
  max-width: var(--sp-max);
  margin: 0 auto;
}

.sp-hero-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; }

.sp-hero-title {
  font-family: var(--sp-display);
  /* Scales with the viewport so the headline stays two lines from phone to
     desktop instead of collapsing into five. */
  font-size: clamp(38px, 5.6vw, 68px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.04;
  margin: 0;
  max-width: 13ch;
}

.sp-hero-sub {
  font-size: 17px;
  line-height: 1.6;
  color: var(--sp-muted);
  margin: 0;
  max-width: 46ch;
}

.sp-hero-art { display: flex; justify-content: center; color: var(--sp-ink); }

@media (max-width: 900px) {
  .sp-hero { padding: 64px 24px 56px; }
  .sp-hero-inner { grid-template-columns: 1fr; gap: 32px; }
  /* The drawing leads on narrow screens only if it stays out of the way —
     it drops below the copy and shrinks rather than pushing the button
     off the first screen. */
  .sp-hero-art { order: 2; }
  .sp-hero-art svg { width: 260px; }
  .sp-hero-title { max-width: 18ch; }
}
`
