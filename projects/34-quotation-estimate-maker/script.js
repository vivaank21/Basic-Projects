(function () {
  const NS = 'quotation';
  const fromName = document.getElementById('from-name');
  const toName = document.getElementById('to-name');
  const quoteNo = document.getElementById('quote-no');
  const validUntil = document.getElementById('valid-until');
  const itemRows = document.getElementById('item-rows');
  const addItemBtn = document.getElementById('add-item');
  const taxRate = document.getElementById('tax-rate');
  const terms = document.getElementById('terms');
  const printBtn = document.getElementById('print-quote');

  let counter = Bench.Storage.get(NS, 'counter', 1);
  quoteNo.value = `QUO-${String(counter).padStart(4, '0')}`;
  const d = new Date(); d.setDate(d.getDate() + 30);
  validUntil.value = d.toISOString().slice(0, 10);

  let items = [
    { name: 'Discovery & planning', qty: 1, price: 8000 },
    { name: 'Design & development', qty: 1, price: 35000 },
  ];

  function fmt(n) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }

  function renderRows() {
    itemRows.innerHTML = items.map((it, i) => `
      <div class="item-row" data-i="${i}">
        <input type="text" data-f="name" value="${it.name}">
        <input type="number" data-f="qty" value="${it.qty}" min="1">
        <input type="number" data-f="price" value="${it.price}" min="0">
        <button data-action="del">✕</button>
      </div>`).join('');
    renderPreview();
  }

  itemRows.addEventListener('input', e => {
    const row = e.target.closest('[data-i]'); if (!row) return;
    const i = +row.dataset.i, f = e.target.dataset.f;
    items[i][f] = f === 'name' ? e.target.value : +e.target.value;
    renderPreview();
  });
  itemRows.addEventListener('click', e => {
    if (e.target.dataset.action === 'del') { items.splice(+e.target.closest('[data-i]').dataset.i, 1); renderRows(); }
  });
  addItemBtn.addEventListener('click', () => { items.push({ name: 'New item', qty: 1, price: 0 }); renderRows(); });

  function renderPreview() {
    document.getElementById('p-quote-no').textContent = quoteNo.value;
    document.getElementById('p-date').textContent = new Date().toLocaleDateString();
    document.getElementById('p-valid').textContent = new Date(validUntil.value).toLocaleDateString();
    document.getElementById('p-from-name').textContent = fromName.value;
    document.getElementById('p-to-name').textContent = toName.value;
    document.getElementById('p-items').innerHTML = items.map(it => `
      <tr><td>${it.name}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty * it.price)}</td></tr>`).join('');
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const tax = subtotal * (+taxRate.value / 100);
    document.getElementById('p-subtotal').textContent = fmt(subtotal);
    document.getElementById('p-tax').textContent = fmt(tax);
    document.getElementById('p-total').textContent = fmt(subtotal + tax);
    document.getElementById('p-terms').textContent = terms.value;
  }

  [fromName, toName, validUntil, taxRate, terms].forEach(el => el.addEventListener('input', renderPreview));

  printBtn.addEventListener('click', () => {
    counter++;
    Bench.Storage.set(NS, 'counter', counter);
    window.print();
  });

  renderRows();
})();
