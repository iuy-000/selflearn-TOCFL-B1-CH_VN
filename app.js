const state = {
  units: window.APP_DATA.units,
  quotes: window.APP_DATA.quotes,
  currentUnit: 1,
  currentScreen: 'homeScreen',
  settings: { showPinyinFront: false, reverseDirection: false },
  flash: { view: 'grid', pool: [], gridCursor: 0, singleQueue: [], singleIndex: 0, singleFlipped: false, singleDone: false, dragX: 0 },
  quiz: { timer: null, duration: 90, remaining: 90, active: false, score: 0, asked: 0, queue: [], current: null, wrongOnly: false, wrongIds: [] },
  match: { timer: null, duration: 40, remaining: 40, active: false, board: [], selected: null, pairsDone: 0, roundHistory: [], currentRoundIds: [] },
  mistakeMap: loadJSON('mistakeMap', {}),
};

const el = {};
document.querySelectorAll('[id]').forEach(node => el[node.id] = node);

function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function shuffle(arr){ return [...arr].sort(() => Math.random() - 0.5); }
function sample(arr, n){ return shuffle(arr).slice(0, Math.min(n, arr.length)); }
function getUnit(unitNum){ return state.units.find(u => u.unit === unitNum); }
function getCurrentWords(){ return getUnit(state.currentUnit).words; }
function dirLabelVi(){ return state.settings.reverseDirection ? 'Việt → Trung' : 'Trung → Việt'; }
function frontOf(word){ return state.settings.reverseDirection ? word.vi : word.zh; }
function backOf(word){ return state.settings.reverseDirection ? word.zh : word.vi; }
function promptOf(word){ return frontOf(word); }
function answerOf(word){ return backOf(word); }
function mistakeCount(word){ return state.mistakeMap[word.id] || 0; }
function markMistake(word){ state.mistakeMap[word.id] = (state.mistakeMap[word.id] || 0) + 1; saveJSON('mistakeMap', state.mistakeMap); }
function markSuccess(word){ if(state.mistakeMap[word.id]){ state.mistakeMap[word.id] -= 1; if(state.mistakeMap[word.id] <= 0) delete state.mistakeMap[word.id]; saveJSON('mistakeMap', state.mistakeMap); } }
function heartText(word){ const c = mistakeCount(word); return c ? ' ' + '💔'.repeat(Math.min(c, 6)) : ''; }
function speak(text){ if(!('speechSynthesis' in window) || !text) return; const u = new SpeechSynthesisUtterance(text); u.lang='zh-TW'; u.rate=0.88; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }
function escapeAttr(text){ return String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function showScreen(id){ document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); state.currentScreen = id; closeSettings(); }
function goBack(){ closeSettings(); if(state.currentScreen === 'homeScreen') return; if(['quizScreen','matchScreen'].includes(state.currentScreen)){ stopQuiz(); stopMatchTimer(); showScreen('menuScreen'); return; } if(state.currentScreen === 'menuScreen'){ populateHome(); showScreen('homeScreen'); return; } showScreen('menuScreen'); }

function populateHome(){
  const quote = state.quotes[Math.floor(Math.random() * state.quotes.length)];
  el.quoteZh.textContent = quote.zh;
  el.quoteVi.textContent = quote.vi;
  el.unitSelect.innerHTML = state.units.map(u => `<option value="${u.unit}">單元 ${u.unit} / Bài ${u.unit}</option>`).join('');
  el.unitSelect.value = state.currentUnit;
}

function updateMenuTitle(){
  const count = getCurrentWords().length;
  el.menuUnitTitle.textContent = `單元 ${state.currentUnit} · Bài ${state.currentUnit}`;
  el.wordlistTitle.textContent = `單字表 · Bảng từ ${state.currentUnit} (${count})`;
}

function openSettings(){
  el.settingsSheet.classList.remove('hidden');
  el.pinyinToggle.checked = state.settings.showPinyinFront;
  el.directionToggle.checked = state.settings.reverseDirection;
  el.directionHelp.textContent = `Hiện tại: ${dirLabelVi()}`;
}
function closeSettings(){ el.settingsSheet.classList.add('hidden'); }

function renderWordlist(){
  const words = getCurrentWords();
  el.wordlistContainer.innerHTML = words.map(word => `
    <button class="word-item" data-speak="${escapeAttr(word.zh)}">
      <div class="word-row-top"><div class="word-label-row"><span class="word-zh">${word.zh}</span><span class="sound-icon">🔊</span></div><span class="word-hearts">${heartText(word)}</span></div>
      <div class="word-pinyin">${word.pinyin || ''}</div>
      <div class="word-vi">${word.vi}</div>
    </button>`).join('');
}

function buildFlashPool(){
  const words = getCurrentWords();
  const priority = words.filter(w => mistakeCount(w) > 0).sort((a,b)=>mistakeCount(b)-mistakeCount(a));
  const others = shuffle(words.filter(w => !priority.some(p => p.id === w.id)));
  const merged = [...priority, ...others];
  state.flash.pool = merged.length >= 16 ? merged : [...merged, ...shuffle(words)].slice(0,16);
  state.flash.gridCursor = 0;
}
function nextFlashGroup(){
  const words = getCurrentWords();
  let group = state.flash.pool.slice(state.flash.gridCursor, state.flash.gridCursor + 16);
  if(group.length < 16){
    const remain = state.flash.pool.filter(w => !group.some(g => g.id === w.id));
    group = [...group, ...remain].slice(0,16);
    if(group.length < 16) group = [...group, ...shuffle(words)].slice(0,16);
    state.flash.gridCursor = 0;
  } else {
    state.flash.gridCursor += 16;
    if(state.flash.gridCursor >= state.flash.pool.length) state.flash.gridCursor = 0;
  }
  return group;
}
function renderFlashGrid(){
  const group = nextFlashGroup();
  el.flashGrid.innerHTML = group.map((word) => `
    <button class="flash-card" data-word-id="${word.id}">
      <div class="flash-card-inner">
        <div class="flash-face flash-front">
          <div>
            <div class="flash-main">${frontOf(word)}</div>
            ${state.settings.showPinyinFront && !state.settings.reverseDirection ? `<div class="flash-sub">${word.pinyin}</div>`:''}
          </div>
        </div>
        <div class="flash-face flash-back">
          <div class="flash-main">${word.zh}</div>
          <div class="flash-sub">${word.pinyin}</div>
          <div class="flash-sub strong">${word.vi}</div>
        </div>
      </div>
    </button>`).join('');
}

function setupFlashSingle(){
  state.flash.singleQueue = shuffle(getCurrentWords());
  state.flash.singleIndex = 0; state.flash.singleFlipped = false; state.flash.singleDone = false; state.flash.dragX = 0;
  el.flashReplayBtn.classList.add('hidden');
  renderFlashSingle();
}
function currentSingleWord(){ return state.flash.singleQueue[state.flash.singleIndex]; }
function renderFlashSingle(){
  const queue = state.flash.singleQueue;
  if(!queue.length) return;
  if(state.flash.singleIndex >= queue.length){
    state.flash.singleDone = true;
    el.flashSingleProgress.textContent = `${queue.length} / ${queue.length}`;
    el.flashSingleCard.style.transform = 'translateX(0px)';
    el.flashSingleCard.style.opacity = '1';
    el.flashSingleCard.innerHTML = `<div class="single-front done"><div class="single-main">完成了</div><div class="single-sub">Hết rồi</div></div>`;
    el.flashSingleCard.classList.remove('flipped');
    el.flashReplayBtn.classList.remove('hidden');
    return;
  }
  const word = currentSingleWord();
  el.flashSingleProgress.textContent = `${state.flash.singleIndex + 1} / ${queue.length}`;
  el.flashSingleCard.classList.toggle('flipped', state.flash.singleFlipped);
  el.flashSingleCard.style.transform = `translateX(${state.flash.dragX}px) rotate(${state.flash.dragX/18}deg)`;
  el.flashSingleCard.style.opacity = `${Math.max(.62, 1 - Math.abs(state.flash.dragX)/260)}`;
  el.flashSingleCard.innerHTML = `
    <div class="single-front">
      <div class="single-main">${frontOf(word)}</div>
      ${state.settings.showPinyinFront && !state.settings.reverseDirection ? `<div class="single-sub">${word.pinyin}</div>`:''}
    </div>
    <div class="single-back">
      <div class="single-main">${word.zh}</div>
      <div class="single-sub">${word.pinyin}</div>
      <div class="single-sub strong">${word.vi}</div>
    </div>`;
}
function advanceSingle(known){
  const word = currentSingleWord(); if(!word) return;
  if(known) markSuccess(word); else markMistake(word);
  renderWordlist();
  state.flash.singleIndex += 1; state.flash.singleFlipped = false; state.flash.dragX = 0; renderFlashSingle();
}
function switchFlashView(view){
  state.flash.view = view;
  document.querySelectorAll('[data-flash-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.flashView===view));
  el.flashGridWrap.classList.toggle('active', view==='grid');
  el.flashSingleWrap.classList.toggle('active', view==='single');
  el.flashGridToolbar.classList.toggle('hidden', view!=='grid');
  if(view==='grid'){ buildFlashPool(); renderFlashGrid(); }
  if(view==='single') setupFlashSingle();
}

async function runCountdown(elm){ elm.classList.remove('hidden'); for(const t of ['3','2','1']){ elm.textContent=t; await wait(650); } elm.textContent='GO'; await wait(350); elm.classList.add('hidden'); }
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

function startQuiz(wrongOnly=false){
  stopQuiz();
  state.quiz = { timer:null, duration:90, remaining:90, active:false, score:0, asked:0, queue:[], current:null, wrongOnly, wrongIds:[] };
  let words = getCurrentWords();
  if(wrongOnly){ const wrongSet = new Set(Object.keys(state.mistakeMap)); words = words.filter(w => wrongSet.has(w.id)); }
  state.quiz.queue = shuffle(words);
  if(!state.quiz.queue.length){ finishQuiz(true); showScreen('quizScreen'); return; }
  el.quizResultSheet.classList.add('hidden'); showScreen('quizScreen');
  runCountdown(el.quizCountdown).then(()=>{ state.quiz.active = true; renderQuizQuestion(); tickQuiz(); state.quiz.timer=setInterval(tickQuiz,1000); });
}
function stopQuiz(){ if(state.quiz.timer){ clearInterval(state.quiz.timer); state.quiz.timer=null; } state.quiz.active=false; }
function tickQuiz(){ const pct = Math.max(0, state.quiz.remaining / state.quiz.duration); el.quizTimerFill.style.width = `${pct*100}%`; el.quizTimerText.textContent = `${Math.floor(state.quiz.remaining/60)}:${String(state.quiz.remaining%60).padStart(2,'0')}`; if(state.quiz.remaining <= 0){ finishQuiz(false); return; } state.quiz.remaining -= 1; }
function renderQuizQuestion(){
  const total = state.quiz.queue.length; if(state.quiz.asked >= total){ finishQuiz(true); return; }
  const word = state.quiz.queue[state.quiz.asked]; state.quiz.current = word;
  el.quizProgressText.textContent = `${state.quiz.asked + 1} / ${total}`; el.quizPrompt.textContent = promptOf(word);
  el.quizPromptPinyin.textContent = (!state.settings.reverseDirection && state.settings.showPinyinFront) ? word.pinyin : '';
  el.quizFeedback.textContent = '';
  const pool = getCurrentWords().filter(w => w.id !== word.id);
  const options = shuffle([word, ...sample(pool, 3)]);
  el.quizOptions.innerHTML = options.map(opt => `<button class="quiz-option" data-answer-id="${opt.id}">${answerOf(opt)}</button>`).join('');
}
function answerQuiz(answerId){
  if(!state.quiz.active || !state.quiz.current) return; state.quiz.active = false;
  const correct = answerId === state.quiz.current.id;
  document.querySelectorAll('.quiz-option').forEach(btn => { const isCorrect = btn.dataset.answerId === state.quiz.current.id; if(isCorrect) btn.classList.add('correct'); if(btn.dataset.answerId === answerId && !correct) btn.classList.add('wrong'); btn.disabled = true; });
  if(correct){ state.quiz.score += 1; markSuccess(state.quiz.current); el.quizFeedback.textContent = 'Đúng rồi'; }
  else { markMistake(state.quiz.current); state.quiz.wrongIds.push(state.quiz.current.id); el.quizFeedback.textContent = `Đáp án đúng: ${answerOf(state.quiz.current)} · ${state.quiz.current.pinyin}`; }
  renderWordlist();
  setTimeout(()=>{ state.quiz.asked += 1; state.quiz.active = true; renderQuizQuestion(); }, 800);
}
function finishQuiz(finishedAll){ stopQuiz(); el.quizResultSheet.classList.remove('hidden'); const total = state.quiz.queue.length || 1; const success = finishedAll && state.quiz.asked >= total; el.quizResultIcon.textContent = success ? '✓' : '✕'; el.quizResultTitle.textContent = success ? 'Thành công' : 'Thất bại'; el.quizResultText.textContent = `Đúng ${state.quiz.score} / ${total}`; }

function pickMatchWords(excludeIds=[]){
  const words = getCurrentWords();
  const exclude = new Set(excludeIds);
  const eligible = words.filter(w => !exclude.has(w.id));
  const source = eligible.length >= 9 ? eligible : words;
  const lastTwo = new Set(state.match.roundHistory.flat());
  const priority = source.filter(w => mistakeCount(w) > 0).sort((a,b)=>mistakeCount(b)-mistakeCount(a));
  const fresh = shuffle(source.filter(w => !lastTwo.has(w.id) && !priority.some(p=>p.id===w.id)));
  const other = shuffle(source.filter(w => !priority.some(p=>p.id===w.id) && !fresh.some(f=>f.id===w.id)));
  let chosen = [...priority, ...fresh, ...other].slice(0, 9);
  if(chosen.length < 9){
    const rest = shuffle(words.filter(w => !chosen.some(c => c.id === w.id)));
    chosen = [...chosen, ...rest].slice(0, 9);
  }
  return chosen;
}
function buildMatchBoard(excludeCurrent=false){
  const chosen = pickMatchWords(excludeCurrent ? state.match.currentRoundIds : []);
  state.match.currentRoundIds = chosen.map(w => w.id);
  state.match.roundHistory.push(state.match.currentRoundIds);
  state.match.roundHistory = state.match.roundHistory.slice(-2);
  state.match.board = shuffle(chosen.flatMap(word => ([{pairId: word.id, text: word.zh, lang:'zh', word},{pairId: word.id, text: word.vi, lang:'vi', word}])));
  state.match.selected = null; state.match.pairsDone = 0; renderMatchBoard();
}
function renderMatchBoard(){ el.matchBoard.innerHTML = state.match.board.map((card, idx) => `<button class="match-card ${card.lang} ${card.matched?'matched':''}" data-idx="${idx}">${card.matched?'':card.text}</button>`).join(''); el.matchProgressText.textContent = `${state.match.pairsDone} / 9`; }
async function startMatch(excludeCurrent=false){ stopMatchTimer(); state.match.remaining = 40; el.matchResultSheet.classList.add('hidden'); buildMatchBoard(excludeCurrent); showScreen('matchScreen'); await runCountdown(el.matchCountdown); state.match.active = true; tickMatch(); state.match.timer = setInterval(tickMatch, 1000); }
function stopMatchTimer(){ if(state.match.timer){ clearInterval(state.match.timer); state.match.timer = null; } state.match.active = false; }
function tickMatch(){ const pct = Math.max(0, state.match.remaining / state.match.duration); el.matchTimerFill.style.width = `${pct*100}%`; el.matchTimerText.textContent = `0:${String(state.match.remaining).padStart(2,'0')}`; el.matchTimerFill.classList.remove('warn','danger','blink'); if(state.match.remaining <= 15) el.matchTimerFill.classList.add('warn'); if(state.match.remaining <= 5) el.matchTimerFill.classList.add('danger','blink'); if(state.match.remaining <= 0){ finishMatch(false); return; } state.match.remaining -= 1; }
function tapMatch(idx){ if(!state.match.active) return; const card = state.match.board[idx]; if(!card || card.matched) return; if(state.match.selected === null){ state.match.selected = idx; renderMatchSelection(); return; } if(state.match.selected === idx){ state.match.selected = null; renderMatchSelection(); return; } const first = state.match.board[state.match.selected]; if(first.pairId === card.pairId && first.lang !== card.lang){ first.matched = true; card.matched = true; state.match.pairsDone += 1; markSuccess(first.word); renderWordlist(); state.match.selected = null; renderMatchBoard(); if(state.match.pairsDone === 9) finishMatch(true); } else { markMistake(first.word); markMistake(card.word); renderWordlist(); const btns = document.querySelectorAll('.match-card'); [state.match.selected, idx].forEach(i => btns[i]?.classList.add('wrong')); state.match.selected = null; setTimeout(renderMatchBoard, 420); } }
function renderMatchSelection(){ document.querySelectorAll('.match-card').forEach((btn, idx) => btn.classList.toggle('selected', idx === state.match.selected)); }
function finishMatch(success){ stopMatchTimer(); el.matchResultSheet.classList.remove('hidden'); el.matchResultIcon.textContent = success ? '✓' : '✕'; el.matchResultTitle.textContent = success ? 'Thành công' : 'Thất bại'; el.matchResultText.textContent = success ? 'Ghép đúng đủ 9 cặp' : `Đúng ${state.match.pairsDone} / 9 cặp`; }

function restartCurrent(){ if(state.currentScreen === 'flashScreen'){ if(state.flash.view === 'grid'){ buildFlashPool(); renderFlashGrid(); } else { setupFlashSingle(); } } if(state.currentScreen === 'quizScreen') startQuiz(state.quiz.wrongOnly); if(state.currentScreen === 'matchScreen') startMatch(true); if(state.currentScreen === 'wordlistScreen') renderWordlist(); }

function bindSingleDrag(){
  let dragging=false, startX=0;
  const start = (x) => { if(state.flash.singleDone) return; dragging=true; startX=x; state.flash.dragX=0; el.flashSingleCard.style.transition='none'; };
  const move = (x) => { if(!dragging) return; state.flash.dragX = x - startX; renderFlashSingle(); };
  const end = () => { if(!dragging) return; dragging=false; el.flashSingleCard.style.transition='transform .16s ease, opacity .16s ease'; const dx = state.flash.dragX; if(Math.abs(dx) > 70){ advanceSingle(dx > 0); } else { state.flash.dragX=0; renderFlashSingle(); } };
  el.flashSingleCard.addEventListener('pointerdown', e => start(e.clientX));
  window.addEventListener('pointermove', e => move(e.clientX));
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function bindEvents(){
  el.startBtn.addEventListener('click', () => { state.currentUnit = Number(el.unitSelect.value); updateMenuTitle(); showScreen('menuScreen'); });
  document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if(mode === 'wordlist'){ renderWordlist(); showScreen('wordlistScreen'); }
    if(mode === 'flash'){ switchFlashView('grid'); showScreen('flashScreen'); }
    if(mode === 'quiz') startQuiz(false);
    if(mode === 'match') startMatch(false);
  }));
  document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => { const action = btn.dataset.action; if(action === 'settings') openSettings(); if(action === 'back') goBack(); if(action === 'backToMenu'){ stopQuiz(); stopMatchTimer(); showScreen('menuScreen'); } }));
  el.settingsBackdrop.addEventListener('click', closeSettings); el.closeSettingsBtn.addEventListener('click', closeSettings);
  el.pinyinToggle.addEventListener('change', e => { state.settings.showPinyinFront = e.target.checked; if(state.currentScreen==='flashScreen'){ if(state.flash.view==='grid'){ buildFlashPool(); renderFlashGrid(); } else { renderFlashSingle(); } } if(state.currentScreen==='quizScreen' && state.quiz.current) renderQuizQuestion(); });
  el.directionToggle.addEventListener('change', e => { state.settings.reverseDirection = e.target.checked; el.directionHelp.textContent = `Hiện tại: ${dirLabelVi()}`; if(state.currentScreen==='flashScreen'){ if(state.flash.view==='grid'){ buildFlashPool(); renderFlashGrid(); } else { renderFlashSingle(); } } if(state.currentScreen==='quizScreen' && state.quiz.current) renderQuizQuestion(); });
  el.goHomeBtn.addEventListener('click', ()=> { populateHome(); showScreen('homeScreen'); });
  el.goBackBtn.addEventListener('click', goBack);
  el.restartBtn.addEventListener('click', ()=> { closeSettings(); restartCurrent(); });
  el.wordlistContainer.addEventListener('click', e => { const btn = e.target.closest('.word-item'); if(!btn) return; speak(btn.dataset.speak); });
  document.querySelectorAll('[data-flash-view]').forEach(btn => btn.addEventListener('click', ()=> switchFlashView(btn.dataset.flashView)));
  el.shuffleFlashBtn.addEventListener('click', () => { buildFlashPool(); renderFlashGrid(); });
  el.flashGrid.addEventListener('click', e => { const card = e.target.closest('.flash-card'); if(card) card.classList.toggle('flipped'); });
  el.flashSingleCard.addEventListener('click', ()=> { if(state.flash.singleDone || Math.abs(state.flash.dragX) > 5) return; state.flash.singleFlipped = !state.flash.singleFlipped; renderFlashSingle(); });
  el.swipeLeftBtn.addEventListener('click', ()=> advanceSingle(false)); el.swipeRightBtn.addEventListener('click', ()=> advanceSingle(true)); el.flashReplayBtn.addEventListener('click', setupFlashSingle);
  el.quizOptions.addEventListener('click', e => { const btn = e.target.closest('.quiz-option'); if(btn) answerQuiz(btn.dataset.answerId); });
  el.quizRestartBtn.addEventListener('click', ()=> startQuiz(false)); el.quizWrongBtn.addEventListener('click', ()=> startQuiz(true)); el.quizMenuBtn.addEventListener('click', ()=> { stopQuiz(); showScreen('menuScreen'); });
  el.matchBoard.addEventListener('click', e => { const btn = e.target.closest('.match-card'); if(btn) tapMatch(Number(btn.dataset.idx)); });
  el.matchRestartBtn.addEventListener('click', ()=> startMatch(true)); el.matchMenuBtn.addEventListener('click', ()=> { stopMatchTimer(); showScreen('menuScreen'); });
  bindSingleDrag();
}

populateHome(); updateMenuTitle(); bindEvents();
