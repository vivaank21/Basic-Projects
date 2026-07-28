(function () {
  const NS = 'counters';
  const grid = document.getElementById('counter-grid');
  const nameIn = document.getElementById('new-name');
  const stepIn = document.getElementById('new-step');
  const targetIn = document.getElementById('new-target');
  const addBtn = document.getElementById('new-add');

  let counters = Bench.Storage.get(NS, 'list', [
    { id: crypto.randomUUID(), name: 'Daily reps', step: 5, target: 100, value: 0, history: [] },
  ]);

  function save() { Bench.Storage.set(NS, 'list', counters); }

  function render() {
    grid.innerHTML = counters.map(c => {
      const pct = c.target ? Math.min((c.value / c.target) * 100, 100) : null;
      return `
      <div class="counter-card glass" data-id="${c.id}">
        <button class="counter-del" data-action="delete" aria-label="Delete counter">✕</button>
        <h3>${c.name}</h3>
        <div class="counter-target">${c.target ? `Target: ${c.target}` : 'No target set'}</div>
        <div class="counter-value">${c.value}</div>
        <div class="counter-btns">
          <button data-action="dec">−</button>
          <button data-action="reset" title="Reset" style="font-size:1rem;">↺</button>
          <button data-action="inc">+</button>
        </div>
        ${pct !== null ? `<div class="counter-progress"><span style="width:${pct}%"></span></div>` : ''}
      </div>`;
    }).join('');
  }

  grid.addEventListener('click', e => {
    const card = e.target.closest('[data-id]'); if (!card) return;
    const id = card.dataset.id;
    const c = counters.find(x => x.id === id);
    const action = e.target.dataset.action;
    if (action === 'inc') { c.value += c.step; c.history.push({ t: Date.now(), v: c.value }); }
    if (action === 'dec') { c.value = Math.max(0, c.value - c.step); c.history.push({ t: Date.now(), v: c.value }); }
    if (action === 'reset') c.value = 0;
    if (action === 'delete') { counters = counters.filter(x => x.id !== id); }
    save(); render();
  });

  addBtn.addEventListener('click', () => {
    const name = nameIn.value.trim();
    if (!name) { Bench.toast('Name your counter first', 'warn'); return; }
    counters.unshift({
      id: crypto.randomUUID(),
      name,
      step: +stepIn.value || 1,
      target: +targetIn.value || null,
      value: 0,
      history: [],
    });
    nameIn.value = ''; targetIn.value = '';
    save(); render();
  });

  render();
})();
