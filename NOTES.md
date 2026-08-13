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

**Claude Code (the command-line tool).** The full session log is in this repo:
[`AI-TRANSCRIPT.md`](./AI-TRANSCRIPT.md) — every message, unedited.

Claude Code stores sessions on your own machine and has no public share link; that
feature belongs to the claude.ai website. Rather than send a summary, which you
asked us not to do, I've committed the whole conversation.

It checked the API before writing any code, which turned up two things the brief
doesn't mention. Failed requests come back looking like normal successful ones, so
you have to check the status yourself or you end up showing the error text as if it
were a course. And adding a header to the request would make the browser send an
extra check first, which this API rejects — so the request has to stay bare.

I turned down two of its suggestions. It wanted a layer of plumbing between the app
and the two API calls, which was more structure than two calls need. And it wanted
to look up my location from my IP address as the backup when the country call fails
— that means making a third request that can also fail, to recover from one that
already did. I used the device's time zone instead, which needs no internet at all.

The transcript also shows the parts that went badly, including Framer refusing my
files until I fixed how the imports were written. I found that by hitting the error,
not by knowing it.
