import { Component, useMemo, useState, type ReactNode } from "react"
import { addPropertyControls, ControlType } from "framer"
import { DEFAULT_BASE_URL, type Course } from "./skillpath.ts"
import { formatPrice, priceInMinorUnits, type Currency } from "./format.ts"
import { useCourses, type CoursesState } from "./useCourses.ts"
import { FONT_IMPORT, SHARED_CSS, TOKENS } from "./theme.ts"
import {
    EmptyBoxDoodle,
    EyebrowIcon,
    SearchDoodle,
    UnpluggedDoodle,
} from "./doodles.tsx"

/**
 * Skillpath — courses section.
 *
 * Fetches the catalogue and the viewer's region, and renders one of four states:
 * loading, error, empty, or ready. The API fails on roughly one request in three
 * and the two endpoints fail independently, so the interesting behaviour is what
 * happens when only part of the data arrives — see the currency notice below.
 *
 * State lives in useCourses.ts; network handling in client.ts.
 */

type SortOrder = "default" | "price-asc" | "price-desc"

/**
 * How many skeleton cards to show while loading. The real count varies between
 * 5 and 10 per request and cannot be known in advance, so this sits mid-range:
 * high enough to fill the grid, low enough that the reflow when data lands is small.
 */
const SKELETON_COUNT = 6

/* ------------------------------------------------------------------ card ---- */

function CourseCard({ course, currency }: { course: Course; currency: Currency }) {
    return (
        <article className="sp-card">
            <h3 className="sp-card-name">{course.courseName}</h3>
            <p className="sp-card-desc">{course.description}</p>
            {/* mainCategory is the extra field: browsing learners sort by subject
                before anything else, and it is the only field here that answers
                "is this even for me?". */}
            <span className="sp-tag">{course.mainCategory}</span>
            <div className="sp-card-foot">
                <span className="sp-price">{formatPrice(course, currency)}</span>
                {course.refundable && <span className="sp-badge">Refundable</span>}
            </div>
        </article>
    )
}

function CardSkeleton() {
    // aria-hidden: this is a placeholder shape, not content. The live region
    // announces "Loading courses" once, instead of six meaningless blocks.
    return (
        <div className="sp-card sp-skeleton" aria-hidden="true">
            <div className="sp-bone" style={{ width: "70%", height: 20 }} />
            <div className="sp-bone" style={{ width: "100%", height: 12 }} />
            <div className="sp-bone" style={{ width: "88%", height: 12 }} />
            <div className="sp-bone" style={{ width: "40%", height: 22, marginTop: 6 }} />
            <div className="sp-card-foot">
                <div className="sp-bone" style={{ width: 78, height: 24 }} />
            </div>
        </div>
    )
}

/* --------------------------------------------------------------- messages ---- */

/**
 * Every non-happy state uses this: a drawing, a plain statement of what happened,
 * and exactly one thing to do next. An error or an empty result is where a page
 * feels most broken, and it is worth the same care as the grid itself.
 */
function Message({
    art,
    title,
    body,
    action,
}: {
    art: ReactNode
    title: string
    body: string
    action?: { label: string; onClick: () => void }
}) {
    return (
        <div className="sp-message">
            <div className="sp-message-art">{art}</div>
            <p className="sp-message-title">{title}</p>
            <p className="sp-message-body">{body}</p>
            {action && (
                <button type="button" className="sp-btn" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    )
}

/**
 * Last line of defence. skillpath.ts validates every course before it reaches
 * here, so this should never fire — but if a card ever throws, the brief's worst
 * outcome is a blank page. This keeps the failure inside the section.
 */
class SectionErrorBoundary extends Component<
    { onReset: () => void; children: ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    render() {
        if (!this.state.hasError) return this.props.children
        return (
            <Message
                art={<UnpluggedDoodle />}
                title="This section stopped unexpectedly."
                body="Reloading the courses usually clears it."
                action={{
                    label: "Reload courses",
                    onClick: () => {
                        this.setState({ hasError: false })
                        this.props.onReset()
                    },
                }}
            />
        )
    }
}

/* ------------------------------------------------------------ status text ---- */

/** One sentence describing the current state, for the live region. Screen reader
 *  users get the same information sighted users read from the grid. */
function statusMessage(state: CoursesState, visibleCount: number, maxAttempts: number): string {
    if (state.status === "loading") {
        return state.attempt > 1
            ? `Loading courses. Retrying, attempt ${state.attempt} of ${maxAttempts}.`
            : "Loading courses."
    }
    if (state.status === "error") return "Courses failed to load."
    if (state.status === "empty") return "No courses are published right now."
    return `${visibleCount} ${visibleCount === 1 ? "course" : "courses"} shown.`
}

/* ------------------------------------------------------------------ main ---- */

export interface SkillpathCoursesProps {
    /** Heading above the grid. Exposed in the Framer properties panel. */
    title?: string
    /** Drives buttons, badges, focus rings and hover. Exposed in Framer. */
    accent?: string
    /**
     * Deliberately not a property control. A designer has no reason to repoint
     * the API, and a text field that can silently break the section is a liability
     * in a panel. It exists as a prop so the local harness can aim at the mock server.
     */
    baseUrl?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function SkillpathCourses({
    title = "Learn something you can use tomorrow",
    accent = "#F5B93F",
    baseUrl = DEFAULT_BASE_URL,
    style,
}: SkillpathCoursesProps) {
    const { state, retry, setCurrency, maxAttempts } = useCourses(baseUrl)
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<SortOrder>("default")

    // Derived, never stored. Keeping a second copy of the list in state is how
    // filters drift out of sync with the data behind them.
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        const filtered = needle
            ? state.courses.filter((course) =>
                  `${course.courseName} ${course.mainCategory} ${course.shortCourse}`
                      .toLowerCase()
                      .includes(needle)
              )
            : state.courses

        if (sort === "default") return filtered
        // Compare in minor units so the ordering never mixes rupees with dollars.
        return [...filtered].sort((a, b) => {
            const difference =
                priceInMinorUnits(a, state.currency) - priceInMinorUnits(b, state.currency)
            return sort === "price-asc" ? difference : -difference
        })
    }, [state.courses, state.currency, query, sort])

    const isLoading = state.status === "loading"
    const showToolbar = state.status === "ready" || isLoading

    return (
        <section
            // The hero button scrolls here.
            id="courses"
            className="sp-root"
            // The accent control reaches the stylesheet as a custom property, so a
            // single swatch repaints buttons, badges, focus rings and hover states.
            style={{ ...style, ["--sp-accent" as string]: accent }}
        >
            <style>{STYLES}</style>

            <div className="sp-wrap">
                <header className="sp-head">
                    <div className="sp-head-copy">
                        <span className="sp-eyebrow">
                            <EyebrowIcon />
                            Courses
                        </span>
                        <h2 className="sp-title">{title}</h2>
                    </div>

                    {showToolbar && (
                        <div className="sp-toolbar">
                            <input
                                className="sp-input"
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search courses"
                                aria-label="Search courses"
                                disabled={isLoading}
                            />
                            <select
                                className="sp-select"
                                value={sort}
                                onChange={(event) => setSort(event.target.value as SortOrder)}
                                aria-label="Sort courses"
                                disabled={isLoading}
                            >
                                <option value="default">Featured</option>
                                <option value="price-asc">Price: low to high</option>
                                <option value="price-desc">Price: high to low</option>
                            </select>
                            <div className="sp-toggle" role="group" aria-label="Currency">
                                {(["INR", "USD"] as const).map((code) => (
                                    <button
                                        key={code}
                                        type="button"
                                        className="sp-toggle-option"
                                        aria-pressed={state.currency === code}
                                        onClick={() => setCurrency(code)}
                                        disabled={isLoading}
                                    >
                                        {code === "INR" ? "₹" : "$"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </header>

                {/* The case the brief singles out: the region call failed but the
                    catalogue arrived. Rather than hide prices or guess silently, the
                    currency is inferred from the device, the guess is disclosed, and
                    the toggle above makes a wrong guess one click from fixed. */}
                {state.currencySource === "inferred" && state.status === "ready" && (
                    <p className="sp-notice">
                        Couldn't reach the region service, so prices are showing in{" "}
                        {state.currency === "INR" ? "rupees" : "dollars"} based on your device.
                        Use the currency switch above to change it.
                    </p>
                )}

                <p className="sp-live" role="status" aria-live="polite">
                    {statusMessage(state, visible.length, maxAttempts)}
                </p>

                <SectionErrorBoundary onReset={retry}>
                    {isLoading && (
                        <>
                            <div className="sp-grid">
                                {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                                    <CardSkeleton key={index} />
                                ))}
                            </div>
                            {/* Only shown once a load is genuinely slow. The API sleeps
                                when idle, so the first request of a session can take a
                                while for a reason worth naming. */}
                            {state.isSlow && (
                                <p className="sp-notice sp-notice--after">
                                    {state.attempt > 1
                                        ? `Still trying — attempt ${state.attempt} of ${maxAttempts}.`
                                        : "Still loading. The server sleeps when it's idle, so the first request takes longer."}
                                </p>
                            )}
                        </>
                    )}

                    {state.status === "error" && (
                        <Message
                            art={<UnpluggedDoodle />}
                            title="Couldn't load the courses."
                            body={
                                state.error?.kind === "timeout"
                                    ? "The server didn't respond in time. It may still be waking up."
                                    : "The catalogue service didn't respond. This usually clears on a second try."
                            }
                            action={{ label: "Try again", onClick: retry }}
                        />
                    )}

                    {state.status === "empty" && (
                        <Message
                            art={<EmptyBoxDoodle />}
                            title="No courses published yet."
                            body="The catalogue is empty right now. Check back soon."
                            action={{ label: "Refresh", onClick: retry }}
                        />
                    )}

                    {state.status === "ready" &&
                        // A search that matches nothing is a different situation from a
                        // catalogue with nothing in it, and needs a different way out.
                        (visible.length === 0 ? (
                            <Message
                                art={<SearchDoodle />}
                                title="No courses match your search."
                                body={`Nothing here matches "${query.trim()}". Try a broader word, or clear the search.`}
                                action={{ label: "Clear search", onClick: () => setQuery("") }}
                            />
                        ) : (
                            <div className="sp-grid">
                                {visible.map((course) => (
                                    <CourseCard
                                        key={course.courseCode || course.mangoId}
                                        course={course}
                                        currency={state.currency}
                                    />
                                ))}
                            </div>
                        ))}
                </SectionErrorBoundary>
            </div>
        </section>
    )
}

addPropertyControls(SkillpathCourses, {
    title: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Learn something you can use tomorrow",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#F5B93F",
    },
})

/* ---------------------------------------------------------------- styles ---- */

/**
 * A stylesheet rather than inline styles, because the three things this layout
 * depends on — media queries, :hover, and @keyframes — cannot be expressed as
 * inline styles at all. Every class is `sp-` prefixed so nothing here can collide
 * with the rest of the Framer page.
 */
const STYLES = `
${FONT_IMPORT}
.sp-root {
  ${TOKENS}
  box-sizing: border-box;
  width: 100%;
  padding: 76px 24px;
  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-body);
  -webkit-font-smoothing: antialiased;
}
.sp-root *, .sp-root *::before, .sp-root *::after { box-sizing: border-box; }

${SHARED_CSS}

/* The whole section sits on a soft panel, the way each block on the rest of the
   site is a rounded card rather than a full-bleed band. */
.sp-wrap {
  max-width: var(--sp-max);
  margin: 0 auto;
  background: var(--sp-panel);
  border-radius: 28px;
  padding: 48px 40px 52px;
}

.sp-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.sp-head-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.sp-eyebrow { background: var(--sp-paper); }

.sp-title {
  font-family: var(--sp-display);
  font-size: clamp(26px, 3.4vw, 40px);
  font-weight: 800;
  letter-spacing: -0.032em;
  line-height: 1.1;
  margin: 0;
  max-width: 17ch;
}

.sp-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.sp-input, .sp-select {
  font-family: var(--sp-body);
  font-size: 14px;
  color: var(--sp-ink);
  background: var(--sp-paper);
  border: 1px solid var(--sp-line);
  border-radius: 999px;
  padding: 10px 16px;
  min-width: 0;
}
.sp-input { width: 190px; }
.sp-input::placeholder { color: var(--sp-muted); }
.sp-input:disabled, .sp-select:disabled, .sp-toggle-option:disabled { opacity: 0.5; }

.sp-toggle {
  display: inline-flex;
  background: var(--sp-paper);
  border: 1px solid var(--sp-line);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.sp-toggle-option {
  font-family: var(--sp-body);
  font-size: 14px;
  font-weight: 600;
  min-width: 38px;
  padding: 7px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--sp-muted);
  cursor: pointer;
}
/* Ink on amber, never amber text — the accent is a fill, not a foreground. */
.sp-toggle-option[aria-pressed="true"] { background: var(--sp-accent); color: var(--sp-ink); }

.sp-notice {
  margin: 0 0 24px;
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--sp-ink);
  background: var(--sp-cream);
  border-radius: 14px;
  border-left: 4px solid var(--sp-accent);
}
.sp-notice--after { margin: 24px 0 0; }

/* Visible to screen readers, not to the eye: the grid already shows this. */
.sp-live {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden; clip-path: inset(50%);
  white-space: nowrap;
}

.sp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}
/* Media queries, not measured widths: reading window.innerWidth into state
   misreports on the Framer canvas and on the first paint of the published page. */
@media (max-width: 1024px) { .sp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px)  { .sp-grid { grid-template-columns: minmax(0, 1fr); } }

.sp-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  height: 100%;
  padding: 24px;
  background: var(--sp-paper);
  border: 1px solid var(--sp-line);
  border-radius: 18px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.sp-card:hover { transform: translateY(-3px); box-shadow: 0 6px 0 rgba(16, 16, 16, 0.08); }

.sp-card-name {
  font-family: var(--sp-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.018em;
  line-height: 1.25;
  margin: 0;
  /* The signature: a marker stroke sweeping in from the left, the way you'd
     highlight a course in a printed prospectus. */
  background-image: linear-gradient(var(--sp-accent), var(--sp-accent));
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0% 0.32em;
  transition: background-size 0.3s ease;
}
.sp-card:hover .sp-card-name { background-size: 100% 0.32em; }

.sp-card-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--sp-muted);
  margin: 0;
  /* Two lines, cut at a word with an ellipsis. Truncating by character count
     in JS would slice mid-word and ignore how the text actually wrapped. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sp-tag {
  font-family: var(--sp-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-muted);
  background: var(--sp-panel);
  border-radius: 999px;
  padding: 5px 11px;
}

.sp-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  /* Pushes the price to the bottom so it lines up across a ragged row —
     the card count varies, so rows are often uneven. */
  margin-top: auto;
  padding-top: 16px;
}
.sp-price {
  font-family: var(--sp-mono);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.sp-badge {
  font-family: var(--sp-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-ink);
  background: var(--sp-accent);
  border-radius: 999px;
  padding: 5px 10px;
}

.sp-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px 44px;
  background: var(--sp-paper);
  border: 1px solid var(--sp-line);
  border-radius: 18px;
}
.sp-message-art { color: var(--sp-ink); margin-bottom: 18px; }
.sp-message-title {
  font-family: var(--sp-display);
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 6px;
}
.sp-message-body {
  font-size: 14px;
  line-height: 1.6;
  color: var(--sp-muted);
  margin: 0 0 22px;
  max-width: 44ch;
}

.sp-skeleton { gap: 12px; }
.sp-bone {
  border-radius: 999px;
  background: linear-gradient(90deg, #ECEEF1 25%, #F6F7F9 50%, #ECEEF1 75%);
  background-size: 200% 100%;
  animation: sp-shimmer 1.4s ease-in-out infinite;
}
@keyframes sp-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

@media (max-width: 640px) {
  .sp-root { padding: 56px 16px; }
  .sp-wrap { padding: 32px 20px 36px; border-radius: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .sp-bone { animation: none; }
  .sp-card, .sp-card-name { transition: none; }
  .sp-card:hover { transform: none; }
}
`
