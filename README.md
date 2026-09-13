# Local Tee Times

Search for available golf tee times at courses near you, filtered by date,
radius, and number of players.

## Status: MVP scaffold

This is a working end-to-end skeleton: location search → nearby courses →
tee-time listings. Tee-time inventory is currently **mock data**, generated
deterministically per course/date so results look stable across repeated
searches. The course list (`data/courses.json`) is also sample data centered
on Austin, TX — replace it with real courses in your area.

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
- `src/lib/mockTeeTimes.js` — generates plausible tee-time slots per course/date.
  This is the seam to replace with a real data source (see below).
- `data/courses.json` — course directory (name, address, coordinates, booking URL).
- `public/` — vanilla HTML/CSS/JS frontend (no build step required).

## Swapping in real data

Two things need to become real before this is a genuine product:

1. **Course directory** (`data/courses.json`): replace with actual courses in
   your target area — name, address, lat/lng, and a booking link at minimum.
   This could later move to a database (Postgres) once it's more than a
   static list.

2. **Live tee-time inventory** (`src/lib/mockTeeTimes.js`): replace
   `generateTeeTimes(course, date, players)` with a real lookup. Options,
   roughly in order of practicality for a small/local app:
   - Direct integration with a handful of local courses (API, CSV feed, or
     webhook) if they'll work with you directly.
   - A booking-platform partner API (e.g. GolfNow/EZLinks, Chronogolf,
     Golf18Network) — typically requires a business/partner agreement.
   - Scraping individual course booking widgets — fragile and only
     practical for a small, fixed set of courses.

   Whatever the source, keep the function signature
   (`(course, date, players) => teeTimeSlot[]`) so the rest of the app
   doesn't need to change. Live data should also be cached (e.g. Redis,
   short TTL) since it will be far more expensive to fetch than mock data.

## Next steps

- [ ] Pick and wire up a real tee-time data source for at least one course.
- [ ] Move course directory into a database once it needs to scale beyond a
      static list.
- [ ] Add a map view alongside the list view.
- [ ] Add caching for live tee-time lookups.
- [ ] Consider in-app booking (requires a payments/booking-partner API).
