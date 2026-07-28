(function () {
  const NS = 'ledger';
  const els = {
    desc: document.getElementById('e-desc'),
    amount: document.getElementById('e-amount'),
    type: document.getElementById('e-type'),
    category: document.getElementById('e-category'),
    add: document.getElementById('e-add'),
    list: document.getElementById('txn-list'),
    empty: document.getElementById('txn-empty'),
    income: document.getElementById('sum-income'),
    expense: document.getElementById('sum-expense'),
    balance: document.getElementById('sum-balance'),
    fill: document.getElementById('balance-fill'),
    filters: document.getElementById('cat-filters'),
  };

  let txns = Bench.Storage.get(NS, 'transactions', []);
  let activeCat = 'All';

  function save() { Bench.Storage.set(NS, 'transactions', txns); }
  function fmt(n) { return `₹${Math.abs(n).toLocaleString('en-IN')}`; }

  function render() {
    const filtered = txns.filter(t => activeCat === 'All' || t.category === activeCat);
    els.list.innerHTML = filtered.map(t => `
      <li class="txn-item" data-id="${t.id}">
        <span class="txn-cat">${t.category}</span>
        <span class="txn-desc">${t.desc}</span>
        <span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</span>
        <button class="txn-del" data-action="delete">✕</button>
      </li>`).join('');
    els.empty.classList.toggle('hidden', filtered.length > 0);

    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    els.income.textContent = fmt(income);
    els.expense.textContent = fmt(expense);
    els.balance.textContent = fmt(income - expense);
    const total = income + expense;
    els.fill.style.width = total ? `${(income / total) * 100}%` : '50%';
  }

  els.add.addEventListener('click', () => {
    const desc = els.desc.value.trim();
    const amount = +els.amount.value;
    if (!desc || !amount) { Bench.toast('Add a description and amount', 'warn'); return; }
    txns.unshift({ id: crypto.randomUUID(), desc, amount, type: els.type.value, category: els.category.value, date: new Date().toISOString() });
    els.desc.value = ''; els.amount.value = '';
    save(); render();
  });

  els.list.addEventListener('click', e => {
    const li = e.target.closest('[data-id]'); if (!li) return;
    if (e.target.dataset.action === 'delete') {
      txns = txns.filter(t => t.id !== li.dataset.id);
      save(); render();
    }
  });

  els.filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]'); if (!btn) return;
    els.filters.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeCat = btn.dataset.cat;
    render();
  });

  render();
})();
