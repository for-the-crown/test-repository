// Generates plausible tee-time inventory for a course on a given date.
// This stands in for a real course booking API/scraper (see README "Swapping in real data").
// Results are deterministic per (courseId, date) so repeated searches look stable, like real inventory.

function seededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const START_HOUR = 6;
const END_HOUR = 18;
const SLOT_MINUTES = 10;

function generateTeeTimes(course, date, players = 1) {
  const rand = seededRandom(hashString(`${course.id}:${date}`));
  const slots = [];

  for (let minutes = START_HOUR * 60; minutes < END_HOUR * 60; minutes += SLOT_MINUTES) {
    // Not every slot is a real tee time; thin them out unevenly like a real sheet would be.
    if (rand() < 0.55) continue;

    const isAvailable = rand() > 0.35;
    if (!isAvailable) continue;

    const maxPlayers = rand() > 0.5 ? 4 : 2;
    if (maxPlayers < players) continue;

    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const basePrice = course.holes === 9 ? 22 : 38;
    const peakSurcharge = hour >= 9 && hour <= 13 ? 12 : 0;
    const price = basePrice + peakSurcharge + Math.round(rand() * 8);

    slots.push({
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      maxPlayers,
      pricePerPlayer: price,
      holes: course.holes,
    });
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

module.exports = { generateTeeTimes };
