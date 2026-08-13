/**
 * Pure formatting and inference helpers. No React, no network — so they can be
 * checked directly (see dev/check-format.mjs).
 */

export type Currency = "INR" | "USD"

/** The two country codes the API can return. */
export type CountryCode = "IN" | "US"

export const CURRENCY_BY_COUNTRY: Record<CountryCode, Currency> = {
    IN: "INR",
    US: "USD",
}

/**
 * Both prices arrive in the currency's minor unit — paise for INR, cents for USD.
 * So 199900 is not 1,99,900 rupees, it is 1,999 rupees. Dividing by 100 is the
 * whole trick, and getting it wrong is the single most visible bug on the page.
 */
const MINOR_UNITS_PER_MAJOR = 100

type Priced = { pricePaise: number; priceUsdCents: number }

/**
 * Intl handles the parts that are easy to get subtly wrong by hand: the rupee
 * groups in lakhs (1,00,000) rather than thousands (100,000), and the symbol
 * position per locale. Hand-rolled string concatenation is what produces the
 * "₹1,99,900" that the brief calls out as an instant fail.
 *
 * Fraction digits are pinned to 0 for INR and 2 for USD because that is how each
 * is actually written on a storefront — ₹1,999, not ₹1,999.00; $39.99, not $40.
 */
export function formatPrice(course: Priced, currency: Currency): string {
    if (currency === "INR") {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(course.pricePaise / MINOR_UNITS_PER_MAJOR)
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(course.priceUsdCents / MINOR_UNITS_PER_MAJOR)
}

/** Sort key in minor units, so comparisons never cross currencies. */
export function priceInMinorUnits(course: Priced, currency: Currency): number {
    return currency === "INR" ? course.pricePaise : course.priceUsdCents
}

const INDIA_TIME_ZONES = new Set(["Asia/Kolkata", "Asia/Calcutta"])

/**
 * Fallback for when /country-code fails.
 *
 * The device's own time zone is the only region signal available without making
 * another network call — and a fallback that can itself fail is not a fallback.
 * (An IP geolocation service would add a third request with its own error rate
 * and rate limits, as the recovery path for a request that already failed.)
 *
 * This is a guess, not a fact: a traveller or a VPN will read wrong. So the UI
 * says the currency was inferred and offers a switch, rather than presenting it
 * as detected.
 */
export function inferCurrencyFromDevice(): Currency {
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (zone && INDIA_TIME_ZONES.has(zone)) return "INR"
        // Older engines may report no time zone; language is a weaker second signal.
        if (!zone && typeof navigator !== "undefined") {
            return navigator.language?.endsWith("-IN") ? "INR" : "USD"
        }
        return "USD"
    } catch {
        // Intl is available everywhere Framer runs, but a throw here must not
        // take down the section over something as cosmetic as a currency symbol.
        return "USD"
    }
}
