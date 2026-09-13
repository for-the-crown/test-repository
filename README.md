# Local Tee Times

Search for available golf tee times at courses near you, filtered by date,
radius, and number of players.

## Status: MVP with real data

Location search → nearby courses → real, live tee-time listings. The course
list (`data/courses.json`) currently has two Mecklenburg County, NC courses
(Dr. Charles L. Sifford Golf Course, Harry L. Jones, Sr. Golf Course). Tee
times and pricing are fetched live from the Mecklenburg County Golf booking
engine (GolfNow/TeeItUp) — see `src/lib/teeItUpClient.js`.

**Caveat:** that's an undocumented/private API the booking widget itself
calls, not a published partner API. It could change or block this app
without notice. If a course's fetch fails, the app shows an "unavailable"
message for that course rather than crashing the whole search.

## Running it

```bash
npm install
npm start
```

Then open http://localhost:3000. Click "Use my location" or type
coordinates as `latitude, longitude`.

## Architecture

- `server.js` — Express app, serves the static frontend and mounts the API.
- `src/routes/api.js` — HTTP endpoints:
  - `GET /api/courses/nearby?lat=&lng=&radius=`
  - `GET /api/tee-times/search?lat=&lng=&radius=&date=&players=`
- `src/lib/geo.js` — Haversine distance calculation for "nearby" filtering.
- `src/lib/teeItUpClient.js` — fetches live tee times/pricing from the
  Mecklenburg County Golf (GolfNow/TeeItUp) booking backend for any course
  with a `facilityId`. This is the seam to extend/replace per data source.
- `data/courses.json` — course directory (name, address, coordinates,
  `facilityId` for the live lookup, and a booking link as a fallback).
- `public/` — vanilla HTML/CSS/JS frontend (no build step required).

## Adding more courses

A course only gets live tee times if it's on the same TeeItUp/GolfNow
backend and has a `facilityId` in `data/courses.json` (find it in the
course's booking-widget URL, e.g. `...book.teeitup.com/teetimes?course=1557`).
Courses on a different booking platform need their own fetcher following the
same shape as `fetchTeeTimes(course, date, players) => teeTimeSlot[]` in
`teeItUpClient.js`.

## Next steps

- [ ] Add caching for live tee-time lookups (this hits the live API on every
      search; a short TTL cache would reduce load and latency).
- [ ] Move course directory into a database once it needs to scale beyond a
      static list.
- [ ] Add a map view alongside the list view.
- [ ] Consider in-app booking (requires a payments/booking-partner API, or
      continuing to deep-link to the real booking page as the fallback).
