import { addPropertyControls, ControlType } from "framer"
import { FONT_IMPORT, SHARED_CSS, TOKENS } from "./theme.ts"

/**
 * Skillpath — footer.
 *
 * Three links and a copyright line, as the brief asks, on a dark card that closes
 * the page. The oversized wordmark is the only decoration: at the bottom of a
 * scroll there is nothing left to compete with it, so it can carry the brand
 * without any other ornament.
 */

type FooterLink = { label: string; url: string }

export interface SkillpathFooterProps {
    wordmark?: string
    tagline?: string
    links?: FooterLink[]
    accent?: string
    style?: React.CSSProperties
}

const DEFAULT_LINKS: FooterLink[] = [
    { label: "Courses", url: "#courses" },
    { label: "About", url: "#about" },
    { label: "Contact", url: "#contact" },
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 360
 */
export default function SkillpathFooter({
    wordmark = "Skillpath",
    tagline = "Skills you can use tomorrow.",
    links = DEFAULT_LINKS,
    accent = "#F5B93F",
    style,
}: SkillpathFooterProps) {
    // Read at render rather than hardcoded, so the year doesn't quietly go stale.
    const year = new Date().getFullYear()

    return (
        <footer className="sp-footer" style={{ ...style, ["--sp-accent" as string]: accent }}>
            <style>{FOOTER_STYLES}</style>

            <div className="sp-footer-card">
                <div className="sp-footer-top">
                    <div>
                        <p className="sp-footer-wordmark">{wordmark}</p>
                        <p className="sp-footer-tagline">{tagline}</p>
                    </div>

                    <nav className="sp-footer-nav" aria-label="Footer">
                        {links.map((link) => (
                            <a key={link.label} className="sp-footer-link" href={link.url}>
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>

                <p className="sp-footer-copy">
                    © {year} {wordmark}. All rights reserved.
                </p>
            </div>
        </footer>
    )
}

addPropertyControls(SkillpathFooter, {
    wordmark: { type: ControlType.String, title: "Wordmark", defaultValue: "Skillpath" },
    tagline: {
        type: ControlType.String,
        title: "Tagline",
        defaultValue: "Skills you can use tomorrow.",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Courses" },
                url: { type: ControlType.String, title: "URL", defaultValue: "#courses" },
            },
        },
        defaultValue: DEFAULT_LINKS,
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#F5B93F" },
})

const FOOTER_STYLES = `
${FONT_IMPORT}
.sp-footer {
  ${TOKENS}
  box-sizing: border-box;
  width: 100%;
  padding: 24px;
  background: var(--sp-paper);
  font-family: var(--sp-body);
  -webkit-font-smoothing: antialiased;
}
.sp-footer *, .sp-footer *::before, .sp-footer *::after { box-sizing: border-box; }

${SHARED_CSS}

.sp-footer-card {
  max-width: var(--sp-max);
  margin: 0 auto;
  background: var(--sp-ink);
  color: var(--sp-paper);
  border-radius: 28px;
  padding: 56px 48px 36px;
}

.sp-footer-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
}

.sp-footer-wordmark {
  font-family: var(--sp-display);
  font-size: clamp(48px, 9vw, 104px);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.95;
  margin: 0;
}
.sp-footer-tagline {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.62);
  margin: 14px 0 0;
}

.sp-footer-nav { display: flex; flex-direction: column; gap: 12px; }
.sp-footer-link {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  transition: color 0.15s ease;
}
.sp-footer-link:hover { color: var(--sp-accent); }

.sp-footer-copy {
  margin: 44px 0 0;
  padding-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* The dark card needs its own focus colour — the shared ink ring is invisible
   against it. */
.sp-footer :focus-visible { outline: 2px solid var(--sp-accent); outline-offset: 3px; }

@media (max-width: 640px) {
  .sp-footer-card { padding: 40px 26px 28px; border-radius: 22px; }
  .sp-footer-nav { flex-direction: row; flex-wrap: wrap; gap: 18px; }
}
`
