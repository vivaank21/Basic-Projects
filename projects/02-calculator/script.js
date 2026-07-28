(function () {
  const NS = 'calculator';
  const exprEl = document.getElementById('calc-expr');
  const resultEl = document.getElementById('calc-result');
  const padStd = document.getElementById('calc-pad-standard');
  const padSci = document.getElementById('calc-pad-sci');
  const modeStd = document.getElementById('mode-standard');
  const modeSci = document.getElementById('mode-scientific');
  const historyDrawer = document.getElementById('history-drawer');
  const historyToggle = document.getElementById('history-toggle');
  const historyList = document.getElementById('history-list');
  const historyClear = document.getElementById('history-clear');

  let expr = '';
  let history = Bench.Storage.get(NS, 'history', []);

  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function evaluate(raw) {
    let s = raw
      .replace(/π/g, `(${Math.PI})`)
      .replace(/pi/g, `(${Math.PI})`)
      .replace(/√/g, 'sqrt')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/\^/g, '**')
      .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n, 10)));
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${s})`)();
    if (typeof val !== 'number' || !isFinite(val)) throw new Error('bad expr');
    return val;
  }

  function render() {
    exprEl.textContent = expr || '\u00a0';
  }

  function pushHistory(exprText, res) {
    history.unshift({ expr: exprText, res });
    history = history.slice(0, 20);
    Bench.Storage.set(NS, 'history', history);
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map(h => `<li data-val="${h.res}">${h.expr} = ${h.res}</li>`).join('') || '<li style="cursor:default;">No history yet.</li>';
  }

  function handleKey(key) {
    if (key === 'clear') { expr = ''; resultEl.textContent = '0'; render(); return; }
    if (key === 'backspace') { expr = expr.slice(0, -1); render(); return; }
    if (key === '=') {
      if (!expr) return;
      try {
        const res = +evaluate(expr).toPrecision(12);
        pushHistory(expr, res);
        resultEl.textContent = res;
        expr = String(res);
      } catch (e) {
        resultEl.textContent = 'Error';
      }
      render();
      return;
    }
    expr += key;
    render();
  }

  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.key));
  });

  modeStd.addEventListener('click', () => {
    modeStd.classList.add('is-active'); modeSci.classList.remove('is-active');
    padStd.classList.remove('hidden'); padSci.classList.add('hidden');
  });
  modeSci.addEventListener('click', () => {
    modeSci.classList.add('is-active'); modeStd.classList.remove('is-active');
    padSci.classList.remove('hidden'); padStd.classList.remove('hidden');
  });

  historyToggle.addEventListener('click', () => historyDrawer.classList.toggle('hidden'));
  historyClear.addEventListener('click', () => { history = []; Bench.Storage.set(NS, 'history', history); renderHistory(); });
  historyList.addEventListener('click', e => {
    const li = e.target.closest('[data-val]'); if (!li) return;
    expr = li.dataset.val; render();
  });

  window.addEventListener('keydown', e => {
    if (/^[0-9.+\-*/%()]$/.test(e.key)) { handleKey(e.key); return; }
    if (e.key === 'Enter') { handleKey('='); return; }
    if (e.key === 'Backspace') { handleKey('backspace'); return; }
    if (e.key === 'Escape') { handleKey('clear'); return; }
  });

  renderHistory();
  render();
})();
