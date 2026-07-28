/**
 * Bench.Storage — a tiny namespaced LocalStorage wrapper shared by every
 * project in the suite. Namespacing keeps 20 apps from colliding keys.
 *
 * Usage:
 *   Bench.Storage.get('todo', 'tasks', []);
 *   Bench.Storage.set('todo', 'tasks', tasks);
 *   Bench.Storage.remove('todo', 'tasks');
 */
window.Bench = window.Bench || {};

Bench.Storage = (function () {
  const PREFIX = 'bench:';

  function key(ns, name) {
    return `${PREFIX}${ns}:${name}`;
  }

  function get(ns, name, fallback = null) {
    try {
      const raw = localStorage.getItem(key(ns, name));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Bench.Storage.get failed', e);
      return fallback;
    }
  }

  function set(ns, name, value) {
    try {
      localStorage.setItem(key(ns, name), JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Bench.Storage.set failed', e);
      return false;
    }
  }

  function remove(ns, name) {
    localStorage.removeItem(key(ns, name));
  }

  function clearNamespace(ns) {
    const prefix = key(ns, '');
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k));
  }

  return { get, set, remove, clearNamespace };
})();

/** Small helper: debounce for autosave / search inputs, used across projects */
Bench.debounce = function (fn, wait = 300) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

/** Small helper: format a Date as HH:MM:SS or MM:SS */
Bench.formatTime = function (totalSeconds, showHours = false) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return showHours || h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** Toast notification, shared minimal implementation */
Bench.toast = function (message, type = 'info') {
  let host = document.getElementById('bench-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'bench-toast-host';
    host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(host);
  }
  const colors = { info: '#5ec8bd', success: '#5ec8bd', error: '#e2685f', warn: '#f0a868' };
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    background:#1a1f2a; color:#e8e6e1; border-left:3px solid ${colors[type] || colors.info};
    padding:12px 16px; border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:13px;
    box-shadow:0 10px 30px -8px rgba(0,0,0,0.6); opacity:0; transform: translateY(8px);
    transition: all .25s ease; max-width:280px;`;
  host.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 250);
  }, 2600);
};
