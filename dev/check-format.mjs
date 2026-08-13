/**
 * Assertions for the price math.
 *
 * The brief calls wrong price formatting an automatic rejection, so this runs
 * before any UI exists and stays runnable:  npm run check
 *
 * Node strips the TypeScript types, so the real module is under test — not a copy.
 */

import assert from "node:assert/strict"
import { formatPrice, priceInMinorUnits, inferCurrencyFromDevice } from "../src/format.ts"

const youtube = { pricePaise: 199900, priceUsdCents: 3999 }
const notion = { pricePaise: 79900, priceUsdCents: 1499 }

// The exact case the brief warns about: 199900 paise is ₹1,999 — not ₹1,99,900.
assert.equal(formatPrice(youtube, "INR"), "₹1,999")
assert.equal(formatPrice(youtube, "USD"), "$39.99")
assert.equal(formatPrice(notion, "INR"), "₹799")
assert.equal(formatPrice(notion, "USD"), "$14.99")

// Above ₹1,00,000 the Indian grouping differs from the Western one. Nothing in
// the catalogue is priced this high today, but this is the case hand-rolled
// formatting gets wrong, and it is why Intl is doing the work.
assert.equal(formatPrice({ pricePaise: 12500000, priceUsdCents: 0 }, "INR"), "₹1,25,000")

// Free courses must render as a price, not as an empty string or "₹0.00".
assert.equal(formatPrice({ pricePaise: 0, priceUsdCents: 0 }, "INR"), "₹0")
assert.equal(formatPrice({ pricePaise: 0, priceUsdCents: 0 }, "USD"), "$0.00")

// Sorting compares minor units so it never mixes rupees with dollars.
assert.equal(priceInMinorUnits(youtube, "INR"), 199900)
assert.equal(priceInMinorUnits(youtube, "USD"), 3999)

// The fallback must always produce a usable currency, never undefined.
assert.ok(["INR", "USD"].includes(inferCurrencyFromDevice()))

console.log("format checks passed")
