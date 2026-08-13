/**
 * Shared design tokens and the handful of styles every Skillpath section reuses.
 *
 * Each component injects its own <style> tag, because a Framer code component has
 * to be self-contained — it can't rely on a stylesheet another component happened
 * to add. Keeping the tokens in one exported string means they're written once
 * here and interpolated into each component's stylesheet, so the sections can't
 * drift apart.
 */

/**
 * The typefaces, loaded by the components themselves.
 *
 * Framer only downloads a font when something on the canvas uses it, and these
 * sections set their type in CSS rather than through a Framer text layer — so on
 * the published page the fonts would silently never load and everything would
 * fall back to the system sans. Importing here makes each section responsible for
 * the fonts it uses. Browsers de-duplicate the request, so repeating it across
 * sections costs one download.
 *
 * Must stay the first rule in any stylesheet it's added to: CSS ignores an
 * @import that appears after other rules.
 */
export const FONT_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");`

/**
 * Custom properties are declared on each component's own root element rather than
 * on :root, since a code component can't count on owning the document. Any token
 * exposed as a property control (the accent) is overridden by an inline style,
 * which wins over these values.
 */
export const TOKENS = `
  --sp-ink: #101010;
  --sp-paper: #FFFFFF;
  --sp-panel: #F4F5F6;
  --sp-cream: #FFFBF0;
  --sp-muted: #6B7280;
  --sp-line: #E6E8EB;
  --sp-accent: #F5B93F;

  --sp-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --sp-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --sp-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --sp-max: 1200px;
`

/**
 * Buttons, the eyebrow pill, and the focus ring.
 *
 * The button carries a solid offset shadow instead of a soft blur, and presses
 * down into it on hover — a physical, slightly toy-like control rather than a
 * flat rectangle. It is the one motion in the design that repeats everywhere.
 */
export const SHARED_CSS = `
.sp-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--sp-body);
  font-size: 15px;
  font-weight: 700;
  color: var(--sp-paper);
  background: var(--sp-ink);
  border: 0;
  border-radius: 999px;
  padding: 14px 26px;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 0 rgba(16, 16, 16, 0.28);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.sp-btn:hover { transform: translateY(2px); box-shadow: 0 2px 0 rgba(16, 16, 16, 0.28); }
.sp-btn:active { transform: translateY(4px); box-shadow: 0 0 0 rgba(16, 16, 16, 0.28); }

/* The high-emphasis variant: amber fill, black text, solid black shadow.
   Amber on white fails contrast for text, so the accent is always a background
   with ink on top of it — never coloured type. */
.sp-btn--accent {
  background: var(--sp-accent);
  color: var(--sp-ink);
  box-shadow: 0 4px 0 var(--sp-ink);
}
.sp-btn--accent:hover { box-shadow: 0 2px 0 var(--sp-ink); }
.sp-btn--accent:active { box-shadow: 0 0 0 var(--sp-ink); }

/* Section label: a black icon disc followed by a short uppercase word. It says
   what the section is, so it earns its place as structure rather than ornament. */
.sp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--sp-panel);
  border-radius: 999px;
  padding: 5px 16px 5px 5px;
  font-family: var(--sp-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sp-ink);
}
.sp-eyebrow-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sp-ink);
  color: var(--sp-accent);
}

/* A marker stroke behind text, the way you'd highlight a line in a workbook.
   Drawn as a background layer so the ink stays readable on top of it. */
.sp-mark {
  background-image: linear-gradient(var(--sp-accent), var(--sp-accent));
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 100% 0.32em;
  /* Without this, a phrase that wraps gets one stroke stretched across both
     lines instead of a stroke under each — the marker looks like it slipped. */
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

:focus-visible { outline: 2px solid var(--sp-ink); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .sp-btn { transition: none; }
  .sp-btn:hover, .sp-btn:active { transform: none; }
}
`
