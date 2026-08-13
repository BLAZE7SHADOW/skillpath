# Skillpath

A Framer landing page for a learning platform. The courses section is a React code
component that renders a catalogue from a deliberately flaky API; the hero, footer
and 404 are the page around it.

**Read `src/` — that is the product. `dev/` is test tooling and never ships.**

> The course objects inside `dev/mock-api.mjs` are test fixtures for the local mock
> server, not application data. Nothing in `src/` contains a course, a price, or a
> fallback list — the component renders only what it fetched, and shows an explicit
> empty or error state when it fetched nothing. See `src/skillpath.ts`, which is the
> only place course data enters the app.

## AI use

Built with Claude Code. The complete session log is in
[`AI-TRANSCRIPT.md`](./AI-TRANSCRIPT.md) — every message, unedited.

Claude Code sessions are local and have no public share URL (that is a claude.ai web
feature), so the log is committed here rather than linked. `NOTES.md` summarises what
was taken from the AI, what was rewritten, and what was rejected.

## Run it

```bash
npm install
npm run mock     # terminal 1 — forced-outcome API on :8787
npm run dev      # terminal 2 — harness on :5173
npm run check    # price-math assertions
```

The harness has two dropdowns — what to render, and which failure to force. The
`breakpoints` views put the real thing in iframes at 1280 / 834 / 390px, because
CSS media queries respond to the viewport rather than to a container: a 390px-wide
`<div>` would still report the desktop width and quietly render three columns.

## What goes into Framer

Pasted as-is. Nothing needs editing:

| File | Role |
| --- | --- |
| `src/SkillpathCourses.tsx` | the graded component, property controls, stylesheet |
| `src/useCourses.ts` | reducer + data loading |
| `src/client.ts` | the only place this project calls the network |
| `src/skillpath.ts` | typed endpoints + response validation |
| `src/format.ts` | price formatting, currency inference |
| `src/theme.ts` | design tokens shared by every section |
| `src/doodles.tsx` | inline SVG illustrations |
| `src/SkillpathHero.tsx` | hero |
| `src/SkillpathFooter.tsx` | footer |
| `src/Skillpath404.tsx` | 404 page |

`src/framer-shim.ts`, `src/App.tsx`, `src/main.tsx` and `dev/` are local only.
Vite aliases the `framer` import to the shim so the component files are identical
in both places.

### The harness is deliberate, not leftovers

`dev/mock-api.mjs` and `src/App.tsx` never reach Framer, and they are checked in on
purpose. The live API fails at random on about one request in three, which means
the error and empty states cannot be reproduced on demand against it — they can't
be built with any confidence, and they can't be re-checked after a change. The mock
forces a chosen outcome per endpoint so every state is verified deliberately rather
than by refreshing until the right failure happens to appear.

`dev/check-format.mjs` is here for the same reason: wrong price formatting is an
automatic rejection, so it is asserted rather than eyeballed.

## Design

The visual language is drawn from the wariCrew site — black and white with a
single amber accent, oversized geometric headlines, rounded panels rather than
full-bleed bands, eyebrow pills that label each section, and hand-drawn line art.
The layout, the type scale and every illustration here are original; what's
borrowed is the vocabulary, not the page.

Two decisions worth naming:

- **Amber is always a fill, never a foreground.** Amber text on white fails
  contrast, so the accent appears as a background with ink on top of it — the
  refundable badge, the currency toggle, the primary button.
- **The marker stroke is the one repeated flourish.** It sits under the hero's
  second sentence and sweeps in under a course name on hover. Everything else
  stays quiet so it reads as deliberate rather than decorative.

Illustrations carry the states that usually feel broken — a parted cable for a
failed request, an open box for an empty catalogue, an empty lens for a search
that matched nothing, a signpost for the 404. Each pairs with a plain statement
of what happened and exactly one thing to do next.

## The decisions worth asking about

**Price math.** Both prices arrive in minor units. 199900 paise ÷ 100 = ₹1,999.
`Intl.NumberFormat` does the Indian digit grouping (₹1,25,000, not ₹125,000),
which is the part hand-rolled string formatting gets wrong.

**No request headers.** A GET with no custom headers is a CORS *simple request*,
so the browser sends it directly. Adding something like `Content-Type` would make
it non-simple and trigger a preflight `OPTIONS`, which this API answers with 405.
Verified in DevTools: only GET, no OPTIONS.

**`res.ok` is checked explicitly.** `fetch` resolves on 404 and 500 — the failure
body (`{"detail":"gg"}`) arrives as a perfectly valid JSON response. Without the
check it would be rendered as the course array.

**Two retries, visible.** The API fails ~1 request in 3. One retry takes effective
failure to ~11%, two to ~4%. Retrying forever would replace an honest error state
with a spinner that never resolves, so it stops after three attempts and hands the
user a button. Observed in production: both endpoints returned 503 on a cold start
and recovered on the retry.

**`Promise.allSettled`, not `all`.** The two endpoints fail independently. A dead
region lookup must not take down a healthy catalogue.

**Currency fallback.** When `/country-code` fails, the currency is inferred from
the device time zone — the only region signal that needs no second network call,
because a fallback that can itself fail is not a fallback. It is a guess (a VPN or
a traveller reads wrong), so the UI says it guessed and offers a ₹/$ toggle.

**No component library.** A Framer code component has no build step, so Tailwind
and anything built on it can't run. Nothing here needs a primitive a library would
provide — the hard parts are a grid, a line clamp, and a keyframe.

**Media queries, not `window.innerWidth`.** Measuring width into state misreports
on the Framer canvas and on first paint.

**`useReducer`, not a store.** One status at a time, as a tagged union, so
`loading` and `error` can't both be true. A reducer plus typed actions is also the
shape a store takes, so moving to Zustand later moves a function.

## States

| State | Trigger | What the user sees |
| --- | --- | --- |
| Loading | any load | six skeleton cards; a cold-start note after 4s |
| Error | courses request exhausted its retries | what failed + **Try again** |
| Empty (API) | `[]` returned | "No courses published yet" + **Refresh** |
| Empty (filter) | search matches nothing | "No courses match your search" + **Clear search** |
| Ready | courses returned | the grid |

The two empty states are deliberately separate. They have different causes and
need different ways out.

## Verified

- Price math asserted, including the lakh-grouping case (`npm run check`)
- All four states forced through the mock
- Country-only failure → cards still render, notice shown, toggle works
- 3 / 2 / 1 columns at 1280 / 834 / 390
- Ragged last rows at 5 and 9 cards
- Only GET requests, no OPTIONS
- Live API: 503 → retry → 200, no visible disruption
- Keyboard focus visible; `aria-live` announces state changes;
  `prefers-reduced-motion` disables the shimmer
- Hero and footer stack cleanly at 834 and 390; the hero drawing drops below the
  copy rather than pushing the button off the first screen
