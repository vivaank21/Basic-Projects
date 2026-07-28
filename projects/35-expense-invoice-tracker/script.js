(function () {
  const NS = 'biztracker';
  const invClient = document.getElementById('inv-client');
  const invAmount = document.getElementById('inv-amount');
  const invStatus = document.getElementById('inv-status');
  const invAdd = document.getElementById('inv-add');
  const invoicesList = document.getElementById('invoices-list');
  const expDesc = document.getElementById('exp-desc');
  const expAmount = document.getElementById('exp-amount');
  const expCategory = document.getElementById('exp-category');
  const expAdd = document.getElementById('exp-add');
  const expensesList = document.getElementById('expenses-list');
  const tabRow = document.querySelector('.tab-row');
  const invoicesPanel = document.getElementById('invoices-panel');
  const expensesPanel = document.getElementById('expenses-panel');
  const canvas = document.getElementById('trend-canvas');
  const ctx = canvas.getContext('2d');

  let invoices = Bench.Storage.get(NS, 'invoices', []);
  let expenses = Bench.Storage.get(NS, 'expenses', []);

  function fmt(n) { return `₹${Math.round(n).toLocaleString('en-IN')}`; }
  function save() { Bench.Storage.set(NS, 'invoices', invoices); Bench.Storage.set(NS, 'expenses', expenses); }

  function renderLists() {
    invoicesList.innerHTML = invoices.map(i => `
      <li class="entry-item" data-id="${i.id}">
        <span class="entry-tag ${i.status}">${i.status}</span>
        <span class="entry-name">${i.client}</span>
        <span class="entry-amount">${fmt(i.amount)}</span>
        <button class="entry-del" data-action="del-inv">✕</button>
      </li>`).join('') || '<li style="color:var(--muted-2); padding:10px 0;">No invoices logged yet.</li>';

    expensesList.innerHTML = expenses.map(e => `
      <li class="entry-item" data-id="${e.id}">
        <span class="entry-tag">${e.category}</span>
        <span class="entry-name">${e.desc}</span>
        <span class="entry-amount">${fmt(e.amount)}</span>
        <button class="entry-del" data-action="del-exp">✕</button>
      </li>`).join('') || '<li style="color:var(--muted-2); padding:10px 0;">No expenses logged yet.</li>';
  }

  function renderSummary() {
    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pending = totalInvoiced - collected;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    document.getElementById('sum-invoiced').textContent = fmt(totalInvoiced);
    document.getElementById('sum-collected').textContent = fmt(collected);
    document.getElementById('sum-pending').textContent = fmt(pending);
    document.getElementById('sum-expenses').textContent = fmt(totalExpenses);
    document.getElementById('sum-net').textContent = fmt(collected - totalExpenses);
  }

  function monthKey(d) { const dt = new Date(d); return `${dt.getFullYear()}-${dt.getMonth()}`; }

  function drawChart() {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
    }
    const revenueByMonth = months.map(m => invoices.filter(i => i.status === 'paid' && monthKey(i.date) === m.key).reduce((s, i) => s + i.amount, 0));
    const expenseByMonth = months.map(m => expenses.filter(e => monthKey(e.date) === m.key).reduce((s, e) => s + e.amount, 0));
    const max = Math.max(...revenueByMonth, ...expenseByMonth, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const groupW = canvas.width / months.length;
    months.forEach((m, i) => {
      const barW = groupW * 0.28;
      const baseX = i * groupW + groupW / 2;
      const revH = (revenueByMonth[i] / max) * (canvas.height - 40);
      const expH = (expenseByMonth[i] / max) * (canvas.height - 40);
      ctx.fillStyle = '#5ec8bd';
      ctx.fillRect(baseX - barW - 3, canvas.height - 24 - revH, barW, revH);
      ctx.fillStyle = '#e2685f';
      ctx.fillRect(baseX + 3, canvas.height - 24 - expH, barW, expH);
      ctx.fillStyle = '#8b93a1';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, baseX, canvas.height - 6);
    });
  }

  function renderAll() { renderLists(); renderSummary(); drawChart(); }

  invAdd.addEventListener('click', () => {
    const client = invClient.value.trim(); const amount = +invAmount.value;
    if (!client || !amount) { Bench.toast('Add client and amount', 'warn'); return; }
    invoices.unshift({ id: crypto.randomUUID(), client, amount, status: invStatus.value, date: new Date().toISOString() });
    invClient.value = ''; invAmount.value = '';
    save(); renderAll();
  });

  expAdd.addEventListener('click', () => {
    const desc = expDesc.value.trim(); const amount = +expAmount.value;
    if (!desc || !amount) { Bench.toast('Add description and amount', 'warn'); return; }
    expenses.unshift({ id: crypto.randomUUID(), desc, amount, category: expCategory.value, date: new Date().toISOString() });
    expDesc.value = ''; expAmount.value = '';
    save(); renderAll();
  });

  invoicesList.addEventListener('click', e => {
    if (e.target.dataset.action === 'del-inv') {
      const id = e.target.closest('[data-id]').dataset.id;
      invoices = invoices.filter(i => i.id !== id);
      save(); renderAll();
    }
  });
  expensesList.addEventListener('click', e => {
    if (e.target.dataset.action === 'del-exp') {
      const id = e.target.closest('[data-id]').dataset.id;
      expenses = expenses.filter(x => x.id !== id);
      save(); renderAll();
    }
  });

  tabRow.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]'); if (!btn) return;
    tabRow.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    invoicesPanel.classList.toggle('hidden', btn.dataset.tab !== 'invoices');
    expensesPanel.classList.toggle('hidden', btn.dataset.tab !== 'expenses');
  });

  renderAll();
})();
