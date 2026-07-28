(function () {
  const NS = 'weather';
  const input = document.getElementById('city-input');
  const searchBtn = document.getElementById('city-search');
  const favRow = document.getElementById('favorites-row');
  const loading = document.getElementById('weather-loading');
  const currentCard = document.getElementById('current-card');
  const empty = document.getElementById('weather-empty');
  const forecastGrid = document.getElementById('forecast-grid');
  const favBtn = document.getElementById('fav-btn');

  let favorites = Bench.Storage.get(NS, 'favorites', []);
  let currentPlace = null;

  const WMO = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
    80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌦️'], 82: ['Violent showers', '⛈️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️'], 99: ['Severe storm', '⛈️'],
  };
  const weatherInfo = code => WMO[code] || ['Unknown', '🌡️'];

  function renderFavorites() {
    favRow.innerHTML = favorites.map(f => `<button data-lat="${f.lat}" data-lon="${f.lon}" data-name="${f.name}">${f.name}</button>`).join('');
  }

  async function geocode(name) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`);
    const data = await res.json();
    if (!data.results || !data.results.length) return null;
    const r = data.results[0];
    return { name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country}`, lat: r.latitude, lon: r.longitude };
  }

  async function fetchWeather(place) {
    loading.classList.remove('hidden');
    currentCard.classList.add('hidden');
    empty.classList.add('hidden');
    forecastGrid.innerHTML = '';
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
      const data = await res.json();
      currentPlace = place;
      renderCurrent(data, place);
      renderForecast(data);
    } catch (e) {
      Bench.toast('Could not load weather. Check your connection.', 'error');
      empty.classList.remove('hidden');
    } finally {
      loading.classList.add('hidden');
    }
  }

  function renderCurrent(data, place) {
    const cw = data.current_weather;
    const [desc, icon] = weatherInfo(cw.weathercode);
    document.getElementById('current-city').textContent = place.name;
    document.getElementById('current-desc').textContent = `${icon} ${desc}`;
    document.getElementById('current-temp').textContent = `${Math.round(cw.temperature)}°C`;
    const hourIdx = data.hourly.time.findIndex(t => t.startsWith(cw.time.slice(0, 13)));
    const feels = hourIdx >= 0 ? data.hourly.apparent_temperature[hourIdx] : cw.temperature;
    const humidity = hourIdx >= 0 ? data.hourly.relativehumidity_2m[hourIdx] : '--';
    document.getElementById('stat-feels').textContent = `${Math.round(feels)}°C`;
    document.getElementById('stat-wind').textContent = `${cw.windspeed} km/h`;
    document.getElementById('stat-humidity').textContent = `${humidity}%`;
    currentCard.classList.remove('hidden');
    favBtn.textContent = favorites.some(f => f.name === place.name) ? '★ Saved' : '☆ Save';
  }

  function renderForecast(data) {
    const days = data.daily.time.slice(0, 5).map((t, i) => ({
      date: t, max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], code: data.daily.weathercode[i],
    }));
    forecastGrid.innerHTML = days.map(d => {
      const [desc, icon] = weatherInfo(d.code);
      const name = new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' });
      return `<div class="forecast-day glass"><div class="day-name">${name}</div><div class="day-icon">${icon}</div><div class="day-temps">${Math.round(d.max)}° / ${Math.round(d.min)}°</div></div>`;
    }).join('');
  }

  async function doSearch(name) {
    if (!name.trim()) return;
    loading.classList.remove('hidden');
    const place = await geocode(name.trim());
    if (!place) {
      loading.classList.add('hidden');
      Bench.toast('City not found', 'error');
      return;
    }
    fetchWeather(place);
  }

  searchBtn.addEventListener('click', () => doSearch(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });

  favRow.addEventListener('click', e => {
    const btn = e.target.closest('[data-lat]'); if (!btn) return;
    fetchWeather({ name: btn.dataset.name, lat: +btn.dataset.lat, lon: +btn.dataset.lon });
  });

  favBtn.addEventListener('click', () => {
    if (!currentPlace) return;
    const exists = favorites.some(f => f.name === currentPlace.name);
    if (exists) favorites = favorites.filter(f => f.name !== currentPlace.name);
    else favorites.unshift(currentPlace);
    favorites = favorites.slice(0, 6);
    Bench.Storage.set(NS, 'favorites', favorites);
    renderFavorites();
    favBtn.textContent = exists ? '☆ Save' : '★ Saved';
  });

  renderFavorites();
  empty.classList.remove('hidden');
  if (favorites.length) fetchWeather(favorites[0]);
  else doSearch('Rajkot');
})();
