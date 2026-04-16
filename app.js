
const storageKey = 'b1_mobile_app_v10_4';
const data = window.APP_DATA;
const appState = {
  currentUnit: 1,
  currentScreen: 'menuScreen',
  screenHistory: ['menuScreen'],
  settings: {
    showPinyinFront: false,
    reverseDirection: false,
    zhAudio: true,
    viAudio: false,
    haptic: true,
  },
  hearts: {},
  today: initToday(),
  quotes: data.quotes,
  units: data.units,
  flash: {
    view: 'grid',
    gridWords: [],
    singleWords: [],
    singleIndex: 0,
    singleFlipped: false,
    singleDone: false,
    dragStartX: 0,
    currentTranslate: 0,
  },
  quiz: {
    duration: 120, remaining: 120, timer: null, queue: [], current: null, asked: 0, score: 0,
    wrongItems: [], onlyWrong:false, active:false, difficulty:'normal'
  },
  match: {
    duration: 40, remaining: 40, timer: null, board: [], selected: null, matched: 0,
    active:false, roundHistory:[]
  },
  study: {
    startedAt: Date.now(),
    lastTick: Date.now(),
    milestoneShown: false,
  }
};


normalizeData();
function normalizeData(){
  const zhuyinRegex = /[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9\u02EA\u02EB]/g;
  appState.quotes = (appState.quotes || []).map(q => ({zh: String(q.zh || '').trim(), vi: String(q.vi || '').trim()}));
  appState.units = (appState.units || []).map(unit => ({
    ...unit,
    labelZh: String(unit.labelZh || '').trim(),
    labelVi: String(unit.labelVi || '').trim(),
    words: (unit.words || []).map(word => {
      const cleanZh = String(word.zh || '')
        .replace(/（[^）]*）/g, '')
        .replace(/\([^\)]*\)/g, '')
        .replace(zhuyinRegex, '')
        .replace(/\s+/g, '')
        .trim();
      const cleanPinyin = String(word.pinyin || '').replace(/\s+/g, ' ').trim();
      const cleanVi = String(word.vi || '').replace(/\s+/g, ' ').trim();
      return {...word, zh: cleanZh, pinyin: cleanPinyin, vi: cleanVi};
    })
  }));
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];


function normalizeText(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function normalizeZh(s){ return normalizeText(s).replace(/（[^）]*）/g,'').replace(/\([^)]*\)/g,'').replace(/[ㄅ-ㄩˊˇˋ˙ˊˇˋ˙]/g,'').replace(/\s+/g,'').trim(); }
appState.units.forEach(u=>{u.words.forEach(w=>{w.zh=normalizeZh(w.zh); w.pinyin=normalizeText(w.pinyin); w.vi=normalizeText(w.vi);});});

const el = {
  quoteZh: $('#quoteZh'),
  quoteVi: $('#quoteVi'),
  menuUnitSelect: $('#menuUnitSelect'),
  unitSelect: $('#unitSelect'),
  startBtn: $('#startBtn'),
  helpArticle: $('#helpArticle'),
  wordlistContainer: $('#wordlistContainer'),
  menuTitle: $('#menuTitle'),
  flashGrid: $('#flashGrid'),
  flashProgress: $('#flashProgress'),
  flashSingleCard: $('#flashSingleCard'),
  flashReplayBtn: $('#flashReplayBtn'),
  quizTimerText: $('#quizTimerText'),
  quizProgressText: $('#quizProgressText'),
  quizTimerFill: $('#quizTimerFill'),
  quizPrompt: $('#quizPrompt'),
  quizPromptPinyin: $('#quizPromptPinyin'),
  quizOptions: $('#quizOptions'),
  quizFeedback: $('#quizFeedback'),
  quizCountdown: $('#quizCountdown'),
  quizResultSheet: $('#quizResultSheet'),
  quizResultTitle: $('#quizResultTitle'),
  quizResultText: $('#quizResultText'),
  quizBoar: $('#quizBoar'),
  matchCountdown: $('#matchCountdown'),
  matchTimerText: $('#matchTimerText'),
  matchProgressText: $('#matchProgressText'),
  matchTimerFill: $('#matchTimerFill'),
  matchBoard: $('#matchBoard'),
  matchResultSheet: $('#matchResultSheet'),
  matchResultTitle: $('#matchResultTitle'),
  matchResultText: $('#matchResultText'),
  matchBoar: $('#matchBoar'),
  settingsSheet: $('#settingsSheet'),
  pinyinToggle: $('#pinyinToggle'),
  directionToggle: $('#directionToggle'),
  zhAudioToggle: $('#zhAudioToggle'),
  viAudioToggle: $('#viAudioToggle'),
  hapticToggle: $('#hapticToggle'),
  wrongModal: $('#wrongModal'),
  wrongList: $('#wrongList'),
  boarModal: $('#boarModal'),
  boarModalImg: $('#boarModalImg'),
  boarModalTitle: $('#boarModalTitle'),
  boarModalText: $('#boarModalText'),
  achievementBoar: $('#achievementBoar'),
  todayStudyText: $('#todayStudyText'),
  achievementDate: $('#achievementDate'),
  achievementProgressText: $('#achievementProgressText'),
  achievementProgressFill: $('#achievementProgressFill'),
  missionQuizViZhState: $('#missionQuizViZhState'),
  missionQuizZhViState: $('#missionQuizZhViState'),
  missionMatchState: $('#missionMatchState'),
  diamondQuizViZh: $('#diamondQuizViZh'),
  diamondQuizZhVi: $('#diamondQuizZhVi'),
  diamondMatch: $('#diamondMatch'),
  familiarityChart: $('#familiarityChart'),
  homeFamiliarityText: $('#homeFamiliarityText'),
  quizDifficultySheet: $('#quizDifficultySheet'),
};

function initToday(){
  const now = new Date();
  return {
    date: now.toISOString().slice(0,10),
    seconds: 0,
    quizWins: 0,
    matchWins: 0,
    flashPlays: 0,
    flashSingleCompletions: 0,
    quizZhToViPasses: 0,
    quizViToZhPasses: 0,
  };
}
function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if(saved.settings) Object.assign(appState.settings, saved.settings);
    if(saved.hearts) appState.hearts = saved.hearts;
    if(saved.today && saved.today.date === initToday().date) appState.today = saved.today;
  }catch(e){}
}
function saveState(){
  localStorage.setItem(storageKey, JSON.stringify({
    settings: appState.settings,
    hearts: appState.hearts,
    today: appState.today
  }));
}
function currentUnitObj(){ return appState.units.find(u => u.unit === appState.currentUnit); }
function currentWords(){ return currentUnitObj().words; }
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function sample(arr,n){ return shuffle(arr).slice(0, Math.min(n, arr.length)); }
function frontText(word){ return appState.settings.reverseDirection ? word.vi : word.zh; }
function frontPinyin(word){ return (!appState.settings.reverseDirection && appState.settings.showPinyinFront) ? word.pinyin : ''; }
function backPrimary(word){ return appState.settings.reverseDirection ? word.zh : word.vi; }
function answerText(word){ return appState.settings.reverseDirection ? word.zh : word.vi; }
function promptText(word){ return appState.settings.reverseDirection ? word.vi : word.zh; }

function showScreen(id,push=true){
  stopSpeech();
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#'+id).classList.add('active');
  if(push && appState.screenHistory[appState.screenHistory.length-1] !== id) appState.screenHistory.push(id);
  appState.currentScreen = id;
  updateDock(id);
  if(id === 'homeScreen') renderHome();
  if(id === 'menuScreen') renderMenu();
  if(id === 'achievementScreen') renderAchievement();
}
function updateDock(id){
  const map = {menuScreen:'menu', achievementScreen:'achievement', helpScreen:'help'};
  const active = map[id];
  $$('.dock-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.dock === active));
}

function goBack(){
  closeSettings();
  if(appState.currentScreen === 'menuScreen') return showScreen('menuScreen', false);
  if(appState.currentScreen === 'quizScreen') stopQuiz();
  if(appState.currentScreen === 'matchScreen') stopMatch();
  const prev = appState.screenHistory[appState.screenHistory.length-2] || 'menuScreen';
  appState.screenHistory.pop();
  showScreen(prev,false);
}

function getUnitFamiliarity(unit){
  const totalHearts = (unit.words || []).reduce((sum,w)=>sum + heartCount(w.id), 0);
  const maxPenalty = Math.max(1, unit.words.length * 3);
  const score = Math.round(Math.max(0, 100 - (totalHearts / maxPenalty) * 100));
  return score;
}
function renderFamiliarityChart(){
  if(!el.familiarityChart) return;
  const vals = appState.units.map(getUnitFamiliarity);
  const w=320,h=120,pad=16;
  const step = appState.units.length>1 ? (w-pad*2)/(appState.units.length-1) : 0;
  const pts = vals.map((v,i)=>{
    const x = pad + i*step;
    const y = h-pad - (v/100)*(h-pad*2);
    return [x,y];
  });
  const poly = pts.map(p=>p.join(',')).join(' ');
  const current = vals[appState.currentUnit-1] || 0;
  el.homeFamiliarityText.innerHTML = `單元 ${appState.currentUnit}：${current}%<br>Bài ${appState.currentUnit}: ${current}%`;
  el.familiarityChart.innerHTML = `
    <polyline fill="none" stroke="#dfc1a0" stroke-width="2" points="${pts.map(([x])=>`${x},${h-pad}`).join(' ')}"></polyline>
    <polyline fill="none" stroke="#d28a55" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${poly}"></polyline>
    ${pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===appState.currentUnit-1?5:3.3}" fill="${i===appState.currentUnit-1?'#8b5a2b':'#f2b98d'}"></circle>`).join('')}
  `;
}
function renderHome(){
  if(el.unitSelect){
    el.unitSelect.innerHTML = appState.units.map(u => `<option value="${u.unit}">${u.labelZh} · ${u.labelVi}</option>`).join('');
    el.unitSelect.value = appState.currentUnit;
  }
  if(el.menuUnitSelect){
    el.menuUnitSelect.innerHTML = appState.units.map(u => `<option value="${u.unit}">${u.labelZh} · ${u.labelVi}</option>`).join('');
    el.menuUnitSelect.value = appState.currentUnit;
  }
}

function renderMenu(){
  const q = appState.quotes[Math.floor(Math.random()*appState.quotes.length)];
  const shortZh = (q.zh || '').split(/[，,。]/)[0].trim();
  const shortVi = (q.vi || '').split(/[,.]/)[0].trim();
  const mini = [shortZh, shortVi].filter(Boolean).join('<br>');
  const titleZh = currentUnitObj()?.labelZh || `單元 ${appState.currentUnit}`;
  const titleVi = currentUnitObj()?.labelVi || `Bài ${appState.currentUnit}`;
  if(el.menuMiniQuote) el.menuMiniQuote.innerHTML = mini || '今天多看一眼';
  if(el.menuTitle) el.menuTitle.innerHTML = `${titleZh}<br>${titleVi}`;
  if(el.menuUnitSelect){
    el.menuUnitSelect.innerHTML = appState.units.map(u => `<option value="${u.unit}">${u.labelZh} · ${u.labelVi}</option>`).join('');
    el.menuUnitSelect.value = appState.currentUnit;
  }
}

function heartCount(id){ return appState.hearts[id] || 0; }
function heartMarkup(id){ const n = heartCount(id); return n ? `<span class="hearts">${'💔'.repeat(Math.min(n,5))}</span>` : ''; }
function changeHeart(id, delta){ appState.hearts[id] = Math.max(0, (appState.hearts[id] || 0) + delta); saveState(); }
function renderWordlist(){
  el.wordlistContainer.innerHTML = currentWords().map(w => `
    <button class="word-item card" data-speak-word="${w.id}">
      <div class="word-head">
        <div>
          <div class="word-main">${w.zh} <span class="word-voice">🔊</span></div>
          <div class="word-pinyin">${(w.pinyin || '').trim()}</div>
          <div class="word-vi">${w.vi}</div>
        </div>
        ${heartMarkup(w.id)}
      </div>
    </button>
  `).join('');
}

function buildFlashGrid(){
  appState.flash.gridWords = sample(currentWords(), 16);
}
function renderFlash(){
  $$('.seg-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.flashView === appState.flash.view));
  $('#flashGridWrap').classList.toggle('active', appState.flash.view === 'grid');
  $('#flashSingleWrap').classList.toggle('active', appState.flash.view === 'single');
  if(appState.flash.view === 'grid'){
    if(!appState.flash.gridWords.length) buildFlashGrid();
    el.flashGrid.innerHTML = appState.flash.gridWords.map(w => `
      <button class="flash-card" data-flash-id="${w.id}">
        <div class="flash-card-inner">
          <div class="flash-face front">
            <div>
              <div class="flash-main">${frontText(w)}</div>
              <div class="flash-sub">${frontPinyin(w) || '&nbsp;'}</div>
            </div>
          </div>
          <div class="flash-face back">
            <div>
              <div class="flash-main">${w.zh}</div>
              <div class="flash-sub">${w.pinyin || ''}</div>
              <div class="flash-sub">${w.vi}</div>
            </div>
          </div>
        </div>
      </button>
    `).join('');
  }else{
    if(!appState.flash.singleWords.length || appState.flash.singleDone){
      appState.flash.singleWords = shuffle(currentWords());
      appState.flash.singleIndex = 0;
      appState.flash.singleFlipped = false;
      appState.flash.singleDone = false;
      appState.flash.markedDone = false;
      appState.today.flashPlays += 1; saveState();
    }
    renderFlashSingle();
  }
}
function renderFlashSingle(){
  const total = appState.flash.singleWords.length;
  const i = appState.flash.singleIndex;
  const w = appState.flash.singleWords[i];
  if(!w){
    if(!appState.flash.markedDone){ appState.today.flashSingleCompletions += 1; appState.flash.markedDone = true; saveState(); checkTaskRewards('flash'); }
    appState.flash.singleDone = true;
    el.flashReplayBtn.classList.remove('hidden');
    el.flashProgress.textContent = `完成 / Hoàn thành`;
    el.flashSingleCard.innerHTML = `<div class="front"><div class="single-main">完成了！</div><div class="single-sub">再一次 / Làm lại</div></div><div class="back"></div>`;
    return;
  }
  el.flashReplayBtn.classList.add('hidden');
  el.flashProgress.textContent = `${i+1} / ${total}`;
  el.flashSingleCard.classList.toggle('flipped', appState.flash.singleFlipped);
  el.flashSingleCard.style.transform = `translateX(${appState.flash.currentTranslate}px) rotate(${appState.flash.currentTranslate/18}deg)`;
  el.flashSingleCard.innerHTML = `
    <div class="front">
      <div class="single-main">${frontText(w)}</div>
      <div class="single-sub">${frontPinyin(w) || '&nbsp;'}</div>
    </div>
    <div class="back">
      <div class="single-main">${w.zh}</div>
      <div class="single-sub">${w.pinyin || ''}</div>
      <div class="single-sub">${w.vi}</div>
    </div>
  `;
  const sideKey = `${w.id}-${appState.flash.singleFlipped ? 'back' : 'front'}-${appState.settings.reverseDirection ? 'vi' : 'zh'}`;
  if(appState.flash.lastSpokenKey !== sideKey){
    appState.flash.lastSpokenKey = sideKey;
    setTimeout(() => {
      if(appState.flash.singleFlipped){ maybeSpeakFlashBack(w); }
      else { maybeSpeakFlashFront(w); }
    }, 140);
  }
}
function resetFlashSingle(){
  appState.flash.singleWords = shuffle(currentWords());
  appState.flash.singleIndex = 0;
  appState.flash.singleFlipped = false;
  appState.flash.singleDone = false;
  appState.flash.currentTranslate = 0;
  appState.flash.lastSpokenKey = '';
  renderFlashSingle();
}
function stepFlash(known){
  const w = appState.flash.singleWords[appState.flash.singleIndex];
  if(known && w) changeHeart(w.id, -1);
  appState.flash.singleIndex += 1;
  appState.flash.singleFlipped = false;
  appState.flash.currentTranslate = 0;
  appState.flash.lastSpokenKey = '';
  renderFlashSingle();
}
function speakByLanguage(text, isVietnamese){
  if(isVietnamese){
    if(appState.settings.viAudio) speakSequence([{text, lang:'vi-VN'}]);
  }else{
    if(appState.settings.zhAudio) speakSequence([{text, lang:'zh-TW'}]);
  }
}
function speakFlashPair(word){
  const items = [];
  if(appState.settings.viAudio) items.push({text: word.vi, lang:'vi-VN'});
  if(appState.settings.zhAudio) items.push({text: word.zh, lang:'zh-TW'});
  speakSequence(items);
}
function maybeSpeakFlashBack(word){
  if(appState.settings.reverseDirection){
    if(appState.settings.zhAudio) speakSequence([{text: word.zh, lang:'zh-TW'}]);
  }else{
    if(appState.settings.viAudio) speakSequence([{text: word.vi, lang:'vi-VN'}]);
  }
}
function maybeSpeakFlashFront(word){
  if(appState.settings.reverseDirection){
    if(appState.settings.viAudio) speakSequence([{text: word.vi, lang:'vi-VN'}]);
  }else{
    if(appState.settings.zhAudio) speakSequence([{text: word.zh, lang:'zh-TW'}]);
  }
}
function toggleSingleFlip(){
  const w = appState.flash.singleWords[appState.flash.singleIndex];
  if(!w) return;
  appState.flash.singleFlipped = !appState.flash.singleFlipped;
  vibrate(15);
  renderFlashSingle();
}



function getQuizDuration(level){ return ({easy:180, normal:120, hard:90})[level] || 120; }
function getQuizDifficultyLabel(level){ return ({easy:`簡單
Dễ · 3:00`, normal:`普通
Vừa · 2:00`, hard:`困難
Khó · 1:30`})[level] || `普通
Vừa · 2:00`; }
function getQuizFeedbackDelay(level){ return ({easy:1200, normal:900, hard:600})[level] || 900; }
function openQuizDifficulty(){
  el.quizDifficultySheet.classList.remove('hidden');
}
function closeQuizDifficulty(){
  el.quizDifficultySheet.classList.add('hidden');
}

function buildQuizQueue(onlyWrong=false){
  appState.quiz.queue = shuffle(onlyWrong ? currentWords().filter(w => heartCount(w.id)>0) : currentWords());
  if(!appState.quiz.queue.length) appState.quiz.queue = shuffle(currentWords());
  appState.quiz.current = null;
  appState.quiz.asked = 0; appState.quiz.score = 0; appState.quiz.wrongItems=[]; appState.quiz.onlyWrong=onlyWrong;
}
function startQuiz(onlyWrong=false, difficulty=appState.quiz.difficulty || 'normal'){
  stopMatch();
  stopSpeech();
  appState.quiz.difficulty = difficulty;
  appState.quiz.duration = getQuizDuration(difficulty);
  buildQuizQueue(onlyWrong);
  appState.quiz.remaining = appState.quiz.duration;
  appState.quiz.active = false;
  el.quizResultSheet.classList.add('hidden');
  el.quizCountdown.classList.remove('hidden');
  showScreen('quizScreen');
  countdown(el.quizCountdown, () => {
    appState.quiz.active = true;
    nextQuizQuestion();
    tickQuiz();
    appState.quiz.timer = setInterval(tickQuiz, 1000);
  });
}
function tickQuiz(){
  const pct = Math.max(0, appState.quiz.remaining / appState.quiz.duration);
  el.quizTimerText.textContent = `${Math.floor(appState.quiz.remaining/60)}:${String(appState.quiz.remaining%60).padStart(2,'0')}`;
  el.quizTimerFill.style.width = `${pct*100}%`;
  el.quizTimerFill.classList.toggle('warn', appState.quiz.remaining <= 15);
  el.quizTimerFill.classList.toggle('danger', appState.quiz.remaining <= 5);
  el.quizTimerFill.classList.toggle('blink', appState.quiz.remaining <= 5);
  if(appState.quiz.remaining <= 0) return finishQuiz();
  appState.quiz.remaining -= 1;
}
function nextQuizQuestion(){
  if(!appState.quiz.queue.length) return finishQuiz();
  appState.quiz.current = appState.quiz.queue.shift();
  appState.quiz.asked += 1;
  const current = appState.quiz.current;
  el.quizProgressText.textContent = `${appState.quiz.asked} / ${currentWords().length}`;
  el.quizPrompt.textContent = promptText(current);
  el.quizPromptPinyin.textContent = (!appState.settings.reverseDirection && appState.settings.showPinyinFront) ? current.pinyin : '';
  el.quizFeedback.innerHTML = '';
  const options = shuffle([current, ...sample(currentWords().filter(w => w.id !== current.id), 3)]);
  el.quizOptions.innerHTML = options.map(w => `<button class="quiz-option" data-quiz="${w.id}">${answerText(w)}</button>`).join('');
  speakPromptForCurrent(current);
}
function speakPromptForCurrent(word){
  if(appState.settings.reverseDirection){
    if(appState.settings.viAudio) speakSequence([{text: word.vi, lang:'vi-VN'}]);
  }else{
    if(appState.settings.zhAudio) speakSequence([{text: word.zh, lang:'zh-TW'}]);
  }
}
function handleQuizAnswer(id){
  if(!appState.quiz.active || !appState.quiz.current) return;
  appState.quiz.active = false;
  const word = appState.quiz.current;
  const correct = id === word.id;
  $$('.quiz-option').forEach(btn => {
    if(btn.dataset.quiz === word.id) btn.classList.add('correct');
    if(btn.dataset.quiz === id && id !== word.id) btn.classList.add('wrong');
    btn.disabled = true;
  });
  if(correct){
    appState.quiz.score += 1;
    changeHeart(word.id, -1);
    vibrate(18);
    el.quizFeedback.innerHTML = `<div>答對了 / Đúng rồi</div>`;
  }else{
    changeHeart(word.id, +1);
    appState.quiz.wrongItems.push(word);
    vibrate([30,30,30]);
    el.quizFeedback.innerHTML = `<div>答錯了 / Sai rồi</div><div>${word.zh}｜${word.vi}｜${word.pinyin}</div>`;
  }
  renderWordlist();
  const delay = getQuizFeedbackDelay(appState.quiz.difficulty);
  setTimeout(()=>{ appState.quiz.active = true; nextQuizQuestion(); }, delay);
}
function stopQuiz(){ if(appState.quiz.timer){ clearInterval(appState.quiz.timer); appState.quiz.timer = null; } appState.quiz.active = false; }
function finishQuiz(){
  stopQuiz();
  const pass = appState.quiz.score >= Math.ceil(currentWords().length * 0.9);
  el.quizBoar.src = pass ? 'assets/boar_happy.png' : 'assets/boar_sad.png';
  el.quizResultTitle.innerHTML = pass ? 'Thành công<br>成功' : 'Thất bại<br>失敗';
  el.quizResultText.innerHTML = `答對 ${appState.quiz.score} 題，共 ${currentWords().length} 題<br>${getQuizDifficultyLabel(appState.quiz.difficulty)}`;
  el.quizResultSheet.classList.remove('hidden');
  if(pass){
    appState.today.quizWins += 1;
    if(appState.settings.reverseDirection) appState.today.quizViToZhPasses += 1;
    else appState.today.quizZhToViPasses += 1;
    saveState();
    checkTaskRewards('quiz');
  }
}

function selectMatchWords(pairCount=9){
  const words = currentWords();
  const wrongs = words.filter(w => heartCount(w.id) > 0).sort((a,b)=>heartCount(b.id)-heartCount(a.id));
  const recent = new Set(appState.match.roundHistory.slice(-2).flat());
  let picked = [];
  picked.push(...wrongs.slice(0, pairCount));
  if(picked.length < pairCount) picked.push(...sample(words.filter(w => !picked.some(p=>p.id===w.id) && !recent.has(w.id)), pairCount - picked.length));
  if(picked.length < pairCount) picked.push(...sample(words.filter(w => !picked.some(p=>p.id===w.id)), pairCount - picked.length));
  return picked.slice(0, pairCount);
}
function buildMatchBoard(){
  const words = selectMatchWords(9);
  appState.match.roundHistory.push(words.map(w=>w.id));
  const zh = words.map(w=>({key:w.id+'_zh', pair:w.id, text:w.zh, type:'zh'}));
  const vi = shuffle(words).map(w=>({key:w.id+'_vi', pair:w.id, text:w.vi, type:'vi'}));
  appState.match.board = shuffle([...zh,...vi]);
  appState.match.selected = null;
  appState.match.matched = 0;
}
function renderMatch(){
  el.matchBoard.innerHTML = appState.match.board.map(card => `
    <button class="match-card ${card.type} ${card.selected?'selected':''} ${card.matched?'correct':''}" data-match="${card.key}">${card.text}</button>
  `).join('');
  el.matchProgressText.textContent = `${appState.match.matched} / 9`;
}
function startMatch(){
  stopQuiz();
  buildMatchBoard();
  renderMatch();
  appState.match.remaining = appState.match.duration;
  appState.match.active = false;
  el.matchResultSheet.classList.add('hidden');
  showScreen('matchScreen');
  el.matchCountdown.classList.remove('hidden');
  countdown(el.matchCountdown, () => {
    appState.match.active = true;
    tickMatch();
    appState.match.timer = setInterval(tickMatch, 1000);
  });
}
function tickMatch(){
  const pct = Math.max(0, appState.match.remaining / appState.match.duration);
  el.matchTimerText.textContent = `0:${String(appState.match.remaining).padStart(2,'0')}`;
  el.matchTimerFill.style.width = `${pct*100}%`;
  el.matchTimerFill.classList.toggle('warn', appState.match.remaining <= 15);
  el.matchTimerFill.classList.toggle('danger', appState.match.remaining <= 5);
  el.matchTimerFill.classList.toggle('blink', appState.match.remaining <= 5);
  if(appState.match.remaining <= 0) return finishMatch(false, true);
  appState.match.remaining -= 1;
}
function stopMatch(){ if(appState.match.timer){ clearInterval(appState.match.timer); appState.match.timer=null; } appState.match.active=false; }
function handleMatch(key){
  if(!appState.match.active) return;
  const card = appState.match.board.find(c=>c.key===key);
  if(!card || card.matched) return;
  if(!appState.match.selected){
    appState.match.selected = card.key;
    card.selected = true;
    vibrate(12);
    renderMatch(); return;
  }
  const first = appState.match.board.find(c=>c.key===appState.match.selected);
  if(!first || first.key===card.key) return;
  first.selected = false;
  if(first.pair === card.pair && first.type !== card.type){
    const wordId = card.pair;
    changeHeart(wordId, -1);
    first.matched = true; card.matched = true;
    appState.match.matched += 1;
    vibrate(18);
    if(appState.match.matched === 9){ renderMatch(); return finishMatch(true,false); }
  } else {
    changeHeart(first.pair, +1);
    changeHeart(card.pair, +1);
    vibrate([30,30,30]);
  }
  appState.match.selected = null;
  renderMatch();
  renderWordlist();
}
function finishMatch(success, timeout){
  stopMatch();
  if(success){
    el.matchBoar.src = 'assets/boar_happy.png';
    el.matchResultTitle.innerHTML = 'Thành công<br>成功';
    el.matchResultText.innerHTML = '山豬大王得到肉肉了！<br>Chúa tể heo rừng nhận được thịt rồi!';
  } else if(timeout){
    el.matchBoar.src = 'assets/boar_tired.png';
    el.matchResultTitle.innerHTML = 'Hết giờ<br>時間到';
    el.matchResultText.innerHTML = '差一點！再試一次！<br>Suýt nữa thôi! Hãy thử lại!';
  } else {
    el.matchBoar.src = 'assets/boar_sad.png';
    el.matchResultTitle.innerHTML = 'Thất bại<br>失敗';
    el.matchResultText.innerHTML = '沒關係，再試一次！<br>Không sao, thử lại nhé!';
  }
  el.matchResultSheet.classList.remove('hidden');
  if(success){
    appState.today.matchWins += 1;
    saveState();
    checkTaskRewards('match');
  }
}

function openWrongModal(){
  const wrongs = appState.quiz.wrongItems;
  el.wrongList.innerHTML = wrongs.length ? wrongs.map(w => `<div class="word-item card"><div class="word-main">${w.zh}</div><div class="word-pinyin">${w.pinyin}</div><div class="word-vi">${w.vi}</div></div>`).join('') : '<p>沒有錯題</p>';
  el.wrongModal.classList.remove('hidden');
}
function closeWrongModal(){ el.wrongModal.classList.add('hidden'); }

function openSettings(){
  el.pinyinToggle.checked = appState.settings.showPinyinFront;
  el.directionToggle.checked = appState.settings.reverseDirection;
  el.zhAudioToggle.checked = appState.settings.zhAudio;
  el.viAudioToggle.checked = appState.settings.viAudio;
  el.hapticToggle.checked = appState.settings.haptic;
  el.settingsSheet.classList.remove('hidden');
}
function closeSettings(){ el.settingsSheet.classList.add('hidden'); }

function countdown(target, done){
  let n = 3;
  target.textContent = '3';
  const t = setInterval(()=>{
    n -= 1;
    if(n === 0){ target.textContent = '1'; return; }
    if(n === -1){ target.textContent = '開始'; return; }
    if(n < -1){ clearInterval(t); target.classList.add('hidden'); done(); return; }
    target.textContent = String(n);
  }, 700);
}

function speakSequence(items){
  if(!('speechSynthesis' in window)) return;
  stopSpeech();
  let delay = 0;
  items.forEach(item => {
    if(!item.text) return;
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.lang;
    u.rate = 0.9;
    setTimeout(()=>window.speechSynthesis.speak(u), delay);
    delay += 430;
  });
}
function stopSpeech(){ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }
function speakWordlist(word){
  const items = [];
  if(appState.settings.viAudio) items.push({text: word.vi, lang:'vi-VN'});
  if(appState.settings.zhAudio) items.push({text: word.zh, lang:'zh-TW'});
  speakSequence(items);
}
function vibrate(pattern){ if(appState.settings.haptic && navigator.vibrate) navigator.vibrate(pattern); }

function updateStudyTime(){
  const now = Date.now();
  const todayDate = initToday().date;
  if(appState.today.date !== todayDate){ appState.today = initToday(); appState.study.milestoneShown = false; saveState(); }
  const delta = Math.min(5, Math.floor((now - appState.study.lastTick)/1000));
  if(delta > 0){ appState.today.seconds += delta; appState.study.lastTick = now; saveState(); }
  const mins = Math.floor(appState.today.seconds / 60);
  if(appState.currentScreen === 'achievementScreen') renderAchievement();
  if(mins >= 15 && !appState.study.milestoneShown){
    appState.study.milestoneShown = true;
    openBoarModal('assets/boar_proud.png','Chúa tể heo rừng<br>山豬大王',`今天學習了15分鐘了！你好棒！<br>Hôm nay bạn đã học 15 phút rồi!`);
  }
}
function formatDateYMD(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}/${m}/${day}`;
}
function setDiamond(elm, done){
  if(!elm) return;
  elm.classList.toggle('on', done);
  elm.classList.toggle('off', !done);
}
function renderAchievement(){
  const mins = Math.floor(appState.today.seconds / 60);
  const zhViDone = Math.min(appState.today.quizZhToViPasses || 0, 1);
  const viZhDone = Math.min(appState.today.quizViToZhPasses || 0, 1);
  const matchDone = Math.min(appState.today.matchWins || 0, 3);
  const completed = (zhViDone>=1?1:0) + (viZhDone>=1?1:0) + (matchDone>=3?1:0);
  const progress = Math.round((completed/3)*100);
  el.achievementDate.textContent = formatDateYMD(appState.today.date);
  el.todayStudyText.textContent = `Hôm nay đã học ${mins} phút`;
  el.achievementProgressText.textContent = `${completed} / 3`;
  el.achievementProgressFill.style.width = `${progress}%`;
  el.missionQuizZhViState.textContent = `${zhViDone} / 1`;
  el.missionQuizViZhState.textContent = `${viZhDone} / 1`;
  el.missionMatchState.textContent = `${matchDone} / 3`;
  setDiamond(el.diamondQuizZhVi, zhViDone>=1);
  setDiamond(el.diamondQuizViZh, viZhDone>=1);
  setDiamond(el.diamondMatch, matchDone>=3);
  el.achievementBoar.src = completed > 0 ? 'assets/boar_proud.png' : 'assets/boar_study.png';
}


function checkTaskRewards(source){
  const messages=[];
  if(source==='quiz' && !appState.settings.reverseDirection && (appState.today.quizZhToViPasses||0)===1) messages.push(`💎 完成中文→越文任務！<br>Hoàn thành nhiệm vụ Trung → Việt!`);
  if(source==='quiz' && appState.settings.reverseDirection && (appState.today.quizViToZhPasses||0)===1) messages.push(`💎 完成越文→中文任務！<br>Hoàn thành nhiệm vụ Việt → Trung!`);
  if(source==='match' && (appState.today.matchWins||0)===3) messages.push(`💎 完成配對任務！<br>Hoàn thành nhiệm vụ ghép cặp!`);
  if(messages.length){
    openBoarModal('assets/boar_proud.png','Chúa tể heo rừng<br>山豬大王',`亮晶晶的鑽石到手了！<br>${messages.join('<br>')}`);
  }
}

function openBoarModal(img,title,text){
  el.boarModalImg.src = img;
  el.boarModalTitle.innerHTML = (title || 'Chúa tể heo rừng<br>山豬大王').replace(/\n/g,'<br>');
  el.boarModalText.innerHTML = String(text || '').replace(/\n/g,'<br>');
  el.boarModal.classList.remove('hidden');
}
function closeBoarModal(){ el.boarModal.classList.add('hidden'); }

function bindEvents(){
  const startBtn = $('#startBtn');
  if(startBtn){ startBtn.onclick = () => {
    appState.currentUnit = Number(el.unitSelect.value);
    if(el.menuUnitSelect) el.menuUnitSelect.value = appState.currentUnit;
    renderMenu();
    showScreen('menuScreen');
  }; }
  if(el.menuUnitSelect){ el.menuUnitSelect.onchange = () => { appState.currentUnit = Number(el.menuUnitSelect.value); renderMenu(); }; }
  $$('.dock-btn').forEach(btn => btn.onclick = () => {
    const map = {menu:'menuScreen', achievement:'achievementScreen', help:'helpScreen'};
    if(btn.dataset.dock === 'help') renderHelp();
    showScreen(map[btn.dataset.dock]);
  });
  $$('[data-action="home"]').forEach(b => b.onclick = () => showScreen('menuScreen'));
  $$('[data-action="back"]').forEach(b => b.onclick = goBack);
  $$('[data-action="menu"]').forEach(b => b.onclick = () => { stopQuiz(); stopMatch(); showScreen('menuScreen'); });
  $$('[data-action="settings"]').forEach(b => b.onclick = openSettings);
  $('#closeSettingsBtn').onclick = $('#settingsBackdrop').onclick = closeSettings;
  $('#goHomeBtn').onclick = () => { closeSettings(); showScreen('menuScreen'); };
  $('#goBackBtn').onclick = goBack;
  $('#resetHeartsBtn').onclick = () => { appState.hearts = {}; saveState(); renderWordlist(); closeSettings(); };

  el.pinyinToggle.onchange = (e) => { appState.settings.showPinyinFront = e.target.checked; saveState(); renderFlash(); };
  el.directionToggle.onchange = (e) => { appState.settings.reverseDirection = e.target.checked; saveState(); renderFlash(); renderWordlist(); };
  el.zhAudioToggle.onchange = (e) => { appState.settings.zhAudio = e.target.checked; saveState(); };
  el.viAudioToggle.onchange = (e) => { appState.settings.viAudio = e.target.checked; saveState(); };
  el.hapticToggle.onchange = (e) => { appState.settings.haptic = e.target.checked; saveState(); };

  $$('.menu-btn').forEach(btn => btn.onclick = () => {
    const mode = btn.dataset.mode;
    if(mode === 'wordlist'){ renderWordlist(); showScreen('wordlistScreen'); }
    if(mode === 'flash'){ renderFlash(); showScreen('flashScreen'); }
    if(mode === 'quiz'){ openQuizDifficulty(); }
    if(mode === 'match'){ startMatch(); }
  });

  el.wordlistContainer.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-speak-word]');
    if(!btn) return;
    const word = currentWords().find(w=>w.id===btn.dataset.speakWord);
    if(word) speakWordlist(word);
  });

  $$('.seg-btn').forEach(btn => btn.onclick = () => { appState.flash.view = btn.dataset.flashView; renderFlash(); });
  $('#shuffleFlashBtn').onclick = () => { buildFlashGrid(); renderFlash(); };
  el.flashGrid.addEventListener('click', (e)=>{
    const card = e.target.closest('.flash-card');
    if(!card) return;
    card.classList.toggle('flipped');
    const word = appState.flash.gridWords.find(w=>w.id===card.dataset.flashId);
    if(card.classList.contains('flipped') && word){
      speakFlashPair(word);
      vibrate(12);
    }
  });

  el.flashSingleCard.addEventListener('click', toggleSingleFlip);
  let dragging = false;
  el.flashSingleCard.addEventListener('pointerdown', (e)=>{ dragging=true; appState.flash.dragStartX = e.clientX; appState.flash.currentTranslate = 0; el.flashSingleCard.setPointerCapture(e.pointerId); });
  el.flashSingleCard.addEventListener('pointermove', (e)=>{
    if(!dragging || appState.flash.singleFlipped || appState.flash.singleDone) return;
    appState.flash.currentTranslate = e.clientX - appState.flash.dragStartX;
    renderFlashSingle();
  });
  el.flashSingleCard.addEventListener('pointerup', ()=> {
    if(!dragging) return; dragging=false;
    const dx = appState.flash.currentTranslate;
    if(Math.abs(dx) > 90){
      vibrate(20);
      stepFlash(dx > 0);
    }else{
      appState.flash.currentTranslate = 0; renderFlashSingle();
    }
  });
  $('#swipeLeftBtn').onclick = () => { vibrate(20); stepFlash(false); };
  $('#swipeRightBtn').onclick = () => { vibrate(20); stepFlash(true); };
  $('#flashReplayBtn').onclick = resetFlashSingle;

  el.quizOptions.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-quiz]');
    if(btn){
      const chosen = currentWords().find(w=>w.id===btn.dataset.quiz);
      handleQuizAnswer(chosen.id);
    }
  });
  $('#quizRestartBtn').onclick = () => startQuiz(false, appState.quiz.difficulty);
  $('#quizWrongBtn').onclick = openWrongModal;
  $('#quizMenuBtn').onclick = () => showScreen('menuScreen');
  $('#closeWrongBtn').onclick = $('#wrongBackdrop').onclick = closeWrongModal;
  $('#retryWrongBtn').onclick = () => { closeWrongModal(); startQuiz(true, appState.quiz.difficulty); };

  el.matchBoard.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-match]');
    if(btn) handleMatch(btn.dataset.match);
  });
  $('#matchRestartBtn').onclick = () => startMatch();
  $('#matchMenuBtn').onclick = () => showScreen('menuScreen');


  $('#closeQuizDifficultyBtn').onclick = $('#quizDifficultyBackdrop').onclick = closeQuizDifficulty;
  $$("[data-quiz-difficulty]").forEach(btn => btn.onclick = () => {
    closeQuizDifficulty();
    startQuiz(false, btn.dataset.quizDifficulty);
  });

  $('#closeBoarBtn').onclick = $('#boarBackdrop').onclick = closeBoarModal;

  document.addEventListener('visibilitychange', ()=>{ appState.study.lastTick = Date.now(); });
}

loadState();
renderHome();
renderMenu();
renderHelp();
bindEvents();
showScreen('menuScreen', false);
setInterval(updateStudyTime, 1000);
