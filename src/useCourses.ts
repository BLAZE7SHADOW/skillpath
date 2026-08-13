/**
 * All state for the courses section lives here, as a reducer.
 *
 * A reducer rather than a handful of useState calls for two reasons. First, the
 * section has one status at a time — loading, error, empty, or ready — and a
 * single tagged field makes the impossible combinations (loading *and* error)
 * unrepresentable. Second, a reducer plus typed actions is the same shape a store
 * takes, so moving this into Zustand or Redux later is moving a function rather
 * than rewriting the component.
 */

import { useCallback, useEffect, useReducer, useRef } from "react"
import { getCountryCode, getCourses, type Course } from "./skillpath.ts"
import { MAX_ATTEMPTS, isApiError, type ApiError } from "./client.ts"
import {
    CURRENCY_BY_COUNTRY,
    inferCurrencyFromDevice,
    type Currency,
} from "./format.ts"

/** "empty" is the API returning zero courses. A search matching nothing is a
 *  different situation with different wording, and is handled in the component
 *  from the derived list — it is deliberately not a status here. */
export type Status = "loading" | "error" | "empty" | "ready"

/** Where the displayed currency came from. Drives whether the section admits to
 *  having guessed. */
export type CurrencySource = "api" | "inferred" | "user"

export type CoursesState = {
    status: Status
    courses: Course[]
    error: ApiError | null
    /** Which attempt is in flight, for "Retrying 2 of 3". */
    attempt: number
    currency: Currency
    currencySource: CurrencySource
    /** Set once a load has been running long enough to be worth explaining. */
    isSlow: boolean
}

type Action =
    | { type: "load-started" }
    | { type: "retrying"; attempt: number }
    | { type: "slow-detected" }
    | { type: "courses-loaded"; courses: Course[] }
    | { type: "courses-failed"; error: ApiError }
    | { type: "country-resolved"; currency: Currency }
    | { type: "country-failed" }
    | { type: "currency-chosen"; currency: Currency }

const initialState: CoursesState = {
    status: "loading",
    courses: [],
    error: null,
    attempt: 1,
    // Start from the device guess so a price is never rendered as a bare number
    // while the region call is still in flight.
    currency: inferCurrencyFromDevice(),
    currencySource: "inferred",
    isSlow: false,
}

export function coursesReducer(state: CoursesState, action: Action): CoursesState {
    switch (action.type) {
        case "load-started":
            return { ...state, status: "loading", error: null, attempt: 1, isSlow: false }

        case "retrying":
            return { ...state, attempt: action.attempt }

        case "slow-detected":
            return { ...state, isSlow: true }

        case "courses-loaded":
            return {
                ...state,
                status: action.courses.length === 0 ? "empty" : "ready",
                courses: action.courses,
                error: null,
                isSlow: false,
            }

        case "courses-failed":
            return { ...state, status: "error", error: action.error, courses: [], isSlow: false }

        case "country-resolved":
            // A user who has already picked a currency keeps their choice; a late
            // response should not silently swap the prices under them.
            if (state.currencySource === "user") return state
            return { ...state, currency: action.currency, currencySource: "api" }

        case "country-failed":
            // Courses are unaffected. Keep the device-inferred currency and mark it
            // as a guess so the UI can say so.
            if (state.currencySource === "user") return state
            return { ...state, currencySource: "inferred" }

        case "currency-chosen":
            return { ...state, currency: action.currency, currencySource: "user" }

        default:
            return state
    }
}

/** How long a load may run before the UI explains the delay. The API's host
 *  sleeps when idle, so the first request of a session is often slow for a
 *  reason worth telling the user about. */
const SLOW_THRESHOLD_MS = 4_000

export function useCourses(baseUrl: string) {
    const [state, dispatch] = useReducer(coursesReducer, initialState)

    // Identifies the current load, so a stale in-flight request that resolves
    // after a retry was triggered cannot overwrite the newer result.
    const loadId = useRef(0)
    const abortRef = useRef<AbortController | null>(null)

    const load = useCallback(() => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const id = ++loadId.current
        const isCurrent = () => id === loadId.current && !controller.signal.aborted

        dispatch({ type: "load-started" })

        const slowTimer = setTimeout(() => {
            if (isCurrent()) dispatch({ type: "slow-detected" })
        }, SLOW_THRESHOLD_MS)

        const options = {
            signal: controller.signal,
            onRetry: (attempt: number) => {
                if (isCurrent()) dispatch({ type: "retrying", attempt })
            },
        }

        // allSettled, not all: the two endpoints fail independently, and a dead
        // region lookup must not take down a healthy catalogue. This is the whole
        // reason the currency has a fallback at all.
        void Promise.allSettled([
            getCourses(baseUrl, options),
            getCountryCode(baseUrl, options),
        ]).then(([coursesResult, countryResult]) => {
            clearTimeout(slowTimer)
            if (!isCurrent()) return

            if (countryResult.status === "fulfilled") {
                dispatch({
                    type: "country-resolved",
                    currency: CURRENCY_BY_COUNTRY[countryResult.value],
                })
            } else {
                dispatch({ type: "country-failed" })
            }

            if (coursesResult.status === "fulfilled") {
                dispatch({ type: "courses-loaded", courses: coursesResult.value })
            } else {
                const reason = coursesResult.reason
                dispatch({
                    type: "courses-failed",
                    error: isApiError(reason)
                        ? reason
                        : { kind: "network", message: "Something went wrong loading courses." },
                })
            }
        })

        return () => {
            clearTimeout(slowTimer)
            controller.abort()
        }
    }, [baseUrl])

    useEffect(() => {
        const cleanup = load()
        // Framer remounts components constantly while editing, so an in-flight
        // request must be cancelled on unmount or it will resolve into a
        // component that no longer exists.
        return cleanup
    }, [load])

    const setCurrency = useCallback((currency: Currency) => {
        dispatch({ type: "currency-chosen", currency })
    }, [])

    return { state, retry: load, setCurrency, maxAttempts: MAX_ATTEMPTS }
}
