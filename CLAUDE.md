# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install     # install dependencies (single dependency: express)
npm start       # run the server at http://localhost:3000
npm run dev     # run with --watch (auto-restarts on file changes)
```

There is no build step, lint script, or test suite in this project.

## Architecture

Express server (`server.js`) serving a vanilla JS/HTML/CSS frontend (`public/`) and a small JSON API (`src/routes/api.js`), backed by a static course list (`data/courses.json`).

Request flow: the frontend (`public/app.js`) posts a lat/lng (from geolocation or manual entry), date, player count, and radius to `GET /api/tee-times/search`. The route filters `data/courses.json` to nearby courses using Haversine distance (`src/lib/geo.js`), then fetches tee times for each nearby course in parallel.

**Tee-time data is real, not mocked**, fetched live from the Mecklenburg County Golf booking backend (GolfNow/TeeItUp) via `src/lib/teeItUpClient.js`. This is the same undocumented backend the public booking widget at meckcountygolf.com calls directly from the browser — there is no published/stable API for it, so it could change or break without notice. Key details baked into `teeItUpClient.js`:
- `x-be-alias: multicourse-booking-engine` header is required by the API and was found by decompiling the booking widget's minified JS bundle — it is not documented anywhere.
- `greenFeeCart`/`greenFeeWalking` in the API response are the actual per-player price (cents); `dueOnlineRiding`/`dueOnlineWalking` are what's charged online *now* (often 0, meaning pay at the course) — don't use the `dueOnline*` fields as the price.
- Tee times come back as UTC and are converted to `America/New_York` for display.

Only courses with a `facilityId` in `data/courses.json` get live data — that ID is the `course=` query param in that course's TeeItUp booking-widget URL (e.g. `...book.teeitup.com/teetimes?course=1557`). A course on a different booking platform needs its own fetcher matching the same shape: `fetchTeeTimes(course, date, players) => teeTimeSlot[]`. If a course's fetch fails, the route catches it per-course and returns `{ teeTimes: [], error }` for that course rather than failing the whole search (see `src/routes/api.js`).

Each returned tee-time slot links to `course.bookingUrl` (the real TeeItUp booking page for that course) — this app only searches/displays live availability, it does not complete bookings itself.
