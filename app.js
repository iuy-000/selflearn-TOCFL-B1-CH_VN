
const state = {
  units: window.APP_DATA.units,
  quotes: window.APP_DATA.quotes,
  currentUnit: 1,
  currentScreen: 'homeScreen',
  history: ['homeScreen'],
  settings: {
    showPinyinFront: false,
    reverseDirection: false,
  },
  flash: {
    view: 'grid',
    gridSize: 12,
    pool: [],
    singleIndex: 0,
    singleFlipped: false,
  },
  quiz: {
    timer: null,
    duration: 90,
    remaining: 90,
    active: false,
    score: 0,
    asked: 0,
    queue: [],
    current: null,
    wrongOnly: false,
    usedIds: [],
  },
  match: {
    timer: null,
    duration: 40,
    remaining: 40,
    active: false,
    board: [],
    selected: null,
    pairsDone: 0,
    roundHistory: [],
    currentRoundIds: [],
  },
  mistakeMap: loadJSON('mistakeMap', {}),
  learnedMap: loadJSON('learnedMap', {}),
};

const el = {};
document.querySelectorAll('[id]').forEach(node => el[node.id] = node);

function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function shuffle(arr){ return [...arr].sort(() => Math.random() - 0.5); }
function sample(arr, n){ return shuffle(arr).slice(0, Math.min(n, arr.length)); }
function uniqBy(arr, keyFn){ const seen=new Set(); return arr.filter(x => { const k=keyFn(x); if(seen.has(k)) return false; seen.add(k); return true; }); }
function getUnit(unitNum){ return state.units.find(u => u.unit === unitNum); }
function getCurrentWords(){ return getUnit(state.currentUnit).words; }
function dirLabel(){ return state.settings.reverseDirection ? '越文 → 中文' : '中文 → 越文'; }
function frontOf(word){ return state.settings.reverseDirection ? word.vi : word.zh; }
function backOf(word){ return state.settings.reverseDirection ? word.zh : word.vi; }
function promptOf(word){ return frontOf(word); }
function answerOf(word){ return backOf(word); }
function markMistake(word){ state.mistakeMap[word.id] = (state.mistakeMap[word.id] || 0) + 1; saveJSON('mistakeMap', state.mistakeMap); }
function markLearned(word){ state.learnedMap[word.id] = (state.learnedMap[word.id] || 0) + 1; saveJSON('learnedMap', state.learnedMap); }

function showScreen(id, pushHistory=true){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(pushHistory && state.currentScreen !== id){ state.history.push(id); }
  state.currentScreen = id;
}

function goBack(){
  closeSettings();
  if (state.currentScreen === 'menuScreen') return showScreen('homeScreen', false);
  if (state.currentScreen === 'homeScreen') return;
  if (state.currentScreen === 'quizScreen' || state.currentScreen === 'matchScreen') {
    stopQuiz(); stopMatchTimer();
    return showScreen('menuScreen', false);
  }
  showScreen('menuScreen', false);
}

function populateHome(){
  const quote = state.quotes[Math.floor(Math.random()*state.quotes.length)];
  el.quoteZh.textContent = quote.zh;
  el.quoteVi.textContent = quote.vi;
  el.unitSelect.innerHTML = state.units.map(u => `<option value="${u.unit}">單元 ${u.unit}</option>`).join('');
  el.unitSelect.value = String(state.currentUnit);
}

function renderMenu(){
  el.menuUnitTitle.textContent = `單元 ${state.currentUnit}`;
}

function openSettings(){
  el.settingsSheet.classList.remove('hidden');
  el.pinyinToggle.checked = state.settings.showPinyinFront;
  el.directionToggle.checked = state.settings.reverseDirection;
  el.directionHelp.textContent = `目前：${dirLabel()}`;
}
function closeSettings(){ el.settingsSheet.classList.add('hidden'); }

function renderWordList(){
  el.wordlistTitle.textContent = '單字表';
  el.wordlistContainer.innerHTML = getCurrentWords().map(word => `
    <div class="word-item">
      <div class="word-zh">${word.zh}</div>
      <div class="word-pinyin">${word.pinyin || '&nbsp;'}</div>
      <div class="word-vi">${word.vi}</div>
    </div>
  `).join('');
}

function buildFlashPool(size=state.flash.gridSize){
  state.flash.pool = sample(getCurrentWords(), size);
  state.flash.singleIndex = 0;
  state.flash.singleFlipped = false;
}
function renderFlashGrid(){
  const cols = state.flash.gridSize === 8 ? 2 : state.flash.gridSize === 12 ? 3 : 4;
  el.flashGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.flashGrid.innerHTML = state.flash.pool.map(word => `
    <button class="flash-card" data-flash-id="${word.id}">
      <div class="flash-card-inner">
        <div class="flash-face flash-front">
          <div>
            <div class="flash-main">${frontOf(word)}</div>
            <div class="flash-sub">${state.settings.showPinyinFront && !state.settings.reverseDirection ? word.pinyin : '&nbsp;'}</div>
          </div>
        </div>
        <div class="flash-face flash-back">
          <div class="flash-main">${word.zh}</div>
          <div class="flash-sub">${word.pinyin || ''}</div>
          <div class="flash-sub">${word.vi}</div>
        </div>
      </div>
    </button>
  `).join('');
}
function renderFlashSingle(){
  const word = state.flash.pool[state.flash.singleIndex];
  if(!word){ buildFlashPool(Math.max(state.flash.gridSize, 8)); return renderFlashSingle(); }
  const frontPinyin = state.settings.showPinyinFront && !state.settings.reverseDirection ? word.pinyin : '';
  el.flashSingleCard.classList.toggle('flipped', !!state.flash.singleFlipped);
  el.flashSingleCard.innerHTML = `
    <div class="single-front">
      <div class="single-main">${frontOf(word)}</div>
      <div class="single-sub">${frontPinyin || '&nbsp;'}</div>
    </div>
    <div class="single-back">
      <div class="single-main">${word.zh}</div>
      <div class="single-sub">${word.pinyin || ''}</div>
      <div class="single-sub">${word.vi}</div>
    </div>
  `;
}
function nextSingle(learned=false){
  const word = state.flash.pool[state.flash.singleIndex];
  if(word && learned) markLearned(word);
  if (state.flash.singleIndex < state.flash.pool.length - 1) {
    state.flash.singleIndex += 1;
  } else {
    buildFlashPool(Math.max(state.flash.gridSize, 8));
  }
  state.flash.singleFlipped = false;
  renderFlashSingle();
}
function prevSingle(){
  if (state.flash.singleIndex > 0) state.flash.singleIndex -= 1;
  state.flash.singleFlipped = false;
  renderFlashSingle();
}
function renderFlash(){
  document.querySelectorAll('.segment-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.flashView === state.flash.view));
  el.flashGridWrap.classList.toggle('active', state.flash.view === 'grid');
  el.flashSingleWrap.classList.toggle('active', state.flash.view === 'single');
  if(!state.flash.pool.length) buildFlashPool(state.flash.gridSize);
  if(state.flash.view === 'grid') renderFlashGrid(); else renderFlashSingle();
}


function refreshQuizCurrent(){
  const word = state.quiz.current;
  if(!word) return;
  el.quizPrompt.textContent = promptOf(word);
  el.quizPromptPinyin.textContent = (state.settings.reverseDirection || !state.settings.showPinyinFront) ? '' : (word.pinyin || '');
  document.querySelectorAll('.quiz-option').forEach(btn => {
    const opt = getCurrentWords().find(w => w.id === btn.dataset.quizId);
    if(opt) btn.textContent = answerOf(opt);
  });
}

function buildQuizQueue(wrongOnly=false){
  const all = getCurrentWords();
  let pool = all;
  if (wrongOnly) {
    pool = all.filter(w => state.mistakeMap[w.id]);
    if (!pool.length) pool = all;
  }
  state.quiz.queue = shuffle(pool);
  state.quiz.usedIds = [];
}
function startQuiz(wrongOnly=false){
  stopMatchTimer();
  state.quiz = { ...state.quiz, duration: 90, remaining: 90, active: true, score: 0, asked: 0, wrongOnly, timer: null };
  buildQuizQueue(wrongOnly);
  el.quizResultSheet.classList.add('hidden');
  showScreen('quizScreen');
  nextQuizQuestion();
  tickQuiz();
  state.quiz.timer = setInterval(tickQuiz, 1000);
}
function stopQuiz(){ if(state.quiz.timer){ clearInterval(state.quiz.timer); state.quiz.timer = null; } state.quiz.active = false; }
function tickQuiz(){
  const pct = Math.max(0, state.quiz.remaining / state.quiz.duration);
  el.quizTimerFill.style.width = `${pct*100}%`;
  el.quizTimerText.textContent = `${Math.floor(state.quiz.remaining/60)}:${String(state.quiz.remaining%60).padStart(2,'0')}`;
  el.quizProgressText.textContent = `${state.quiz.score} / ${state.quiz.asked}`;
  if(state.quiz.remaining <= 15) el.quizTimerFill.classList.add('warn'); else el.quizTimerFill.classList.remove('warn');
  if(state.quiz.remaining <= 5){ el.quizTimerFill.classList.add('danger','blink'); } else el.quizTimerFill.classList.remove('danger','blink');
  if(state.quiz.remaining <= 0){ finishQuiz(); return; }
  state.quiz.remaining -= 1;
}
function nextQuizQuestion(){
  if(!state.quiz.queue.length) buildQuizQueue(state.quiz.wrongOnly);
  const word = state.quiz.queue.shift();
  if(!word) return finishQuiz();
  state.quiz.current = word;
  state.quiz.usedIds.push(word.id);
  const others = sample(getCurrentWords().filter(w => w.id !== word.id), 3);
  const options = shuffle([word, ...others]);
  el.quizPrompt.textContent = promptOf(word);
  el.quizPromptPinyin.textContent = (state.settings.reverseDirection || !state.settings.showPinyinFront) ? '' : (word.pinyin || '');
  el.quizFeedback.textContent = '';
  el.quizOptions.innerHTML = options.map(opt => `<button class="quiz-option" data-quiz-id="${opt.id}">${answerOf(opt)}</button>`).join('');
}
function handleQuizAnswer(chosenId){
  if(!state.quiz.active) return;
  const word = state.quiz.current;
  const correct = chosenId === word.id;
  state.quiz.asked += 1;
  document.querySelectorAll('.quiz-option').forEach(btn => {
    const isCorrect = btn.dataset.quizId === word.id;
    if(isCorrect) btn.classList.add('correct');
    if(btn.dataset.quizId === chosenId && !isCorrect) btn.classList.add('wrong');
    btn.disabled = true;
  });
  if(correct){
    state.quiz.score += 1;
    markLearned(word);
    el.quizFeedback.textContent = '答對了';
  } else {
    markMistake(word);
    el.quizFeedback.textContent = `正確：${answerOf(word)}｜${word.pinyin}`;
  }
  setTimeout(() => {
    if(state.quiz.remaining <= 0) finishQuiz();
    else nextQuizQuestion();
  }, 800);
}
function finishQuiz(){
  stopQuiz();
  el.quizResultSheet.classList.remove('hidden');
  const rate = state.quiz.asked ? Math.round((state.quiz.score / state.quiz.asked) * 100) : 0;
  el.quizResultIcon.textContent = rate >= 70 ? '✓' : '!' ;
  el.quizResultText.textContent = `答對 ${state.quiz.score} 題，共 ${state.quiz.asked} 題`;
}

function selectMatchWords(pairCount=9){
  const all = getCurrentWords();
  const wrongs = all.filter(w => state.mistakeMap[w.id]).sort((a,b)=>(state.mistakeMap[b.id]||0)-(state.mistakeMap[a.id]||0));
  const lastTwo = new Set(state.match.roundHistory.slice(-2).flat());
  const fresh = all.filter(w => !lastTwo.has(w.id));
  let chosen = [];
  chosen.push(...wrongs.slice(0, pairCount));
  if(chosen.length < pairCount){
    const extraFresh = fresh.filter(w => !chosen.some(c => c.id === w.id));
    chosen.push(...sample(extraFresh, pairCount - chosen.length));
  }
  if(chosen.length < pairCount){
    const fallback = all.filter(w => !chosen.some(c => c.id === w.id));
    chosen.push(...sample(fallback, pairCount - chosen.length));
  }
  return chosen.slice(0, pairCount);
}
function buildMatchBoard(){
  const words = selectMatchWords(9);
  state.match.currentRoundIds = words.map(w => w.id);
  state.match.roundHistory.push(state.match.currentRoundIds);
  const zhCards = words.map(w => ({ key: w.id + '_zh', type:'zh', pairId: w.id, text: w.zh, word:w }));
  const viCards = shuffle(words).map(w => ({ key: w.id + '_vi', type:'vi', pairId: w.id, text: w.vi, word:w }));
  state.match.board = shuffle([...zhCards, ...viCards]);
  state.match.pairsDone = 0;
  state.match.selected = null;
}
function renderMatchBoard(){
  el.matchBoard.innerHTML = state.match.board.map(card => `
    <button class="match-card ${card.type} ${card.matched?'matched':''} ${card.selected?'selected':''}" data-match-key="${card.key}">
      ${card.text}
    </button>
  `).join('');
  el.matchProgressText.textContent = `${state.match.pairsDone} / 9`;
}
function startMatch(){
  stopQuiz();
  stopMatchTimer();
  state.match.remaining = 40;
  state.match.active = false;
  el.matchResultSheet.classList.add('hidden');
  buildMatchBoard();
  renderMatchBoard();
  showScreen('matchScreen');
  runCountdown();
}
function runCountdown(){
  el.matchCountdown.classList.remove('hidden');
  let n = 3;
  el.matchCountdown.textContent = n;
  const timer = setInterval(() => {
    n -= 1;
    if(n === 0){ el.matchCountdown.textContent = '開始'; return; }
    if(n < 0){
      clearInterval(timer);
      el.matchCountdown.classList.add('hidden');
      beginMatchTimer();
      return;
    }
    el.matchCountdown.textContent = n;
  }, 700);
}
function beginMatchTimer(){
  state.match.active = true;
  tickMatch();
  state.match.timer = setInterval(tickMatch, 1000);
}
function stopMatchTimer(){ if(state.match.timer){ clearInterval(state.match.timer); state.match.timer = null; } state.match.active = false; }
function tickMatch(){
  const pct = Math.max(0, state.match.remaining / 40);
  el.matchTimerFill.style.width = `${pct*100}%`;
  el.matchTimerText.textContent = `0:${String(state.match.remaining).padStart(2,'0')}`;
  el.matchProgressText.textContent = `${state.match.pairsDone} / 9`;
  el.matchTimerFill.classList.remove('warn','danger','blink');
  if(state.match.remaining <= 15) el.matchTimerFill.classList.add('warn');
  if(state.match.remaining <= 5) el.matchTimerFill.classList.add('danger','blink');
  if(state.match.remaining <= 0){ finishMatch(false); return; }
  state.match.remaining -= 1;
}
function finishMatch(success){
  stopMatchTimer();
  el.matchResultSheet.classList.remove('hidden');
  el.matchResultIcon.textContent = success ? '✓' : '✕';
  el.matchResultTitle.textContent = success ? '成功' : '失敗';
  el.matchResultText.textContent = success ? '9 組都配對成功了' : `完成 ${state.match.pairsDone} / 9 組`;
}
function handleMatchClick(key){
  if(!state.match.active) return;
  const card = state.match.board.find(c => c.key === key);
  if(!card || card.matched) return;
  if(!state.match.selected){
    state.match.selected = key;
    card.selected = true;
    return renderMatchBoard();
  }
  if(state.match.selected === key) return;
  const first = state.match.board.find(c => c.key === state.match.selected);
  const second = card;
  if(first.type === second.type){
    first.selected = false;
    second.selected = true;
    state.match.selected = key;
    return renderMatchBoard();
  }
  const ok = first.pairId === second.pairId;
  if(ok){
    first.matched = true; second.matched = true;
    first.selected = false; second.selected = false;
    state.match.selected = null;
    state.match.pairsDone += 1;
    markLearned(first.word);
    renderMatchBoard();
    if(state.match.pairsDone === 9) setTimeout(() => finishMatch(true), 260);
  } else {
    markMistake(first.word); markMistake(second.word);
    first.selected = false;
    state.match.selected = null;
    renderMatchBoard();
    document.querySelectorAll(`[data-match-key="${first.key}"],[data-match-key="${second.key}"]`).forEach(n => n.classList.add('wrong'));
    setTimeout(() => {
      document.querySelectorAll('.match-card').forEach(n => n.classList.remove('wrong'));
      second.selected = false;
      renderMatchBoard();
    }, 350);
  }
}
function resetByScreen(){
  if(state.currentScreen === 'flashScreen'){
    buildFlashPool(state.flash.gridSize);
    renderFlash();
  } else if(state.currentScreen === 'wordlistScreen'){
    renderWordList();
  } else if(state.currentScreen === 'quizScreen'){
    startQuiz(state.quiz.wrongOnly);
  } else if(state.currentScreen === 'matchScreen'){
    startMatch();
  } else if(state.currentScreen === 'menuScreen'){
    renderMenu();
  } else {
    populateHome();
  }
}

function bindEvents(){
  el.startBtn.addEventListener('click', () => {
    state.currentUnit = Number(el.unitSelect.value);
    renderMenu();
    showScreen('menuScreen');
  });
  el.unitSelect.addEventListener('change', () => state.currentUnit = Number(el.unitSelect.value));

  document.body.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if(actionBtn){
      const action = actionBtn.dataset.action;
      if(action === 'home') { closeSettings(); stopQuiz(); stopMatchTimer(); populateHome(); showScreen('homeScreen', false); }
      if(action === 'back') goBack();
      if(action === 'backToMenu') { stopQuiz(); stopMatchTimer(); showScreen('menuScreen', false); }
      if(action === 'settings') openSettings();
    }
    const modeBtn = e.target.closest('[data-mode]');
    if(modeBtn){
      const mode = modeBtn.dataset.mode;
      if(mode === 'wordlist'){ renderWordList(); showScreen('wordlistScreen'); }
      if(mode === 'flash'){ buildFlashPool(state.flash.gridSize); renderFlash(); showScreen('flashScreen'); }
      if(mode === 'quiz'){ startQuiz(false); }
      if(mode === 'match'){ startMatch(); }
    }
    const flashCard = e.target.closest('.flash-card');
    if(flashCard){ flashCard.classList.toggle('flipped'); }
    const seg = e.target.closest('[data-flash-view]');
    if(seg){
      state.flash.view = seg.dataset.flashView;
      renderFlash();
    }
    const size = e.target.closest('[data-grid-size]');
    if(size){
      state.flash.gridSize = Number(size.dataset.gridSize);
      document.querySelectorAll('[data-grid-size]').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.gridSize) === state.flash.gridSize));
      buildFlashPool(state.flash.gridSize);
      renderFlash();
    }
    const q = e.target.closest('[data-quiz-id]');
    if(q) handleQuizAnswer(q.dataset.quizId);
    const m = e.target.closest('[data-match-key]');
    if(m) handleMatchClick(m.dataset.matchKey);
  });

  el.shuffleFlashBtn.addEventListener('click', () => { buildFlashPool(state.flash.gridSize); renderFlash(); });
  el.flashSingleCard.addEventListener('click', () => { state.flash.singleFlipped = !state.flash.singleFlipped; renderFlashSingle(); });
  el.swipeLeftBtn.addEventListener('click', () => nextSingle(false));
  el.swipeRightBtn.addEventListener('click', () => nextSingle(true));

  let startX = 0, startY = 0;
  el.flashSingleCard.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, {passive:true});
  el.flashSingleCard.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
      if(dx > 0) nextSingle(true);
      else nextSingle(false);
    }
  });

  el.pinyinToggle.addEventListener('change', () => {
    state.settings.showPinyinFront = el.pinyinToggle.checked;
    if(state.currentScreen === 'flashScreen') renderFlash();
    if(state.currentScreen === 'quizScreen' && state.quiz.current) refreshQuizCurrent();
  });
  el.directionToggle.addEventListener('change', () => {
    state.settings.reverseDirection = el.directionToggle.checked;
    el.directionHelp.textContent = `目前：${dirLabel()}`;
    if(state.currentScreen === 'flashScreen') renderFlash();
    if(state.currentScreen === 'quizScreen' && state.quiz.current) refreshQuizCurrent();
  });
  el.closeSettingsBtn.addEventListener('click', closeSettings);
  el.settingsBackdrop.addEventListener('click', closeSettings);
  el.goHomeBtn.addEventListener('click', () => { closeSettings(); stopQuiz(); stopMatchTimer(); populateHome(); showScreen('homeScreen', false); });
  el.goBackBtn.addEventListener('click', goBack);
  el.restartBtn.addEventListener('click', () => { closeSettings(); resetByScreen(); });

  el.quizRestartBtn.addEventListener('click', () => startQuiz(false));
  el.quizWrongBtn.addEventListener('click', () => startQuiz(true));
  el.quizMenuBtn.addEventListener('click', () => { stopQuiz(); showScreen('menuScreen', false); });

  el.matchRestartBtn.addEventListener('click', startMatch);
  el.matchMenuBtn.addEventListener('click', () => { stopMatchTimer(); showScreen('menuScreen', false); });
}

function init(){
  populateHome();
  renderMenu();
  bindEvents();
  document.querySelectorAll('[data-grid-size]').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.gridSize) === state.flash.gridSize));
}
init();
