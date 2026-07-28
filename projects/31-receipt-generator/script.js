(function () {
  const NS = 'receipt';
  const storeName = document.getElementById('store-name');
  const storeMeta = document.getElementById('store-meta');
  const receiptNo = document.getElementById('receipt-no');
  const itemRows = document.getElementById('item-rows');
  const addItemBtn = document.getElementById('add-item');
  const taxRate = document.getElementById('tax-rate');
  const paymentMethod = document.getElementById('payment-method');
  const printBtn = document.getElementById('print-receipt');

  let counter = Bench.Storage.get(NS, 'counter', 1000);
  receiptNo.value = `R-${counter}`;

  let items = [{ name: 'Item 1', qty: 1, price: 100 }];

  function renderRows() {
    itemRows.innerHTML = items.map((it, i) => `
      <div class="item-row" data-i="${i}">
        <input type="text" data-f="name" value="${it.name}" placeholder="Item name">
        <input type="number" data-f="qty" value="${it.qty}" min="1">
        <input type="number" data-f="price" value="${it.price}" min="0">
        <button data-action="del">✕</button>
      </div>`).join('');
    renderPreview();
  }

  itemRows.addEventListener('input', e => {
    const row = e.target.closest('[data-i]'); if (!row) return;
    const i = +row.dataset.i;
    const f = e.target.dataset.f;
    items[i][f] = f === 'name' ? e.target.value : +e.target.value;
    renderPreview();
  });
  itemRows.addEventListener('click', e => {
    if (e.target.dataset.action === 'del') {
      const i = +e.target.closest('[data-i]').dataset.i;
      items.splice(i, 1);
      renderRows();
    }
  });

  addItemBtn.addEventListener('click', () => {
    items.push({ name: `Item ${items.length + 1}`, qty: 1, price: 0 });
    renderRows();
  });

  function fmt(n) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }

  function renderPreview() {
    document.getElementById('p-store-name').textContent = storeName.value;
    document.getElementById('p-store-meta').textContent = storeMeta.value;
    document.getElementById('p-receipt-no').textContent = receiptNo.value;
    document.getElementById('p-date').textContent = new Date().toLocaleString();
    document.getElementById('p-items').innerHTML = items.map(it => `
      <tr><td>${it.name}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty * it.price)}</td></tr>`).join('');
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const tax = subtotal * (+taxRate.value / 100);
    document.getElementById('p-subtotal').textContent = fmt(subtotal);
    document.getElementById('p-tax').textContent = fmt(tax);
    document.getElementById('p-total').textContent = fmt(subtotal + tax);
    document.getElementById('p-payment').textContent = paymentMethod.value;
  }

  [storeName, storeMeta, taxRate, paymentMethod].forEach(el => el.addEventListener('input', renderPreview));

  printBtn.addEventListener('click', () => {
    counter++;
    Bench.Storage.set(NS, 'counter', counter);
    window.print();
  });

  renderRows();
})();
