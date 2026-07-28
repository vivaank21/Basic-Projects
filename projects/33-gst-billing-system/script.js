(function () {
  const NS = 'gst';
  const sellerName = document.getElementById('seller-name');
  const sellerGstin = document.getElementById('seller-gstin');
  const sellerState = document.getElementById('seller-state');
  const buyerName = document.getElementById('buyer-name');
  const buyerGstin = document.getElementById('buyer-gstin');
  const buyerState = document.getElementById('buyer-state');
  const invoiceNo = document.getElementById('invoice-no');
  const itemRows = document.getElementById('item-rows');
  const addItemBtn = document.getElementById('add-item');
  const gstRate = document.getElementById('gst-rate');
  const gstNote = document.getElementById('gst-note');
  const printBtn = document.getElementById('print-invoice');

  let counter = Bench.Storage.get(NS, 'counter', 1);
  invoiceNo.value = `GST-${String(counter).padStart(4, '0')}`;

  let items = [{ name: 'Consulting services', hsn: '9983', qty: 1, price: 10000 }];

  function fmt(n) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }

  function isIntraState() {
    return sellerState.value.trim().toLowerCase() === buyerState.value.trim().toLowerCase();
  }

  function renderRows() {
    itemRows.innerHTML = items.map((it, i) => `
      <div class="item-row" data-i="${i}">
        <input type="text" data-f="name" value="${it.name}">
        <input type="text" data-f="hsn" value="${it.hsn}" placeholder="HSN">
        <input type="number" data-f="qty" value="${it.qty}" min="1">
        <input type="number" data-f="price" value="${it.price}" min="0">
        <button data-action="del">✕</button>
      </div>`).join('');
    renderPreview();
  }

  itemRows.addEventListener('input', e => {
    const row = e.target.closest('[data-i]'); if (!row) return;
    const i = +row.dataset.i, f = e.target.dataset.f;
    items[i][f] = (f === 'qty' || f === 'price') ? +e.target.value : e.target.value;
    renderPreview();
  });
  itemRows.addEventListener('click', e => {
    if (e.target.dataset.action === 'del') { items.splice(+e.target.closest('[data-i]').dataset.i, 1); renderRows(); }
  });
  addItemBtn.addEventListener('click', () => { items.push({ name: 'New item', hsn: '', qty: 1, price: 0 }); renderRows(); });

  function renderPreview() {
    document.getElementById('p-invoice-no').textContent = invoiceNo.value;
    document.getElementById('p-date').textContent = new Date().toLocaleDateString();
    document.getElementById('p-seller-name').textContent = sellerName.value;
    document.getElementById('p-seller-gstin').textContent = sellerGstin.value;
    document.getElementById('p-seller-state').textContent = sellerState.value;
    document.getElementById('p-buyer-name').textContent = buyerName.value;
    document.getElementById('p-buyer-gstin').textContent = buyerGstin.value;
    document.getElementById('p-buyer-state').textContent = buyerState.value;
    document.getElementById('p-items').innerHTML = items.map(it => `
      <tr><td>${it.name}</td><td>${it.hsn}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty * it.price)}</td></tr>`).join('');

    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const rate = +gstRate.value;
    const intra = isIntraState();
    gstNote.textContent = intra
      ? 'Same state detected — splitting as CGST + SGST.'
      : 'Different states detected — applying IGST.';

    let breakdown = `<div><span>Taxable value</span><span>${fmt(subtotal)}</span></div>`;
    let total = subtotal;
    if (intra) {
      const half = subtotal * (rate / 2 / 100);
      breakdown += `<div><span>CGST (${rate / 2}%)</span><span>${fmt(half)}</span></div>`;
      breakdown += `<div><span>SGST (${rate / 2}%)</span><span>${fmt(half)}</span></div>`;
      total += half * 2;
    } else {
      const igst = subtotal * (rate / 100);
      breakdown += `<div><span>IGST (${rate}%)</span><span>${fmt(igst)}</span></div>`;
      total += igst;
    }
    breakdown += `<div class="grand"><span>Total</span><span>${fmt(total)}</span></div>`;
    document.getElementById('tax-breakdown').innerHTML = breakdown;
  }

  [sellerName, sellerGstin, sellerState, buyerName, buyerGstin, buyerState, gstRate].forEach(el => el.addEventListener('input', renderPreview));

  printBtn.addEventListener('click', () => {
    counter++;
    Bench.Storage.set(NS, 'counter', counter);
    window.print();
  });

  renderRows();
})();
