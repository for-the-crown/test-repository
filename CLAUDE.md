# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                       # install dependencies (single dependency: express)
npm start                         # run the Express dev server at http://localhost:3000
npm run dev                       # same, with --watch (auto-restarts on file changes)
cd public && python3 -m http.server 8080   # run as pure static site (matches GitHub Pages), at http://localhost:8080
```

There is no build step, lint script, or test suite in this project.

## Architecture

The app is fully static and runs entirely client-side — `public/` is deployed as-is to GitHub Pages via `.github/workflows/pages.yml`. An Express server (`server.js`, `src/routes/api.js`, `src/lib/`) also exists purely for local dev convenience and mirrors the same logic server-side; it is not part of the deployed site.

Request flow (identical in both the browser and the Express server): given a lat/lng (from geolocation or manual entry), date, player count, and radius, filter `public/courses.json` to nearby courses using Haversine distance (`geo.js`), then fetch live tee times for each nearby course in parallel from the TeeItUp API (`teeItUpClient.js`).

- Browser copy: `public/app.js` (orchestration + rendering), `public/geo.js`, `public/teeItUpClient.js` — loaded as ES modules directly by `public/index.html`, no bundler.
- Server copy: `src/routes/api.js` exposes `GET /api/courses/nearby` and `GET /api/tee-times/search`, using `src/lib/geo.js` and `src/lib/teeItUpClient.js` (CommonJS).
- These are two independent copies of the same logic, not shared code — kept duplicated deliberately so the static site needs no build step. **A fix to the tee-time fetching/parsing logic must be made in both `public/teeItUpClient.js` and `src/lib/teeItUpClient.js`** (same for `geo.js`).

**Tee-time data is real, not mocked**, fetched live from the Mecklenburg County Golf booking backend (GolfNow/TeeItUp). This is the same undocumented backend the public booking widget at meckcountygolf.com calls directly from the browser — there is no published/stable API for it, so it could change or break without notice. It also returns `Access-Control-Allow-Origin: *`, which is what makes calling it directly from a static site's browser JS possible. Key details baked into both `teeItUpClient.js` copies:
- `x-be-alias: multicourse-booking-engine` header is required by the API and was found by decompiling the booking widget's minified JS bundle — it is not documented anywhere.
- `greenFeeCart`/`greenFeeWalking` in the API response are the actual per-player price (cents); `dueOnlineRiding`/`dueOnlineWalking` are what's charged online *now* (often 0, meaning pay at the course) — don't use the `dueOnline*` fields as the price.
- Tee times come back as UTC and are converted to `America/New_York` for display.

Only courses with a `facilityId` in `public/courses.json` get live data — that ID is the `course=` query param in that course's TeeItUp booking-widget URL (e.g. `...book.teeitup.com/teetimes?course=1557`). A course on a different booking platform needs its own fetcher matching the same shape: `fetchTeeTimes(course, date, players) => teeTimeSlot[]`. If a course's fetch fails, the caller catches it per-course and returns `{ teeTimes: [], error }` for that course rather than failing the whole search.

Each returned tee-time slot links to `course.bookingUrl` (the real TeeItUp booking page for that course) — this app only searches/displays live availability, it does not complete bookings itself.

Because Pages serves this as a project site (e.g. `username.github.io/test-repository/`, not domain root), all asset references in `public/index.html` and imports in `public/app.js` must stay relative (`./foo.js`), never root-absolute (`/foo.js`).
