(function () {
  const NS = 'pomodoro';
  const ringBar = document.getElementById('ring-bar');
  const ringTime = document.getElementById('ring-time');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');
  const modeBtns = [...document.querySelectorAll('[data-mode]')];
  const setWork = document.getElementById('set-work');
  const setShort = document.getElementById('set-short');
  const setLong = document.getElementById('set-long');
  const streakCount = document.getElementById('streak-count');
  const todayCount = document.getElementById('today-count');
  const linkedTask = document.getElementById('linked-task');

  const CIRCUMFERENCE = 2 * Math.PI * 90;
  let mode = 'work';
  let totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let running = false;
  let interval = null;

  const settings = Bench.Storage.get(NS, 'settings', { work: 25, short: 5, long: 15 });
  setWork.value = settings.work; setShort.value = settings.short; setLong.value = settings.long;

  const streakData = Bench.Storage.get(NS, 'streak', { lastDate: null, streak: 0, todayCount: 0 });
  updateStreakDisplay();

  function durationFor(m) {
    return { work: +setWork.value, short: +setShort.value, long: +setLong.value }[m] * 60;
  }

  function setMode(m) {
    mode = m;
    modeBtns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === m));
    totalSeconds = durationFor(m);
    remaining = totalSeconds;
    running = false;
    clearInterval(interval);
    toggleBtn.textContent = 'Start';
    render();
  }

  function render() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    ringTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const pct = remaining / totalSeconds;
    ringBar.style.strokeDasharray = String(CIRCUMFERENCE);
    ringBar.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
  }

  function tick() {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      running = false;
      toggleBtn.textContent = 'Start';
      if (mode === 'work') logCompletion();
      Bench.toast(mode === 'work' ? 'Focus session complete — take a break!' : 'Break over — back to it!', 'success');
      remaining = 0;
    }
    render();
  }

  function logCompletion() {
    const today = new Date().toDateString();
    if (streakData.lastDate === today) {
      streakData.todayCount++;
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streakData.streak = streakData.lastDate === yesterday ? streakData.streak + 1 : 1;
      streakData.lastDate = today;
      streakData.todayCount = 1;
    }
    Bench.Storage.set(NS, 'streak', streakData);
    updateStreakDisplay();
  }

  function updateStreakDisplay() {
    streakCount.textContent = streakData.streak;
    const today = new Date().toDateString();
    todayCount.textContent = streakData.lastDate === today ? streakData.todayCount : 0;
  }

  toggleBtn.addEventListener('click', () => {
    running = !running;
    toggleBtn.textContent = running ? 'Pause' : 'Resume';
    if (running) interval = setInterval(tick, 1000);
    else clearInterval(interval);
  });

  resetBtn.addEventListener('click', () => { setMode(mode); });

  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  [setWork, setShort, setLong].forEach(inp => inp.addEventListener('change', () => {
    Bench.Storage.set(NS, 'settings', { work: +setWork.value, short: +setShort.value, long: +setLong.value });
    if (!running) setMode(mode);
  }));

  linkedTask.addEventListener('input', Bench.debounce(() => Bench.Storage.set(NS, 'task', linkedTask.value), 400));
  linkedTask.value = Bench.Storage.get(NS, 'task', '');

  setMode('work');
})();
