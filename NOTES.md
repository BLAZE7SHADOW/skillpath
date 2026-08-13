# Note

> **Draft — rewrite this in your own words before submitting.** It is scored on
> how you think and how honest you are, and it has to be true of *your* build.
> Cut anything you wouldn't say out loud on the call.

**What I'd fix with two more days.** Cache the catalogue so a Framer remount
doesn't refetch. Swap fixed backoff for exponential with jitter — 400/900ms is
fine for one client, not for many. Write tests for the reducer, not just the
price assertions.

**Where I got stuck.** Responsiveness. My first version read `window.innerWidth`
into state; on the Framer canvas it reported the wrong width and rendered three
columns at phone size. Media queries in an injected stylesheet fixed it.

The harder one was what to show when `/country-code` fails but the catalogue
loads. I infer the currency from the device time zone, say in the UI that I
guessed, and offer a ₹/$ switch. A disclosed guess beats a hidden one, and an IP
lookup would have meant a third request that can also fail.

**What I'm not happy with.** Each section injects its own `<style>`, so tokens are
duplicated when several are on a page — self-contained, which Framer needs, but
not clean. Skeleton count is fixed at six while the real count is 5–10, so there's
a small reflow. Search ignores descriptions.

*(198 words)*

---

## AI use — fill this in yourself

Required, and they will check it against the chat link. Be specific about which
parts you took, which you rewrote, and which you rejected. Something like:

> I used Claude throughout. It probed the API first, which turned up things the
> brief doesn't say: failures come back as 404/500 with a JSON body, so `fetch`
> doesn't throw and `res.ok` has to be checked explicitly; and a GET with custom
> headers would trigger a preflight OPTIONS that the API answers with 405. It
> drafted the client and the reducer. I pushed back on two suggestions — a
> middleware pipeline for two GET endpoints, which was abstraction I didn't need,
> and using an IP geolocation service as the currency fallback, which would have
> added a third request that can fail as the recovery path for one that already
> did. The decisions on retry count, the currency fallback, and the two property
> controls were mine.

**Only write what's actually true.** On the call they will point at a random line
and ask why it's written that way, and "the AI wrote that" ends the interview.
Read `README.md` — every non-obvious decision has its reasoning next to it.
