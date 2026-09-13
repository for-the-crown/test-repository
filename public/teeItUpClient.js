// Fetches real tee-time inventory directly from the Mecklenburg County Golf
// booking engine (GolfNow/TeeItUp) - the same backend the public booking
// widget at meckcountygolf.com/book-a-tee-time calls from the browser. There
// is no published API for it, so this talks to it directly the way the
// widget itself does. It only covers courses that set a `facilityId` in
// courses.json (currently the two Mecklenburg County courses); expect it to
// need updating if TeeItUp changes their backend.
//
// This is the browser (ES module) twin of src/lib/teeItUpClient.js, which
// the local Express dev server uses instead - kept separate so this static
// site needs no bundler/build step.

const API_BASE = 'https://phx-api-be-east-1b.kenna.io';
const BE_ALIAS = 'multicourse-booking-engine';
const TIME_ZONE = 'America/New_York';

function centsToDollars(cents) {
  return Math.round(cents) / 100;
}

// greenFeeCart/greenFeeWalking is the actual per-player fee (in cents); the
// dueOnline* fields are just what's charged online now (often 0 = pay at
// the course), not the price.
function ratePrice(rate) {
  return rate.greenFeeCart ?? rate.greenFeeWalking;
}

function cheapestRate(rates, players) {
  const eligible = rates.filter((rate) => rate.allowedPlayers.includes(players));
  if (eligible.length === 0) return null;

  return eligible.reduce((cheapest, rate) => (ratePrice(rate) < ratePrice(cheapest) ? rate : cheapest));
}

function formatLocalTime(isoString) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date(isoString));
}

export async function fetchTeeTimes(course, date, players) {
  const params = new URLSearchParams({
    date,
    facilityIds: String(course.facilityId),
    returnPromotedRates: 'true',
  });

  const response = await fetch(`${API_BASE}/v2/tee-times?${params}`, {
    headers: {
      'x-be-alias': BE_ALIAS,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TeeItUp API returned ${response.status} for facility ${course.facilityId}`);
  }

  const [dayResult] = await response.json();
  const teetimes = dayResult?.teetimes ?? [];

  return teetimes
    .filter((slot) => slot.maxPlayers - slot.bookedPlayers >= players)
    .map((slot) => {
      const rate = cheapestRate(slot.rates, players);
      if (!rate) return null;

      return {
        time: formatLocalTime(slot.teetime),
        maxPlayers: slot.maxPlayers - slot.bookedPlayers,
        pricePerPlayer: centsToDollars(ratePrice(rate)),
        holes: rate.holes,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time.localeCompare(b.time));
}
