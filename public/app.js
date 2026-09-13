const form = document.getElementById('search-form');
const locationInput = document.getElementById('location');
const dateInput = document.getElementById('date');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

dateInput.value = new Date().toISOString().slice(0, 10);
dateInput.min = dateInput.value;

document.getElementById('use-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation is not supported by this browser.';
    return;
  }
  statusEl.textContent = 'Getting your location...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      statusEl.textContent = '';
    },
    () => {
      statusEl.textContent = 'Could not get your location. Enter coordinates manually.';
    }
  );
});

function parseLocation(value) {
  const parts = value.split(',').map((part) => parseFloat(part.trim()));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return { lat: parts[0], lng: parts[1] };
}

function renderResults(data) {
  resultsEl.innerHTML = '';

  if (data.results.length === 0) {
    resultsEl.innerHTML = '<p class="no-slots">No courses found within that radius.</p>';
    return;
  }

  for (const { course, teeTimes } of data.results) {
    const card = document.createElement('div');
    card.className = 'course-card';

    const slotsHtml =
      teeTimes.length > 0
        ? teeTimes
            .map(
              (slot) => `
          <a class="slot" href="${course.bookingUrl}" target="_blank" rel="noopener">
            ${slot.time}
            <span class="price">$${slot.pricePerPlayer}</span>
          </a>`
            )
            .join('')
        : '<p class="no-slots">No available tee times for this date.</p>';

    card.innerHTML = `
      <h2>${course.name}</h2>
      <div class="course-meta">
        ${course.address} · ${course.distanceMiles} mi · ${course.holes} holes
      </div>
      <div class="slots">${slotsHtml}</div>
    `;

    resultsEl.appendChild(card);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const coords = parseLocation(locationInput.value);
  if (!coords) {
    statusEl.textContent = 'Enter location as "latitude, longitude".';
    return;
  }

  const params = new URLSearchParams({
    lat: coords.lat,
    lng: coords.lng,
    date: dateInput.value,
    players: document.getElementById('players').value,
    radius: document.getElementById('radius').value,
  });

  statusEl.textContent = 'Searching...';
  resultsEl.innerHTML = '';

  try {
    const response = await fetch(`/api/tee-times/search?${params}`);
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    statusEl.textContent = `Found ${data.results.length} course(s) within ${data.radius} miles.`;
    renderResults(data);
  } catch (err) {
    statusEl.textContent = 'Something went wrong. Please try again.';
  }
});
