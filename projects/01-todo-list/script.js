(function(){
  const NS = 'todo';
  const els = {
    title: document.getElementById('task-title'),
    category: document.getElementById('task-category'),
    priority: document.getElementById('task-priority'),
    add: document.getElementById('add-task'),
    search: document.getElementById('task-search'),
    filters: document.getElementById('category-filters'),
    hideDone: document.getElementById('hide-done'),
    list: document.getElementById('task-list'),
    empty: document.getElementById('task-empty'),
    stats: document.getElementById('task-stats'),
    clearDone: document.getElementById('clear-done'),
  };

  let tasks = Bench.Storage.get(NS, 'tasks', []);
  let activeCat = 'All';
  let query = '';
  let dragId = null;

  function save(){ Bench.Storage.set(NS, 'tasks', tasks); }

  function render(){
    const q = query.trim().toLowerCase();
    const visible = tasks.filter(t=>{
      const matchCat = activeCat === 'All' || t.category === activeCat;
      const matchQ = !q || t.title.toLowerCase().includes(q);
      const matchDone = !els.hideDone.checked || !t.done;
      return matchCat && matchQ && matchDone;
    });
    els.list.innerHTML = visible.map(t => `
      <li class="task-item ${t.done ? 'is-done':''}" draggable="true" data-id="${t.id}">
        <input type="checkbox" ${t.done?'checked':''} data-action="toggle">
        <span class="task-title">${escapeHtml(t.title)}</span>
        <span class="task-tag">${t.category}</span>
        <span class="task-tag priority-${t.priority}">${t.priority}</span>
        <button class="task-del" data-action="delete" aria-label="Delete task">✕</button>
      </li>`).join('');
    els.empty.classList.toggle('hidden', visible.length > 0);
    const doneCount = tasks.filter(t=>t.done).length;
    els.stats.textContent = `${tasks.length} task${tasks.length!==1?'s':''} · ${doneCount} done`;
  }

  function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function addTask(){
    const title = els.title.value.trim();
    if(!title){ Bench.toast('Type a task first', 'warn'); return; }
    tasks.unshift({ id: crypto.randomUUID(), title, category: els.category.value, priority: els.priority.value, done:false });
    els.title.value='';
    save(); render();
    Bench.toast('Task added', 'success');
  }

  els.add.addEventListener('click', addTask);
  els.title.addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });
  els.search.addEventListener('input', Bench.debounce(e=>{ query = e.target.value; render(); }, 150));
  els.hideDone.addEventListener('change', render);

  els.filters.addEventListener('click', e=>{
    const btn = e.target.closest('[data-cat]'); if(!btn) return;
    els.filters.querySelectorAll('[data-cat]').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeCat = btn.dataset.cat; render();
  });

  els.list.addEventListener('click', e=>{
    const li = e.target.closest('[data-id]'); if(!li) return;
    const id = li.dataset.id;
    if(e.target.dataset.action === 'toggle'){
      tasks = tasks.map(t=> t.id===id ? {...t, done: !t.done} : t); save(); render();
    }
    if(e.target.dataset.action === 'delete'){
      tasks = tasks.filter(t=>t.id!==id); save(); render();
    }
  });

  els.clearDone.addEventListener('click', ()=>{
    tasks = tasks.filter(t=>!t.done); save(); render();
  });

  // drag and drop reorder
  els.list.addEventListener('dragstart', e=>{
    const li = e.target.closest('[data-id]'); if(!li) return;
    dragId = li.dataset.id; li.classList.add('dragging');
  });
  els.list.addEventListener('dragend', e=>{
    const li = e.target.closest('[data-id]'); if(li) li.classList.remove('dragging');
    dragId = null;
  });
  els.list.addEventListener('dragover', e=>{
    e.preventDefault();
    const after = [...els.list.querySelectorAll('[data-id]:not(.dragging)')].find(li=>{
      const r = li.getBoundingClientRect();
      return e.clientY < r.top + r.height/2;
    });
    const draggingEl = els.list.querySelector('.dragging');
    if(!draggingEl) return;
    if(after) els.list.insertBefore(draggingEl, after);
    else els.list.appendChild(draggingEl);
  });
  els.list.addEventListener('drop', ()=>{
    const order = [...els.list.querySelectorAll('[data-id]')].map(li=>li.dataset.id);
    tasks.sort((a,b)=> order.indexOf(a.id) - order.indexOf(b.id));
    save();
  });

  render();
})();
