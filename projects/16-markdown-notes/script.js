(function () {
  const NS = 'markdown';
  const listEl = document.getElementById('notes-list');
  const searchEl = document.getElementById('notes-search');
  const titleEl = document.getElementById('note-title');
  const tagsEl = document.getElementById('note-tags');
  const bodyEl = document.getElementById('note-body');
  const previewEl = document.getElementById('note-preview');
  const newBtn = document.getElementById('new-note');
  const deleteBtn = document.getElementById('delete-note');
  const exportBtn = document.getElementById('export-note');
  const wordCount = document.getElementById('word-count');
  const saveStatus = document.getElementById('save-status');

  let notes = Bench.Storage.get(NS, 'notes', []);
  let activeId = notes[0]?.id;
  let query = '';

  // tiny markdown -> html
  function renderMarkdown(src) {
    let html = src
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/^- (.*)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
    html = html.split('\n\n').map(p => (/^<(h\d|ul|pre|blockquote)/.test(p.trim()) ? p : `<p>${p}</p>`)).join('\n');
    return html;
  }

  function save() { Bench.Storage.set(NS, 'notes', notes); }

  function currentNote() { return notes.find(n => n.id === activeId); }

  function renderList() {
    const q = query.trim().toLowerCase();
    const filtered = notes.filter(n => !q || n.title.toLowerCase().includes(q) || n.tags.join(' ').toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    listEl.innerHTML = filtered.map(n => `
      <li data-id="${n.id}" class="${n.id === activeId ? 'is-active' : ''}">
        ${n.title || 'Untitled note'}
        <small>${n.tags.join(', ') || 'no tags'}</small>
      </li>`).join('') || '<li style="cursor:default;">No notes found.</li>';
  }

  function renderEditor() {
    const n = currentNote();
    if (!n) {
      titleEl.value = ''; tagsEl.value = ''; bodyEl.value = '';
      previewEl.innerHTML = '<p style="color:var(--muted-2)">Create a note to get started.</p>';
      wordCount.textContent = '0 words';
      return;
    }
    titleEl.value = n.title;
    tagsEl.value = n.tags.join(', ');
    bodyEl.value = n.body;
    previewEl.innerHTML = renderMarkdown(n.body || '');
    wordCount.textContent = `${(n.body.trim().match(/\S+/g) || []).length} words`;
  }

  function updateActive(patch) {
    const n = currentNote();
    if (!n) return;
    Object.assign(n, patch);
    save();
    saveStatus.textContent = 'Saved';
    setTimeout(() => { saveStatus.textContent = ''; }, 1000);
    renderList();
  }

  const debouncedUpdate = Bench.debounce(() => {
    updateActive({
      title: titleEl.value || 'Untitled note',
      tags: tagsEl.value.split(',').map(t => t.trim()).filter(Boolean),
      body: bodyEl.value,
    });
    previewEl.innerHTML = renderMarkdown(bodyEl.value);
    wordCount.textContent = `${(bodyEl.value.trim().match(/\S+/g) || []).length} words`;
  }, 350);

  [titleEl, tagsEl, bodyEl].forEach(el => el.addEventListener('input', debouncedUpdate));

  newBtn.addEventListener('click', () => {
    const n = { id: crypto.randomUUID(), title: 'Untitled note', tags: [], body: '' };
    notes.unshift(n);
    activeId = n.id;
    save(); renderList(); renderEditor();
    titleEl.focus();
  });

  deleteBtn.addEventListener('click', () => {
    if (!currentNote()) return;
    notes = notes.filter(n => n.id !== activeId);
    activeId = notes[0]?.id;
    save(); renderList(); renderEditor();
  });

  exportBtn.addEventListener('click', () => {
    const n = currentNote(); if (!n) return;
    const blob = new Blob([`# ${n.title}\n\n${n.body}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(n.title || 'note').replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
  });

  listEl.addEventListener('click', e => {
    const li = e.target.closest('[data-id]'); if (!li) return;
    activeId = li.dataset.id;
    renderList(); renderEditor();
  });

  searchEl.addEventListener('input', Bench.debounce(e => { query = e.target.value; renderList(); }, 150));

  if (!notes.length) {
    notes.push({ id: crypto.randomUUID(), title: 'Welcome', tags: ['guide'], body: '# Welcome to Markdown Bench\n\nWrite on the left, see it rendered on the right.\n\n- Supports **bold**, *italic*, `code`\n- Headings with `#`\n- > blockquotes\n\nYour notes save automatically.' });
    activeId = notes[0].id;
    save();
  }

  renderList();
  renderEditor();
})();
