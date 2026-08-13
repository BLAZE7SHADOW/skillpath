import { addPropertyControls, ControlType } from "framer"
import { SignpostDoodle } from "./doodles.tsx"
import { FONT_IMPORT, SHARED_CSS, TOKENS } from "./theme.ts"

/**
 * Skillpath — 404.
 *
 * Framer serves a custom page for unknown URLs; this is what goes on it. A wrong
 * address is the one moment a visitor is certain something is broken, so the page
 * says plainly what happened and offers the one route back. No joke, no dead end.
 */

export interface Skillpath404Props {
    headline?: string
    body?: string
    buttonLabel?: string
    buttonTarget?: string
    accent?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 */
export default function Skillpath404({
    headline = "This page went off the path.",
    body = "The link may be old, or the page may have moved. The courses are still where you left them.",
    buttonLabel = "Back to courses",
    buttonTarget = "/",
    accent = "#F5B93F",
    style,
}: Skillpath404Props) {
    return (
        <section className="sp-404" style={{ ...style, ["--sp-accent" as string]: accent }}>
            <style>{NOT_FOUND_STYLES}</style>

            <div className="sp-404-inner">
                <div className="sp-404-art">
                    <SignpostDoodle />
                </div>

                <div className="sp-404-copy">
                    {/* The code is stated as data, small and in mono, rather than
                        as a giant "404" — the visitor needs the explanation more
                        than they need the number. */}
                    <span className="sp-404-code">Error 404</span>
                    <h1 className="sp-404-title">{headline}</h1>
                    <p className="sp-404-body">{body}</p>
                    <a className="sp-btn sp-btn--accent" href={buttonTarget}>
                        {buttonLabel}
                    </a>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(Skillpath404, {
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "This page went off the path.",
    },
    body: {
        type: ControlType.String,
        title: "Body",
        displayTextArea: true,
        defaultValue:
            "The link may be old, or the page may have moved. The courses are still where you left them.",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Back to courses",
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#F5B93F" },
})

const NOT_FOUND_STYLES = `
${FONT_IMPORT}
.sp-404 {
  ${TOKENS}
  box-sizing: border-box;
  width: 100%;
  min-height: 70vh;
  display: grid;
  place-items: center;
  padding: 72px 32px;
  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-body);
  -webkit-font-smoothing: antialiased;
}
.sp-404 *, .sp-404 *::before, .sp-404 *::after { box-sizing: border-box; }

${SHARED_CSS}

.sp-404-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 56px;
  max-width: 900px;
  background: var(--sp-cream);
  border-radius: 28px;
  padding: 56px 48px;
}

.sp-404-art { color: var(--sp-ink); flex: 0 0 auto; }

.sp-404-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; max-width: 42ch; }

.sp-404-code {
  font-family: var(--sp-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sp-muted);
}

.sp-404-title {
  font-family: var(--sp-display);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
}

.sp-404-body { font-size: 16px; line-height: 1.6; color: var(--sp-muted); margin: 0; }

@media (max-width: 720px) {
  .sp-404 { padding: 48px 20px; }
  .sp-404-inner { gap: 28px; padding: 40px 26px; }
  .sp-404-art svg { width: 150px; }
}
`
