(function () {
  const NS = 'soundeck';
  const canvas = document.getElementById('visualizer');
  const ctx2d = canvas.getContext('2d');
  const audioEl = document.getElementById('audio-el');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const seekBar = document.getElementById('seek-bar');
  const volumeBar = document.getElementById('volume-bar');
  const eqBar = document.getElementById('eq-bar');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const trackTitle = document.getElementById('track-title');
  const trackSub = document.getElementById('track-sub');
  const fileUpload = document.getElementById('file-upload');
  const playlistEl = document.getElementById('playlist');

  let audioCtx, analyser, sourceNode, gainNode, filterNode;
  let demoOsc = null, demoGain = null;
  let playing = false;
  let mode = 'idle'; // 'file' | 'demo'
  let demoTimer = null;
  let demoElapsed = 0;

  const DEMO_TRACKS = [
    { name: 'Amber Drift', freq: 220, wave: 'sine', duration: 60 },
    { name: 'Teal Pulse', freq: 174, wave: 'triangle', duration: 60 },
    { name: 'Bench Hum', freq: 130, wave: 'sawtooth', duration: 60 },
  ];
  let playlist = [...DEMO_TRACKS.map((t, i) => ({ ...t, id: 'demo-' + i, type: 'demo' }))];
  let uploaded = Bench.Storage.get(NS, 'uploadedName', null);
  let activeIndex = 0;

  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      gainNode = audioCtx.createGain();
      filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'lowshelf';
      gainNode.connect(filterNode);
      filterNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
  }

  function renderPlaylist() {
    playlistEl.innerHTML = playlist.map((t, i) => `
      <li data-i="${i}" class="${i === activeIndex ? 'is-active' : ''}">
        <span>${t.name}</span><span>${t.type === 'demo' ? 'demo' : 'upload'}</span>
      </li>`).join('');
  }

  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    ctx2d.fillStyle = '#0c0e13';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const barWidth = canvas.width / data.length;
    data.forEach((v, i) => {
      const h = (v / 255) * canvas.height;
      ctx2d.fillStyle = i % 2 === 0 ? '#f0a868' : '#5ec8bd';
      ctx2d.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h);
    });
  }

  function loadTrack(i) {
    stopAll();
    activeIndex = i;
    const t = playlist[i];
    trackTitle.textContent = t.name;
    trackSub.textContent = t.type === 'demo' ? 'Procedural demo tone — press play' : 'Uploaded track';
    timeTotal.textContent = Bench.formatTime(t.duration || 0);
    seekBar.value = 0;
    renderPlaylist();
    if (t.type === 'file') {
      mode = 'file';
    } else {
      mode = 'demo';
    }
  }

  function playDemo() {
    ensureAudioCtx();
    const t = playlist[activeIndex];
    demoOsc = audioCtx.createOscillator();
    demoOsc.type = t.wave;
    demoOsc.frequency.value = t.freq;
    demoGain = audioCtx.createGain();
    demoGain.gain.value = 0.15;
    demoOsc.connect(demoGain);
    demoGain.connect(gainNode);
    demoOsc.start();
    demoElapsed = 0;
    clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      demoElapsed++;
      seekBar.value = (demoElapsed / t.duration) * 100;
      timeCurrent.textContent = Bench.formatTime(demoElapsed);
      if (demoElapsed >= t.duration) next();
    }, 1000);
  }

  function stopDemo() {
    clearInterval(demoTimer);
    if (demoOsc) { try { demoOsc.stop(); } catch (e) {} demoOsc = null; }
  }

  function playFile() {
    ensureAudioCtx();
    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      sourceNode.connect(gainNode);
    }
    audioCtx.resume();
    audioEl.play();
  }

  function stopAll() {
    stopDemo();
    audioEl.pause();
    playing = false;
    playBtn.textContent = '▶';
  }

  function togglePlay() {
    ensureAudioCtx();
    audioCtx.resume();
    if (playing) {
      if (mode === 'demo') stopDemo(); else audioEl.pause();
      playing = false;
      playBtn.textContent = '▶';
    } else {
      if (mode === 'demo') playDemo(); else playFile();
      playing = true;
      playBtn.textContent = '⏸';
    }
  }

  function next() { loadTrack((activeIndex + 1) % playlist.length); if (playing) togglePlay(); }
  function prev() { loadTrack((activeIndex - 1 + playlist.length) % playlist.length); if (playing) togglePlay(); }

  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  volumeBar.addEventListener('input', () => {
    ensureAudioCtx();
    gainNode.gain.value = volumeBar.value / 100;
  });
  eqBar.addEventListener('input', () => {
    ensureAudioCtx();
    filterNode.gain.value = +eqBar.value;
  });

  audioEl.addEventListener('loadedmetadata', () => { timeTotal.textContent = Bench.formatTime(audioEl.duration); });
  audioEl.addEventListener('timeupdate', () => {
    if (mode !== 'file') return;
    timeCurrent.textContent = Bench.formatTime(audioEl.currentTime);
    seekBar.value = (audioEl.currentTime / audioEl.duration) * 100 || 0;
  });
  audioEl.addEventListener('ended', next);

  seekBar.addEventListener('input', () => {
    if (mode === 'file') {
      audioEl.currentTime = (seekBar.value / 100) * audioEl.duration;
    }
  });

  fileUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audioEl.src = url;
    const track = { name: file.name.replace(/\.[^.]+$/, ''), type: 'file', id: 'file-' + Date.now(), duration: 0 };
    playlist = playlist.filter(t => t.type !== 'file');
    playlist.push(track);
    Bench.Storage.set(NS, 'uploadedName', track.name);
    loadTrack(playlist.length - 1);
    Bench.toast('Track loaded', 'success');
  });

  playlistEl.addEventListener('click', e => {
    const li = e.target.closest('[data-i]'); if (!li) return;
    const wasPlaying = playing;
    loadTrack(+li.dataset.i);
    if (wasPlaying) togglePlay();
  });

  renderPlaylist();
  loadTrack(0);
  drawVisualizer();
})();
