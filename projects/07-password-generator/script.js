(function () {
  const NS = 'password';
  const els = {
    display: document.getElementById('pw-display'),
    copy: document.getElementById('pw-copy'),
    length: document.getElementById('pw-length'),
    lenOut: document.getElementById('len-out'),
    upper: document.getElementById('opt-upper'),
    lower: document.getElementById('opt-lower'),
    numbers: document.getElementById('opt-numbers'),
    symbols: document.getElementById('opt-symbols'),
    ambiguous: document.getElementById('opt-ambiguous'),
    generate: document.getElementById('pw-generate'),
    entropyFill: document.getElementById('entropy-fill'),
    entropyLabel: document.getElementById('entropy-label'),
    vaultLabel: document.getElementById('vault-label'),
    vaultSave: document.getElementById('vault-save'),
    vaultList: document.getElementById('vault-list'),
  };

  const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}',
  };
  const AMBIGUOUS = /[lI1O0]/g;

  let current = '';
  let vault = Bench.Storage.get(NS, 'vault', []);

  function buildCharset() {
    let set = '';
    if (els.upper.checked) set += SETS.upper;
    if (els.lower.checked) set += SETS.lower;
    if (els.numbers.checked) set += SETS.numbers;
    if (els.symbols.checked) set += SETS.symbols;
    if (els.ambiguous.checked) set = set.replace(AMBIGUOUS, '');
    return set;
  }

  function generate() {
    const set = buildCharset();
    const len = +els.length.value;
    if (!set) { Bench.toast('Pick at least one character type', 'warn'); return; }
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    current = Array.from(arr, n => set[n % set.length]).join('');
    els.display.textContent = current;
    rateEntropy(set.length, len);
  }

  function rateEntropy(poolSize, len) {
    const bits = len * Math.log2(poolSize || 1);
    const pct = Math.min((bits / 128) * 100, 100);
    els.entropyFill.style.width = pct + '%';
    let color = '#e2685f', label = 'Weak';
    if (bits > 40) { color = '#f0a868'; label = 'Fair'; }
    if (bits > 64) { color = '#5ec8bd'; label = 'Strong'; }
    if (bits > 100) { color = '#5ec8bd'; label = 'Very strong'; }
    els.entropyFill.style.background = color;
    els.entropyLabel.textContent = `Entropy: ~${bits.toFixed(0)} bits — ${label}`;
  }

  function renderVault() {
    els.vaultList.innerHTML = vault.map((v, i) => `
      <li><span>${v.label}</span> <button data-i="${i}" aria-label="Remove">✕</button></li>`).join('') || '<li>Vault is empty.</li>';
  }

  els.length.addEventListener('input', () => { els.lenOut.textContent = els.length.value; generate(); });
  [els.upper, els.lower, els.numbers, els.symbols, els.ambiguous].forEach(el => el.addEventListener('change', generate));
  els.generate.addEventListener('click', generate);

  els.copy.addEventListener('click', () => {
    if (!current) return;
    navigator.clipboard.writeText(current).then(() => Bench.toast('Copied to clipboard', 'success'));
  });

  els.vaultSave.addEventListener('click', () => {
    const label = els.vaultLabel.value.trim();
    if (!label) { Bench.toast('Give it a label first', 'warn'); return; }
    if (!current) { Bench.toast('Generate a password first', 'warn'); return; }
    vault.unshift({ label, password: current, date: new Date().toLocaleDateString() });
    Bench.Storage.set(NS, 'vault', vault);
    els.vaultLabel.value = '';
    renderVault();
    Bench.toast('Saved to vault', 'success');
  });

  els.vaultList.addEventListener('click', e => {
    const btn = e.target.closest('[data-i]'); if (!btn) return;
    vault.splice(+btn.dataset.i, 1);
    Bench.Storage.set(NS, 'vault', vault);
    renderVault();
  });

  generate();
  renderVault();
})();
