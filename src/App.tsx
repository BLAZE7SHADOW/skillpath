/**
 * Dev harness. Not part of the deliverable — Framer never sees this file.
 *
 * Three jobs:
 *
 * 1. Force a scenario. The live API fails at random on ~1 request in 3, so the
 *    error and empty states can't be reproduced on demand there. These point the
 *    component at dev/mock-api.mjs, which returns whatever outcome is asked for.
 *
 * 2. Compose the whole page — hero, courses, footer — the way the Framer page
 *    will, so the sections can be checked together rather than in isolation.
 *
 * 3. Show all three breakpoints at once. CSS media queries respond to the
 *    viewport, not to a container, so the three widths are real iframes of this
 *    same page — a 390px-wide <div> would still report the desktop width and
 *    quietly render three columns.
 */

import SkillpathCourses from "./SkillpathCourses.tsx"
import SkillpathHero from "./SkillpathHero.tsx"
import SkillpathFooter from "./SkillpathFooter.tsx"
import Skillpath404 from "./Skillpath404.tsx"
import { DEFAULT_BASE_URL } from "./skillpath.ts"

const MOCK_ROOT = "http://localhost:8787"

/** Each scenario is a courses-mode / country-mode pair on the mock server. */
const SCENARIOS = {
    "live api": DEFAULT_BASE_URL,
    "both ok": `${MOCK_ROOT}/m/ok/ok`,
    "courses fail": `${MOCK_ROOT}/m/error/ok`,
    "country fails only": `${MOCK_ROOT}/m/ok/error`,
    "empty catalogue": `${MOCK_ROOT}/m/empty/ok`,
    "slow (cold start)": `${MOCK_ROOT}/m/slow/ok`,
    "flaky (like production)": `${MOCK_ROOT}/m/flaky/flaky`,
} as const

type ScenarioName = keyof typeof SCENARIOS

/**
 * What the harness renders. The two `breakpoints` views put the real thing in
 * iframes at three widths; the others render it full-window.
 */
const VIEWS = ["breakpoints", "page breakpoints", "full page", "404 page"] as const
type ViewName = (typeof VIEWS)[number]

const FRAMES: Array<{ label: string; width: number; expect: string }> = [
    { label: "Desktop", width: 1280, expect: "3 columns" },
    { label: "Tablet", width: 834, expect: "2 columns" },
    { label: "Mobile", width: 390, expect: "1 column" },
]

export default function App() {
    const params = new URLSearchParams(window.location.search)
    const scenario = (params.get("scenario") ?? "both ok") as ScenarioName
    const view = (params.get("view") ?? "breakpoints") as ViewName
    const baseUrl = SCENARIOS[scenario] ?? SCENARIOS["both ok"]

    const page = (
        <>
            <SkillpathHero />
            <SkillpathCourses baseUrl={baseUrl} />
            <SkillpathFooter />
        </>
    )

    // Inside an iframe: render the real thing only, with no harness around it.
    // `view` is passed through so a frame can hold the whole page, not just the
    // grid — hero and footer have their own breakpoints and need checking too.
    if (params.has("bare")) {
        if (view === "page breakpoints" || view === "full page") return page
        if (view === "404 page") return <Skillpath404 />
        return <SkillpathCourses baseUrl={baseUrl} />
    }

    if (view === "404 page") {
        return (
            <Chrome scenario={scenario} view={view}>
                <Skillpath404 />
            </Chrome>
        )
    }

    if (view === "full page") {
        return (
            <Chrome scenario={scenario} view={view}>
                {page}
            </Chrome>
        )
    }

    // Both breakpoint views: same three frames, different content inside them.
    return (
        <Chrome scenario={scenario} view={view}>
            <div style={frames}>
                {FRAMES.map((frame) => (
                    <figure key={frame.label} style={{ margin: 0 }}>
                        <figcaption style={caption}>
                            {frame.label} · {frame.width}px · expect {frame.expect}
                        </figcaption>
                        <iframe
                            title={`${frame.label} preview`}
                            src={`?bare=1&view=${encodeURIComponent(view)}&scenario=${encodeURIComponent(scenario)}`}
                            style={{
                                ...iframeStyle,
                                width: frame.width,
                                height: view === "page breakpoints" ? 1400 : 900,
                            }}
                        />
                    </figure>
                ))}
            </div>
        </Chrome>
    )
}

function Chrome({
    scenario,
    view,
    children,
}: {
    scenario: ScenarioName
    view: ViewName
    children: React.ReactNode
}) {
    const go = (next: Partial<{ scenario: string; view: string }>) => {
        const params = new URLSearchParams({ scenario, view, ...next })
        window.location.search = `?${params.toString()}`
    }

    return (
        <div style={shell}>
            <header style={bar}>
                <strong style={{ fontSize: 14 }}>Skillpath harness</strong>
                <select value={view} onChange={(e) => go({ view: e.target.value })} style={select}>
                    {VIEWS.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={scenario}
                    onChange={(e) => go({ scenario: e.target.value })}
                    style={select}
                >
                    {Object.keys(SCENARIOS).map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <span style={{ fontSize: 12, color: "#8A93A0" }}>
                    mock server: <code>npm run mock</code>
                </span>
            </header>
            <main style={{ background: "#fff" }}>{children}</main>
        </div>
    )
}

const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "#20242B",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    color: "#E7EAEE",
}
const bar: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #333941",
}
const select: React.CSSProperties = {
    font: "inherit",
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #444C56",
    background: "#2B313A",
    color: "#E7EAEE",
}
const frames: React.CSSProperties = {
    display: "flex",
    gap: 20,
    padding: 20,
    overflowX: "auto",
    alignItems: "flex-start",
    background: "#20242B",
}
const caption: React.CSSProperties = {
    fontSize: 12,
    color: "#8A93A0",
    padding: "0 0 6px 2px",
}
const iframeStyle: React.CSSProperties = {
    height: 900,
    border: "1px solid #3A414A",
    borderRadius: 8,
    background: "#fff",
}
