(function () {
  const NS = 'converter';
  const tabs = document.getElementById('category-tabs');
  const fromSel = document.getElementById('unit-from');
  const toSel = document.getElementById('unit-to');
  const inputVal = document.getElementById('input-value');
  const outputVal = document.getElementById('output-value');
  const swapBtn = document.getElementById('swap-units');
  const note = document.getElementById('convert-note');
  const recentList = document.getElementById('recent-list');

  const UNITS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.34, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
    weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, tonne: 1000 },
    speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444 },
  };
  const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CNY'];

  let category = 'length';
  let rates = null;
  let recent = Bench.Storage.get(NS, 'recent', []);

  function populateSelects() {
    let options = [];
    if (category === 'temperature') options = ['Celsius', 'Fahrenheit', 'Kelvin'];
    else if (category === 'currency') options = CURRENCIES;
    else options = Object.keys(UNITS[category]);
    fromSel.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
    toSel.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
    toSel.selectedIndex = options.length > 1 ? 1 : 0;
    note.textContent = category === 'currency' ? 'Live rates from open.er-api.com, refreshed on load.' : '';
    convert();
  }

  function convertTemp(v, from, to) {
    let c;
    if (from === 'Celsius') c = v;
    else if (from === 'Fahrenheit') c = (v - 32) * 5 / 9;
    else c = v - 273.15;
    if (to === 'Celsius') return c;
    if (to === 'Fahrenheit') return c * 9 / 5 + 32;
    return c + 273.15;
  }

  async function fetchRates() {
    if (rates) return rates;
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      rates = data.rates;
    } catch (e) {
      Bench.toast('Currency rates unavailable offline', 'warn');
      rates = { USD: 1 };
    }
    return rates;
  }

  async function convert() {
    const v = +inputVal.value || 0;
    const from = fromSel.value, to = toSel.value;
    let result;
    if (category === 'temperature') {
      result = convertTemp(v, from, to);
    } else if (category === 'currency') {
      const r = await fetchRates();
      const usdValue = v / (r[from] || 1);
      result = usdValue * (r[to] || 1);
    } else {
      const table = UNITS[category];
      result = (v * table[from]) / table[to];
    }
    outputVal.value = Number.isFinite(result) ? +result.toFixed(4) : '';
    logRecent(v, from, result, to);
  }

  function logRecent(v, from, result, to) {
    const entry = `${v} ${from} = ${(+result).toFixed(2)} ${to}`;
    recent = [entry, ...recent.filter(r => r !== entry)].slice(0, 8);
    Bench.Storage.set(NS, 'recent', recent);
    renderRecent();
  }
  const debouncedLog = Bench.debounce(logRecent, 600);

  function renderRecent() {
    recentList.innerHTML = recent.map(r => `<li>${r}</li>`).join('') || '<li>No conversions yet.</li>';
  }

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]'); if (!btn) return;
    tabs.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    category = btn.dataset.cat;
    populateSelects();
  });

  swapBtn.addEventListener('click', () => {
    const f = fromSel.value; fromSel.value = toSel.value; toSel.value = f;
    convert();
  });

  [inputVal, fromSel, toSel].forEach(el => el.addEventListener('input', convert));

  populateSelects();
  renderRecent();
})();
