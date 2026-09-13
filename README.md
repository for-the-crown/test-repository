# Local Tee Times

Search for available golf tee times at courses near you, filtered by date,
radius, and number of players.

## Status: MVP with real data

Location search → nearby courses → real, live tee-time listings. The course
list (`public/courses.json`) currently has two Mecklenburg County, NC courses
(Dr. Charles L. Sifford Golf Course, Harry L. Jones, Sr. Golf Course). Tee
times and pricing are fetched live from the Mecklenburg County Golf booking
engine (GolfNow/TeeItUp).

**Caveat:** that's an undocumented/private API the booking widget itself
calls, not a published partner API. It could change or block this app
without notice. If a course's fetch fails, the app shows an "unavailable"
message for that course rather than crashing the whole search.

## Two ways to run it

The app is fully static — the browser calls the TeeItUp API directly (it
returns `Access-Control-Allow-Origin: *`), so no backend is required. An
Express server is also included for local convenience, but isn't needed for
deployment.

**Static (matches GitHub Pages deployment):**

```bash
cd public && python3 -m http.server 8080
```

Then open http://localhost:8080.

**Express dev server:**

```bash
npm install
npm start
```

Then open http://localhost:3000. Click "Use my location" or type
coordinates as `latitude, longitude`.

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes the
`public/` folder to GitHub Pages via `actions/upload-pages-artifact` +
`actions/deploy-pages`. Requires GitHub Pages enabled in repo Settings →
Pages → Source: "GitHub Actions". Note: Pages on a private repo needs a paid
GitHub plan (Pro/Team/Enterprise) — free accounts only get Pages on public
repos.

## Architecture

- `public/` — the whole static site (no build step): HTML/CSS, `app.js`
  (search UI + orchestration), `geo.js` (Haversine "nearby" filtering),
  `teeItUpClient.js` (fetches live tee times/pricing directly from the
  TeeItUp API), and `courses.json` (course directory: name, address,
  coordinates, `facilityId` for the live lookup, and a booking link as a
  fallback). This folder is exactly what gets deployed to GitHub Pages.
- `server.js` / `src/routes/api.js` / `src/lib/` — an optional local Express
  server that mirrors the same logic server-side (`GET /api/courses/nearby`,
  `GET /api/tee-times/search`) for convenience during development. It reads
  the same `public/courses.json`. `src/lib/geo.js` and
  `src/lib/teeItUpClient.js` are Node (CommonJS) twins of the browser
  versions in `public/` — duplicated rather than shared to avoid needing a
  bundler for the static site.

## Adding more courses

A course only gets live tee times if it's on the same TeeItUp/GolfNow
backend and has a `facilityId` in `public/courses.json` (find it in the
course's booking-widget URL, e.g. `...book.teeitup.com/teetimes?course=1557`).
Courses on a different booking platform need their own fetcher following the
same shape as `fetchTeeTimes(course, date, players) => teeTimeSlot[]` in
`teeItUpClient.js` (update both the browser and server copies).

## Next steps

- [ ] Add caching for live tee-time lookups (this hits the live API on every
      search; a short TTL cache would reduce load and latency).
- [ ] Move course directory into a database once it needs to scale beyond a
      static list.
- [ ] Add a map view alongside the list view.
- [ ] Consider in-app booking (requires a payments/booking-partner API, or
      continuing to deep-link to the real booking page as the fallback).
