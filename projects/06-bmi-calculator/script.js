(function () {
  const NS = 'bmi';
  const heightIn = document.getElementById('height');
  const weightIn = document.getElementById('weight');
  const heightOut = document.getElementById('height-out');
  const weightOut = document.getElementById('weight-out');
  const bmiValue = document.getElementById('bmi-value');
  const bmiLabel = document.getElementById('bmi-label');
  const gaugeFill = document.getElementById('gauge-fill');
  const historyList = document.getElementById('bmi-history');
  const logBtn = document.getElementById('log-entry');

  const ARC_LENGTH = 251;
  let history = Bench.Storage.get(NS, 'history', []);

  function category(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#5ec8bd' };
    if (bmi < 25) return { label: 'Healthy range', color: '#5ec8bd' };
    if (bmi < 30) return { label: 'Overweight', color: '#f0a868' };
    return { label: 'Higher range', color: '#e2685f' };
  }

  function compute() {
    const h = +heightIn.value / 100;
    const w = +weightIn.value;
    heightOut.textContent = heightIn.value;
    weightOut.textContent = weightIn.value;
    const bmi = w / (h * h);
    bmiValue.textContent = bmi.toFixed(1);
    const cat = category(bmi);
    bmiLabel.textContent = cat.label;
    gaugeFill.style.stroke = cat.color;
    const pct = Math.min(Math.max((bmi - 12) / (40 - 12), 0), 1);
    gaugeFill.style.strokeDashoffset = String(ARC_LENGTH * (1 - pct));
    return bmi;
  }

  function renderHistory() {
    historyList.innerHTML = history.map(h => `<li>${h.date} — ${h.bmi} (${h.height}cm, ${h.weight}kg)</li>`).join('') || '<li>No readings logged yet.</li>';
  }

  heightIn.addEventListener('input', compute);
  weightIn.addEventListener('input', compute);

  logBtn.addEventListener('click', () => {
    const bmi = compute();
    history.unshift({ date: new Date().toLocaleDateString(), bmi: bmi.toFixed(1), height: heightIn.value, weight: weightIn.value });
    history = history.slice(0, 15);
    Bench.Storage.set(NS, 'history', history);
    renderHistory();
    Bench.toast('Reading logged', 'success');
  });

  compute();
  renderHistory();
})();
