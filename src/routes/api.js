const express = require('express');
const courses = require('../../public/courses.json');
const { distanceMiles } = require('../lib/geo');
const { fetchTeeTimes } = require('../lib/teeItUpClient');

const router = express.Router();

function parseCoords(query) {
  const lat = parseFloat(query.lat);
  const lng = parseFloat(query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function nearbyCourses(lat, lng, radiusMiles) {
  return courses
    .map((course) => ({
      ...course,
      distanceMiles: Math.round(distanceMiles(lat, lng, course.lat, course.lng) * 10) / 10,
    }))
    .filter((course) => course.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

// GET /api/courses/nearby?lat=&lng=&radius=
router.get('/courses/nearby', (req, res) => {
  const coords = parseCoords(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'lat and lng query params are required numbers' });
  }
  const radius = parseFloat(req.query.radius) || 15;
  res.json({ courses: nearbyCourses(coords.lat, coords.lng, radius) });
});

// GET /api/tee-times/search?lat=&lng=&radius=&date=&players=
router.get('/tee-times/search', async (req, res) => {
  const coords = parseCoords(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'lat and lng query params are required numbers' });
  }

  const radius = parseFloat(req.query.radius) || 15;
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const players = parseInt(req.query.players, 10) || 1;

  const results = await Promise.all(
    nearbyCourses(coords.lat, coords.lng, radius).map(async (course) => {
      try {
        return { course, date, teeTimes: await fetchTeeTimes(course, date, players) };
      } catch (err) {
        console.error(`Failed to fetch tee times for ${course.id}:`, err.message);
        return { course, date, teeTimes: [], error: 'Live tee times unavailable right now.' };
      }
    })
  );

  res.json({ date, players, radius, results });
});

module.exports = router;
