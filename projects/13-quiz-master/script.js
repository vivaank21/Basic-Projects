(function () {
  const NS = 'quiz';
  const QUESTIONS = {
    science: [
      { q: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], a: 1 },
      { q: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], a: 2 },
      { q: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], a: 2 },
      { q: 'What is the chemical symbol for gold?', options: ['Ag', 'Au', 'Gd', 'Go'], a: 1 },
      { q: 'How many bones are in the adult human body?', options: ['186', '206', '226', '256'], a: 1 },
      { q: 'What force pulls objects toward Earth?', options: ['Magnetism', 'Friction', 'Gravity', 'Tension'], a: 2 },
      { q: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Hydrogen peroxide', 'Oxygen'], a: 1 },
      { q: 'Which planet has the most moons?', options: ['Earth', 'Mars', 'Saturn', 'Mercury'], a: 2 },
    ],
    history: [
      { q: 'In what year did World War II end?', options: ['1943', '1945', '1947', '1950'], a: 1 },
      { q: 'Who was the first President of the United States?', options: ['Jefferson', 'Adams', 'Washington', 'Lincoln'], a: 2 },
      { q: 'The Great Wall is located in which country?', options: ['India', 'China', 'Japan', 'Mongolia'], a: 1 },
      { q: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Da Vinci', 'Raphael', 'Donatello'], a: 1 },
      { q: 'Which empire built the Taj Mahal?', options: ['Mughal', 'Maurya', 'Gupta', 'Chola'], a: 0 },
      { q: 'The French Revolution began in which year?', options: ['1789', '1799', '1804', '1776'], a: 0 },
      { q: 'Who was known as the Iron Lady?', options: ['Indira Gandhi', 'Angela Merkel', 'Margaret Thatcher', 'Golda Meir'], a: 2 },
      { q: 'Which ancient wonder stood in Alexandria?', options: ['Colossus of Rhodes', 'Lighthouse', 'Hanging Gardens', 'Great Pyramid'], a: 1 },
    ],
    code: [
      { q: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style System', 'Computer Style Sheets', 'Colorful Style Sheets'], a: 0 },
      { q: 'Which symbol starts a comment in JavaScript?', options: ['#', '//', '<!--', '%%'], a: 1 },
      { q: 'What does API stand for?', options: ['Applied Program Interface', 'Application Programming Interface', 'Automated Program Input', 'App Process Integration'], a: 1 },
      { q: 'Which HTML tag creates a hyperlink?', options: ['<link>', '<a>', '<href>', '<url>'], a: 1 },
      { q: 'What does JSON stand for?', options: ['JavaScript Object Notation', 'Java Standard Object Notation', 'JavaScript Ordered Numbers', 'Joined Syntax Object Node'], a: 0 },
      { q: 'Which company created React?', options: ['Google', 'Meta', 'Microsoft', 'Amazon'], a: 1 },
      { q: 'What keyword declares a constant in JS?', options: ['var', 'let', 'const', 'static'], a: 2 },
      { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Logic', 'System Query List', 'Server Question Language'], a: 0 },
    ],
    geo: [
      { q: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], a: 1 },
      { q: 'Which country has the most population?', options: ['USA', 'India', 'China', 'Indonesia'], a: 1 },
      { q: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'Nauru', 'San Marino'], a: 1 },
      { q: 'Which desert is the largest in the world?', options: ['Sahara', 'Gobi', 'Antarctic', 'Kalahari'], a: 2 },
      { q: 'Mount Everest is located on the border of Nepal and which country?', options: ['India', 'China', 'Bhutan', 'Pakistan'], a: 1 },
      { q: 'Which continent has the most countries?', options: ['Asia', 'Europe', 'Africa', 'South America'], a: 2 },
      { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], a: 2 },
      { q: 'Which sea has the highest salt concentration?', options: ['Red Sea', 'Dead Sea', 'Black Sea', 'Caspian Sea'], a: 1 },
    ],
  };

  const catSelect = document.getElementById('category-select');
  const quizCard = document.getElementById('quiz-card');
  const resultsCard = document.getElementById('results-card');
  const progressEl = document.getElementById('quiz-progress');
  const timerEl = document.getElementById('quiz-timer');
  const flipInner = document.getElementById('flip-inner');
  const questionText = document.getElementById('question-text');
  const optionsGrid = document.getElementById('options-grid');
  const answerReveal = document.getElementById('answer-reveal');
  const resultsScore = document.getElementById('results-score');
  const resultsBreakdown = document.getElementById('results-breakdown');
  const resultsRetry = document.getElementById('results-retry');
  const topscoresList = document.getElementById('topscores-list');

  let deck = [], qi = 0, score = 0, timer = null, timeLeft = 15;
  let topscores = Bench.Storage.get(NS, 'topscores', []);

  function renderTopscores() {
    topscoresList.innerHTML = topscores.map(t => `<li>${t.score}/8 — ${t.category} — ${t.date}</li>`).join('') || '<li>No runs yet.</li>';
  }

  function startQuiz(cat) {
    deck = [...QUESTIONS[cat]];
    qi = 0; score = 0;
    catSelect.classList.add('hidden');
    resultsCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    showQuestion();
  }

  function showQuestion() {
    flipInner.classList.remove('is-flipped');
    const item = deck[qi];
    progressEl.textContent = `Q${qi + 1} / ${deck.length}`;
    questionText.textContent = item.q;
    optionsGrid.innerHTML = item.options.map((o, i) => `<button class="option-btn" data-i="${i}">${o}</button>`).join('');
    timeLeft = 15;
    timerEl.textContent = `${timeLeft}s`;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) selectAnswer(-1);
    }, 1000);
  }

  function selectAnswer(chosen) {
    clearInterval(timer);
    const item = deck[qi];
    const correct = chosen === item.a;
    if (correct) score++;
    [...optionsGrid.children].forEach((btn, i) => {
      if (i === item.a) btn.classList.add('correct');
      if (i === chosen && !correct) btn.classList.add('wrong');
    });
    answerReveal.textContent = correct ? '✅ Correct!' : `❌ Correct answer: ${item.options[item.a]}`;
    flipInner.classList.add('is-flipped');
    setTimeout(() => {
      qi++;
      if (qi < deck.length) showQuestion();
      else finishQuiz();
    }, 1400);
  }

  optionsGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-i]'); if (!btn) return;
    selectAnswer(+btn.dataset.i);
  });

  let currentCat = '';
  function finishQuiz() {
    quizCard.classList.add('hidden');
    resultsCard.classList.remove('hidden');
    resultsScore.textContent = `You scored ${score} / ${deck.length}`;
    resultsBreakdown.textContent = score === deck.length ? 'Perfect run!' : score >= deck.length / 2 ? 'Solid effort.' : 'Room to improve — try again!';
    topscores.push({ score, category: currentCat, date: new Date().toLocaleDateString() });
    topscores.sort((a, b) => b.score - a.score);
    topscores = topscores.slice(0, 6);
    Bench.Storage.set(NS, 'topscores', topscores);
    renderTopscores();
  }

  catSelect.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]'); if (!btn) return;
    currentCat = btn.dataset.cat;
    startQuiz(currentCat);
  });

  resultsRetry.addEventListener('click', () => {
    resultsCard.classList.add('hidden');
    catSelect.classList.remove('hidden');
  });

  renderTopscores();
})();
