(function () {
  const NS = 'invoice';
  const fromName = document.getElementById('from-name');
  const fromEmail = document.getElementById('from-email');
  const toName = document.getElementById('to-name');
  const toEmail = document.getElementById('to-email');
  const invoiceNo = document.getElementById('invoice-no');
  const dueDate = document.getElementById('due-date');
  const itemRows = document.getElementById('item-rows');
  const addItemBtn = document.getElementById('add-item');
  const taxRate = document.getElementById('tax-rate');
  const notes = document.getElementById('notes');
  const printBtn = document.getElementById('print-invoice');

  let counter = Bench.Storage.get(NS, 'counter', 1);
  invoiceNo.value = `INV-${String(counter).padStart(4, '0')}`;
  const d = new Date(); d.setDate(d.getDate() + 14);
  dueDate.value = d.toISOString().slice(0, 10);

  let items = [
    { name: 'Website design & build', qty: 1, price: 25000 },
    { name: 'Monthly maintenance', qty: 1, price: 3000 },
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
    document.getElementById('p-invoice-no').textContent = invoiceNo.value;
    document.getElementById('p-date').textContent = new Date().toLocaleDateString();
    document.getElementById('p-due').textContent = new Date(dueDate.value).toLocaleDateString();
    document.getElementById('p-from-name').textContent = fromName.value;
    document.getElementById('p-from-email').textContent = fromEmail.value;
    document.getElementById('p-to-name').textContent = toName.value;
    document.getElementById('p-to-email').textContent = toEmail.value;
    document.getElementById('p-items').innerHTML = items.map(it => `
      <tr><td>${it.name}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty * it.price)}</td></tr>`).join('');
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const tax = subtotal * (+taxRate.value / 100);
    document.getElementById('p-subtotal').textContent = fmt(subtotal);
    document.getElementById('p-tax').textContent = fmt(tax);
    document.getElementById('p-total').textContent = fmt(subtotal + tax);
    document.getElementById('p-notes').textContent = notes.value;
  }

  [fromName, fromEmail, toName, toEmail, dueDate, taxRate, notes].forEach(el => el.addEventListener('input', renderPreview));

  printBtn.addEventListener('click', () => {
    counter++;
    Bench.Storage.set(NS, 'counter', counter);
    window.print();
  });

  renderRows();
})();
