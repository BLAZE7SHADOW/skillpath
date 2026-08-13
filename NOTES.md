# Note

**What I'd fix with two more days**

The page asks the server for the courses every time it loads. It should remember
them. I'd also write proper tests, not just the one price check.

**Where I got stuck**

The layout. My first version measured the screen width in code to decide how many
columns to show. Inside Framer it kept reading the wrong width and put three columns
on a phone. I deleted it and let CSS decide — simpler, and correct.

The harder one wasn't code. There are two API calls and either can fail. If the one
that tells me your country fails but the courses load, what price do I show? I
guess from your device's time zone, say on the page that I guessed, and give you a
button to switch. A guess you admit to is fine. A guess you hide isn't.

**What I'm not happy with**

Each section loads its own copy of the styling. It works, but repeats itself. The
loading placeholder always shows six cards when the real number is five to ten, so
the page shifts when they arrive. And search only looks at names and categories,
not descriptions.

---

## What AI I used

**Claude Code — Anthropic's command-line tool.**

Full unedited session log: [`AI-TRANSCRIPT.md`](./AI-TRANSCRIPT.md)

Claude Code stores sessions on your own machine and has no public share link; that
feature belongs to the claude.ai website. Rather than send a summary, which you asked
us not to do, the entire conversation is committed to the repo.

**What it did.** Claude wrote the code. It also wrote the price checks and did the
verification — calling the live API repeatedly to catch real failures, testing all four
states against a local mock server, and checking the layout at each screen size.

**What I did.** I set the direction and made the calls it couldn't make for me.

- **Checked the API first.** Before any code, I had it call both endpoints over and
  over to see how they really behave. That found two things the brief doesn't mention.
  A failed request comes back looking like a normal one, so you have to check the
  status yourself or you'll show the error text as if it were a course. And putting a
  header on the request makes the browser send an extra check first, which this API
  rejects — so the request has to stay bare.

- **The currency fallback.** It gave me three options for when the country call fails.
  I chose guessing from the device's time zone, saying on the page that it's a guess,
  and giving the user a switch. I rejected its other idea — looking up my location from
  my IP address — because that's a third request that can also fail, to recover from
  one that already did.

- **The two property controls.** I picked the section heading and the accent colour,
  the things a designer actually wants to change, over the developer-facing options.

- **The extra field on the card.** I picked the category, because that's the first
  thing someone scanning a list of courses wants to know.

- **The look.** I asked for the page to be built in wariCrew's visual language rather
  than something generic.

- **What not to build.** It suggested adding a layer of plumbing between the app and
  the two API calls. I turned it down — that's more structure than two calls need.

- **What to ship.** I questioned whether the test tooling belonged in a public repo at
  all. I kept it once I was satisfied it shows how the error states were tested, rather
  than being clutter.

**What went wrong.** Framer refused the files until the imports were rewritten with file
extensions. We found that by hitting the error, not by knowing it. That's in the log too.
