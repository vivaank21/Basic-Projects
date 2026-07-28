(function () {
  const NS = 'registration';
  const form = document.getElementById('signup-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const dots = [...document.querySelectorAll('.step-dot')];
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const note = document.getElementById('autosave-note');

  const fields = {
    email: document.getElementById('f-email'),
    password: document.getElementById('f-password'),
    confirm: document.getElementById('f-confirm'),
    name: document.getElementById('f-name'),
    role: document.getElementById('f-role'),
    bio: document.getElementById('f-bio'),
  };
  const msgs = {
    email: document.getElementById('msg-email'),
    password: document.getElementById('msg-password'),
    confirm: document.getElementById('msg-confirm'),
  };
  const strengthBar = document.getElementById('strength-bar');
  const review = document.getElementById('review-preview');

  let current = 1;

  const draft = Bench.Storage.get(NS, 'draft', {});
  Object.keys(fields).forEach(k => { if (draft[k] !== undefined) fields[k].value = draft[k]; });

  function saveDraft() {
    const data = {};
    Object.keys(fields).forEach(k => { if (k !== 'password' && k !== 'confirm') data[k] = fields[k].value; });
    Bench.Storage.set(NS, 'draft', data);
    note.textContent = 'Draft saved';
    setTimeout(() => { note.textContent = ''; }, 1200);
  }
  const debouncedSave = Bench.debounce(saveDraft, 500);
  Object.values(fields).forEach(f => f.addEventListener('input', debouncedSave));

  function validateEmail() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value);
    msgs.email.textContent = fields.email.value && !ok ? 'Enter a valid email address.' : '';
    return ok;
  }

  function passwordScore(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  function validatePassword() {
    const pw = fields.password.value;
    const score = passwordScore(pw);
    const pct = (score / 4) * 100;
    strengthBar.style.width = pct + '%';
    strengthBar.style.background = score <= 1 ? '#e2685f' : score === 2 ? '#f0a868' : '#5ec8bd';
    const ok = pw.length >= 8;
    msgs.password.textContent = pw && !ok ? 'Use at least 8 characters.' : '';
    return ok;
  }

  function validateConfirm() {
    const ok = fields.confirm.value === fields.password.value && fields.confirm.value.length > 0;
    msgs.confirm.textContent = fields.confirm.value && !ok ? 'Passwords do not match.' : '';
    return ok;
  }

  fields.email.addEventListener('input', validateEmail);
  fields.password.addEventListener('input', () => { validatePassword(); validateConfirm(); });
  fields.confirm.addEventListener('input', validateConfirm);

  function validateStep(n) {
    if (n === 1) return validateEmail() && validatePassword() && validateConfirm();
    if (n === 2) return fields.name.value.trim().length > 0;
    return true;
  }

  function renderReview() {
    review.innerHTML = `
      <p><strong>Email:</strong> ${fields.email.value || '—'}</p>
      <p><strong>Name:</strong> ${fields.name.value || '—'}</p>
      <p><strong>Role:</strong> ${fields.role.value}</p>
      <p><strong>Bio:</strong> ${fields.bio.value || '—'}</p>`;
  }

  function showStep(n) {
    steps.forEach(s => s.classList.toggle('hidden', Number(s.dataset.step) !== n));
    dots.forEach(d => d.classList.toggle('is-active', Number(d.dataset.step) === n));
    btnBack.classList.toggle('hidden', n === 1);
    btnNext.classList.toggle('hidden', n === 3);
    btnSubmit.classList.toggle('hidden', n !== 3);
    if (n === 3) renderReview();
    current = n;
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(current)) { Bench.toast('Please fix the highlighted fields', 'error'); return; }
    if (current < 3) showStep(current + 1);
  });
  btnBack.addEventListener('click', () => { if (current > 1) showStep(current - 1); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    Bench.Storage.remove(NS, 'draft');
    Bench.toast('Account created (locally simulated)', 'success');
    form.reset();
    showStep(1);
    strengthBar.style.width = '0%';
  });

  showStep(1);
})();
