(function () {
  const NS = 'recipes';
  const searchInput = document.getElementById('recipe-search');
  const searchBtn = document.getElementById('recipe-search-btn');
  const grid = document.getElementById('recipe-grid');
  const empty = document.getElementById('recipe-empty');
  const loading = document.getElementById('recipe-loading');
  const filters = document.getElementById('recipe-filters');
  const modal = document.getElementById('recipe-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  let allMeals = [];   // full veg dataset (Vegetarian + Vegan), loaded once
  let results = [];    // current filtered view of allMeals
  let favorites = Bench.Storage.get(NS, 'favorites', []);
  let mode = 'all';
  let cookInterval = null;

  function isFav(id) { return favorites.some(f => f.id === id); }

  async function loadVegDataset() {
    loading.classList.remove('hidden');
    grid.innerHTML = '';
    empty.classList.add('hidden');
    try {
      const [vegetarian, vegan] = await Promise.all([
        fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian').then(r => r.json()),
        fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan').then(r => r.json())
      ]);
      const tag = (list, diet) => (list.meals || []).map(m => ({ idMeal: m.idMeal, strMeal: m.strMeal, strMealThumb: m.strMealThumb, strCategory: diet, strArea: '' }));
      const merged = [...tag(vegetarian, 'Vegetarian'), ...tag(vegan, 'Vegan')];
      const seen = new Set();
      allMeals = merged.filter(m => (seen.has(m.idMeal) ? false : (seen.add(m.idMeal), true)));
      results = allMeals;
      renderGrid();
    } catch (e) {
      Bench.toast('Could not reach the recipe API', 'error');
    } finally {
      loading.classList.add('hidden');
    }
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    results = q ? allMeals.filter(m => m.strMeal.toLowerCase().includes(q)) : allMeals;
    renderGrid();
  }

  function renderGrid() {
    const list = mode === 'favorites' ? favorites : results.map(m => ({ id: m.idMeal, name: m.strMeal, img: m.strMealThumb, category: m.strCategory, area: m.strArea }));
    grid.innerHTML = list.map(m => `
      <div class="recipe-card" data-id="${m.id}">
        <img src="${m.img}" alt="${m.name}" loading="lazy">
        <div class="recipe-card-body">
          <button class="recipe-fav-btn" data-fav="${m.id}">${isFav(m.id) ? '★' : '☆'}</button>
          <h4>${m.name}</h4>
          <span>${m.category || ''} ${m.area ? '· ' + m.area : ''}</span>
        </div>
      </div>`).join('');
    empty.classList.toggle('hidden', list.length > 0);
  }

  async function openRecipe(id) {
    loading.classList.remove('hidden');
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await res.json();
      const meal = data.meals[0];
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ing.trim()}`);
      }
      modalBody.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <p style="color:var(--muted-2); font-size:.85rem;">${meal.strCategory} · ${meal.strArea}</p>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="width:100%; border-radius:12px; margin:14px 0;">
        <h4>Ingredients</h4>
        <ul class="modal-ing-list">${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
        <h4>Method</h4>
        <p style="white-space:pre-line; font-size:.9rem;">${meal.strInstructions}</p>
        <div class="timer-row">
          <button class="btn btn-teal" id="cook-timer-btn">Start 10-min cook timer</button>
          <span class="timer-display" id="cook-timer-display"></span>
        </div>`;
      modal.classList.remove('hidden');
      document.getElementById('cook-timer-btn').addEventListener('click', startCookTimer);
    } catch (e) {
      Bench.toast('Could not load recipe details', 'error');
    } finally {
      loading.classList.add('hidden');
    }
  }

  function startCookTimer() {
    clearInterval(cookInterval);
    let remaining = 600;
    const display = document.getElementById('cook-timer-display');
    display.textContent = Bench.formatTime(remaining);
    cookInterval = setInterval(() => {
      remaining--;
      display.textContent = Bench.formatTime(remaining);
      if (remaining <= 0) { clearInterval(cookInterval); Bench.toast('Cook timer done!', 'success'); }
    }, 1000);
  }

  grid.addEventListener('click', e => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      const item = results.find(m => m.idMeal === id) || favorites.find(f => f.id === id);
      if (isFav(id)) favorites = favorites.filter(f => f.id !== id);
      else favorites.unshift({ id, name: item.strMeal || item.name, img: item.strMealThumb || item.img, category: item.strCategory || item.category, area: item.strArea || item.area });
      Bench.Storage.set(NS, 'favorites', favorites);
      renderGrid();
      return;
    }
    const card = e.target.closest('[data-id]');
    if (card) openRecipe(card.dataset.id);
  });

  filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-f]'); if (!btn) return;
    filters.querySelectorAll('[data-f]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    mode = btn.dataset.f;
    renderGrid();
  });

  modalClose.addEventListener('click', () => { modal.classList.add('hidden'); clearInterval(cookInterval); });

  searchBtn.addEventListener('click', () => search(searchInput.value));
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') search(searchInput.value); });

  loadVegDataset();
})();