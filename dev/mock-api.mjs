/**
 * LOCAL TEST SERVER — NOT PART OF THE APPLICATION.
 *
 * Nothing in this file is bundled, imported by, or reachable from the component.
 * The course objects below are fixtures for testing only; the app itself ships no
 * course data and no fallback list. See src/api/skillpath.ts, the single place
 * course data enters the app, and only ever over the network.
 *
 * Why this exists: the real API fails on ~1 in 3 requests, at random. That makes
 * the error and empty states impossible to reproduce on demand, so they can't be
 * built or checked with any confidence. This server forces a chosen outcome per
 * endpoint so every state can be verified deliberately.
 *
 *   node dev/mock-api.mjs
 *
 * URL shape — the mode for each endpoint is part of the base URL, so the harness
 * can point the component at it without changing any component code:
 *
 *   http://localhost:8787/m/<coursesMode>/<countryMode>/assignment/course-data
 *
 * Modes: ok | error | empty | slow | flaky
 *   ok     200 with a random 5-9 courses (mirrors the real varying count)
 *   error  alternates 404 and 500, with the real API's JSON error body
 *   empty  200 with []
 *   slow   200 after 6s, to exercise the cold-start warning
 *   flaky  like the real thing: ~1 in 3 requests fail
 */

import { createServer } from "node:http"

const PORT = 8787

// Fixture data. Shaped from real responses observed on the live API.
// This lives in the mock, never in the component — the component has no
// fallback data and renders nothing it didn't fetch.
const COURSES = [
    {
        courseName: "How To YouTube",
        courseCode: "how-to-youtube",
        description:
            "From concept to creation, learn how to build, grow, and monetize a YouTube channel using practical systems and real-world execution.",
        mainCategory: "Content Creation",
        shortCourse: "YouTube",
        courseType: "Original",
        pricePaise: 199900,
        priceUsdCents: 3999,
        mangoId: "a1b2c3d4e5f6789012345678",
        refundable: true,
    },
    {
        courseName: "Instagram Growth Lab",
        courseCode: "instagram-growth-lab",
        description:
            "Build an Instagram presence that compounds. Hooks, formats, posting cadence, and the analytics that actually predict growth.",
        mainCategory: "Social Media",
        shortCourse: "Instagram",
        courseType: "Original",
        pricePaise: 149900,
        priceUsdCents: 2999,
        mangoId: "b2c3d4e5f6789012345678a1",
        refundable: true,
    },
    {
        courseName: "Podcast Launchpad",
        courseCode: "podcast-launchpad",
        description:
            "Plan, record, edit, and publish a podcast people finish. Covers gear on a budget, interview craft, and distribution.",
        mainCategory: "Audio",
        shortCourse: "Podcast",
        courseType: "Original",
        pricePaise: 179900,
        priceUsdCents: 3499,
        mangoId: "c3d4e5f6789012345678a1b2",
        refundable: true,
    },
    {
        courseName: "Freelance Client OS",
        courseCode: "freelance-client-os",
        description:
            "Find clients, price your work, and run projects without chaos. Proposals, contracts, and the follow-up system behind repeat work.",
        mainCategory: "Business",
        shortCourse: "Freelance",
        courseType: "Workshop",
        pricePaise: 99900,
        priceUsdCents: 1999,
        mangoId: "d4e5f6789012345678a1b2c3",
        refundable: false,
    },
    {
        courseName: "Notion Second Brain",
        courseCode: "notion-second-brain",
        description:
            "Turn scattered notes into a system you trust. Capture, organise, and retrieve everything you read, watch, and think.",
        mainCategory: "Productivity",
        shortCourse: "Notion",
        courseType: "Workshop",
        pricePaise: 79900,
        priceUsdCents: 1499,
        mangoId: "e5f6789012345678a1b2c3d4",
        refundable: true,
    },
    {
        courseName: "Email Marketing Craft",
        courseCode: "email-marketing-craft",
        description:
            "Write emails people open. List building, sequences that convert, and the metrics worth watching week to week.",
        mainCategory: "Marketing",
        shortCourse: "Email",
        courseType: "Original",
        pricePaise: 129900,
        priceUsdCents: 2499,
        mangoId: "f6789012345678a1b2c3d4e5",
        refundable: true,
    },
    {
        courseName: "Short-Form Editing Bootcamp",
        courseCode: "short-form-editing-bootcamp",
        description:
            "Cut reels and shorts that hold attention. Pacing, captions, sound design, and a repeatable editing workflow.",
        mainCategory: "Video Editing",
        shortCourse: "Editing",
        courseType: "Workshop",
        pricePaise: 159900,
        priceUsdCents: 3199,
        mangoId: "789012345678a1b2c3d4e5f6",
        refundable: false,
    },
    {
        courseName: "Personal Brand Foundations",
        courseCode: "personal-brand-foundations",
        description:
            "Decide what you want to be known for, then say it consistently. Positioning, voice, and a publishing rhythm you can keep.",
        mainCategory: "Branding",
        shortCourse: "Brand",
        courseType: "Original",
        pricePaise: 119900,
        priceUsdCents: 2299,
        mangoId: "89012345678a1b2c3d4e5f67",
        refundable: true,
    },
    {
        courseName: "Creator Analytics",
        courseCode: "creator-analytics",
        description:
            "Read your numbers without guessing. Which metrics matter per platform, and what to change when they move.",
        mainCategory: "Analytics",
        shortCourse: "Analytics",
        courseType: "Workshop",
        pricePaise: 89900,
        priceUsdCents: 1799,
        mangoId: "9012345678a1b2c3d4e5f678",
        refundable: false,
    },
]

// The real API's error bodies, verbatim — so the client is tested against
// what it will actually receive, not a sanitised version.
const ERROR_BODIES = [
    { status: 404, body: { detail: "gg" } },
    { status: 500, body: { detail: "maybe turn it on and off?" } },
    { status: 404, body: { detail: "this aint working dawg" } },
]
let errorCursor = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function send(res, status, payload) {
    const body = JSON.stringify(payload)
    res.writeHead(status, {
        "content-type": "application/json",
        // Matches the real API, which allows any origin.
        "access-control-allow-origin": "*",
    })
    res.end(body)
}

function sendError(res) {
    const { status, body } = ERROR_BODIES[errorCursor % ERROR_BODIES.length]
    errorCursor++
    send(res, status, body)
}

/** Random 5-9 courses, mirroring the real API's varying count. */
function sampleCourses() {
    const count = 5 + Math.floor(Math.random() * 5)
    return COURSES.slice(0, count)
}

async function respond(res, mode, payloadFactory) {
    switch (mode) {
        case "error":
            return sendError(res)
        case "empty":
            return send(res, 200, [])
        case "slow":
            await sleep(6000)
            return send(res, 200, payloadFactory())
        case "flaky":
            if (Math.random() < 1 / 3) return sendError(res)
            return send(res, 200, payloadFactory())
        default:
            return send(res, 200, payloadFactory())
    }
}

const server = createServer(async (req, res) => {
    // Only GET is supported, exactly like the real API.
    if (req.method !== "GET") {
        return send(res, 405, { detail: "method not allowed" })
    }

    const url = new URL(req.url, `http://localhost:${PORT}`)
    const parts = url.pathname.split("/").filter(Boolean)

    // Two accepted shapes:
    //   /m/<coursesMode>/<countryMode>/assignment/<endpoint>   modes chosen
    //   /assignment/<endpoint>                                 both default to "ok"
    let coursesMode = "ok"
    let countryMode = "ok"
    if (parts[0] === "m") {
        coursesMode = parts[1] ?? "ok"
        countryMode = parts[2] ?? "ok"
        parts.splice(0, 3)
    }
    const endpoint = parts[1] // parts is now ["assignment", "<endpoint>"]

    if (endpoint === "course-data") {
        return respond(res, coursesMode, sampleCourses)
    }
    if (endpoint === "country-code") {
        // Flips between IN and US on each call, like the real one.
        return respond(res, countryMode, () => ({
            country_code: Math.random() < 0.5 ? "IN" : "US",
        }))
    }

    send(res, 404, { detail: "no such endpoint" })
})

server.listen(PORT, () => {
    console.log(`mock api  →  http://localhost:${PORT}/m/<courses>/<country>/assignment/...`)
    console.log(`modes     →  ok | error | empty | slow | flaky`)
})
