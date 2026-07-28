(function () {
  const NS = 'slider';
  const slides = [
    { img: 'https://picsum.photos/seed/bench-forge/1200/700', title: 'The Forge', desc: 'Where the raw ideas get their first shape.' },
    { img: 'https://picsum.photos/seed/bench-wood/1200/700', title: 'Workbench', desc: 'Every tool here started as a rough sketch.' },
    { img: 'https://picsum.photos/seed/bench-tools/1200/700', title: 'Toolwall', desc: 'Twenty hooks, twenty small machines.' },
    { img: 'https://picsum.photos/seed/bench-light/1200/700', title: 'Morning Light', desc: 'Best ideas arrive before the coffee does.' },
    { img: 'https://picsum.photos/seed/bench-notes/1200/700', title: 'Notes & Sketches', desc: 'The plan always changes once you start building.' },
  ];

  const track = document.getElementById('slider-track');
  const dotsWrap = document.getElementById('slider-dots');
  const thumbsWrap = document.getElementById('slider-thumbs');
  const playBtn = document.getElementById('slider-play');
  let index = 0;
  let playing = true;
  let timer = null;

  track.innerHTML = slides.map(s => `
    <div class="slide">
      <img src="${s.img}" alt="${s.title}" loading="lazy">
      <div class="slide-caption"><h3>${s.title}</h3><p>${s.desc}</p></div>
    </div>`).join('');

  dotsWrap.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('');
  thumbsWrap.innerHTML = slides.map((s, i) => `<img src="${s.img}" data-i="${i}" alt="thumb ${i + 1}">`).join('');

  function render() {
    track.style.transform = `translateX(-${index * 100}%)`;
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('is-active', i === index));
    [...thumbsWrap.children].forEach((t, i) => t.classList.toggle('is-active', i === index));
  }

  function go(i) { index = (i + slides.length) % slides.length; render(); }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  document.getElementById('arrow-next').addEventListener('click', () => { next(); restart(); });
  document.getElementById('arrow-prev').addEventListener('click', () => { prev(); restart(); });
  dotsWrap.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { go(+b.dataset.i); restart(); } });
  thumbsWrap.addEventListener('click', e => { const t = e.target.closest('[data-i]'); if (t) { go(+t.dataset.i); restart(); } });

  function startAutoplay() { timer = setInterval(next, 4000); }
  function restart() { clearInterval(timer); if (playing) startAutoplay(); }

  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? '⏸' : '▶';
    clearInterval(timer);
    if (playing) startAutoplay();
  });

  const slider = document.getElementById('slider');
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', () => { if (playing) startAutoplay(); });

  let touchStartX = null;
  slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; clearInterval(timer); });
  slider.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    touchStartX = null;
    if (playing) startAutoplay();
  });

  render();
  startAutoplay();
})();
