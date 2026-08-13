/**
 * The single place this project talks to the network.
 *
 * Everything that can go wrong with a request is handled here — status checks,
 * timeouts, cancellation, retries, JSON parsing — and leaves as one typed error
 * shape. Callers get data or an ApiError, and never write fetch logic twice.
 *
 * This is also the seam for anything added later: auth headers, logging, or a
 * cache all go in `request`, and nothing above it changes.
 */

/**
 * Failure kinds are distinguished because the UI says something different for
 * each. A timeout on a cold server is not the same event as a 500, and telling
 * the user "the server is waking up" beats "something went wrong".
 */
export type ApiError =
    | { kind: "http"; status: number; message: string }
    | { kind: "network"; message: string }
    | { kind: "timeout"; message: string }
    | { kind: "parse"; message: string }

export function isApiError(value: unknown): value is ApiError {
    return typeof value === "object" && value !== null && "kind" in value
}

/**
 * The API is hosted on a free tier that sleeps. A warm response is ~350ms, but
 * the first request after an idle period can take far longer while the server
 * boots. 12s per attempt across 3 attempts leaves ~36s of total budget, which
 * covers a cold start without letting a genuinely dead request hang forever.
 */
const TIMEOUT_MS = 12_000

/**
 * Two retries, not more.
 *
 * The API fails roughly 1 request in 3, at random. One retry takes the effective
 * failure rate to about 11%, two to about 4%. Past that the returns are small,
 * and retrying forever would replace an honest error state with a spinner that
 * never resolves — the user would have no idea anything was wrong, and no way to
 * act. So it gives up after three attempts and hands control back with a button.
 *
 * Fixed backoff rather than exponential with jitter: with a single client and a
 * failure that is random rather than load-related, spacing attempts further apart
 * would only make the page slower to recover.
 */
const RETRY_DELAYS_MS = [400, 900]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function attempt(url: string, signal: AbortSignal): Promise<unknown> {
    // Its own controller, so a timeout aborts only this attempt, while the
    // caller's signal (unmount) still cancels the whole operation.
    const timeoutController = new AbortController()
    const timer = setTimeout(() => timeoutController.abort(), TIMEOUT_MS)
    const onCallerAbort = () => timeoutController.abort()
    signal.addEventListener("abort", onCallerAbort)

    let response: Response
    try {
        // No headers, deliberately. A GET with no custom headers is a CORS
        // "simple request", so the browser sends it directly. Adding something
        // like Content-Type would make it non-simple and trigger a preflight
        // OPTIONS — which this API answers with 405, breaking every request.
        response = await fetch(url, { method: "GET", signal: timeoutController.signal })
    } catch (error) {
        // The caller cancelling is not a failure; let it propagate untouched so
        // the hook can tell "component unmounted" apart from "request failed".
        if (signal.aborted) throw error

        if (timeoutController.signal.aborted) {
            throw { kind: "timeout", message: "The server took too long to respond." } as ApiError
        }
        throw {
            kind: "network",
            message: error instanceof Error ? error.message : "Network request failed.",
        } as ApiError
    } finally {
        clearTimeout(timer)
        signal.removeEventListener("abort", onCallerAbort)
    }

    // fetch only rejects on network faults — a 404 or 500 arrives as a resolved
    // response. Without this check the error body ({"detail":"gg"}) would be
    // parsed as valid data and rendered.
    if (!response.ok) {
        throw {
            kind: "http",
            status: response.status,
            message: `Request failed with status ${response.status}.`,
        } as ApiError
    }

    try {
        return await response.json()
    } catch {
        throw { kind: "parse", message: "The server sent a response we couldn't read." } as ApiError
    }
}

/** True for failures worth retrying — which here is all of them, since every
 *  error this API produces is the injected random kind rather than a real fault. */
function isRetryable(error: ApiError): boolean {
    return error.kind !== "parse"
}

export type RequestOptions = {
    signal: AbortSignal
    /** Called before each retry, so the UI can show which attempt is running. */
    onRetry?: (attemptNumber: number) => void
}

/**
 * Fetches `url` and returns the parsed JSON, retrying transient failures.
 * Throws an ApiError, or the caller's AbortError if the request was cancelled.
 */
export async function request(url: string, options: RequestOptions): Promise<unknown> {
    const totalAttempts = RETRY_DELAYS_MS.length + 1
    let lastError: ApiError | undefined

    for (let i = 0; i < totalAttempts; i++) {
        try {
            return await attempt(url, options.signal)
        } catch (error) {
            if (options.signal.aborted) throw error
            if (!isApiError(error)) throw error

            lastError = error
            const isLastAttempt = i === totalAttempts - 1
            if (isLastAttempt || !isRetryable(error)) break

            await sleep(RETRY_DELAYS_MS[i])
            if (options.signal.aborted) throw new DOMException("Aborted", "AbortError")
            options.onRetry?.(i + 2)
        }
    }

    throw lastError
}

/** How many attempts a single request makes. Used for "Retrying 2 of 3". */
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1
