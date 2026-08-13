/**
 * Typed access to the two Skillpath endpoints.
 *
 * Each method validates the shape of what came back before returning it. The API
 * answers failures with a JSON body ({"detail": "gg"}), so a response that parsed
 * successfully is not yet proof it is the data we asked for. Validating here means
 * a malformed payload becomes a handled error state instead of a render crash.
 */

import { request, type RequestOptions, type ApiError } from "./client.ts"
import type { CountryCode } from "./format.ts"

export type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

/** The live API. A base URL is configuration, not data — the course list itself
 *  is always fetched, never bundled. */
export const DEFAULT_BASE_URL = "https://syncsphere-hiv6.onrender.com"

const parseError = (message: string): ApiError => ({ kind: "parse", message })

/** Narrow enough to catch an error body, loose enough to survive the API adding
 *  fields later. Only what a card actually reads is required. */
function isCourse(value: unknown): value is Course {
    if (typeof value !== "object" || value === null) return false
    const c = value as Record<string, unknown>
    return (
        typeof c.courseName === "string" &&
        typeof c.description === "string" &&
        typeof c.mainCategory === "string" &&
        typeof c.pricePaise === "number" &&
        typeof c.priceUsdCents === "number"
    )
}

export async function getCourses(baseUrl: string, options: RequestOptions): Promise<Course[]> {
    const data = await request(`${baseUrl}/assignment/course-data`, options)

    if (!Array.isArray(data)) {
        throw parseError("The catalogue didn't come back as a list of courses.")
    }

    // Drop malformed entries rather than failing the whole grid: eight good
    // courses and one broken one should still show eight courses.
    const courses = data.filter(isCourse)

    // But if everything was malformed while the array was not empty, that is a
    // real problem and should surface as an error, not as an empty catalogue.
    if (courses.length === 0 && data.length > 0) {
        throw parseError("The catalogue came back in a format we don't recognise.")
    }

    return courses
}

export async function getCountryCode(
    baseUrl: string,
    options: RequestOptions
): Promise<CountryCode> {
    const data = await request(`${baseUrl}/assignment/country-code`, options)

    const code = (data as { country_code?: unknown } | null)?.country_code
    if (code !== "IN" && code !== "US") {
        throw parseError("The region service sent a country we don't handle.")
    }

    return code
}
