
const storageKey = 'b1_mobile_app_v10_2';
const data = window.APP_DATA;
const appState = {
  currentUnit: 1,
  currentScreen: 'homeScreen',
  screenHistory: ['homeScreen'],
  settings: {
    showPinyinFront: false,
    reverseDirection: false,
    zhAudio: true,
    viAudio: false,
    haptic: true,
  },
  hearts: {},
  practiced: {},
  streak: { count: 0, lastDate: '' },
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
    wrongItems: [], onlyWrong:false, active:false, difficulty:'normal',
    isReview: false, reviewWordCount: 0
  },
  match: {
    duration: 40, remaining: 40, timer: null, board: [], selected: null, matched: 0,
    active:false, roundHistory:[]
  },
  study: {
    startedAt: Date.now(),
    lastTick: Date.now(),
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
  quizDifficultySheet: $('#quizDifficultySheet'),
  diamondRow: $('#diamondRow'),
};

function initToday(){
  const now = new Date();
  return {
    date: now.toISOString().slice(0,10),
    seconds: 0,
    quizWins: 0,
    matchWins: 0,
    flashPlays: 0,
    perfectQuizDone: 0,
    goodQuizCount: 0,
    matchSuccesses: 0,
    sessionTitle: '',
    studiedUnits: [],
    wrongWordIds: [],
    milestoneShown: false,
  };
}
function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if(saved.settings) Object.assign(appState.settings, saved.settings);
    if(saved.hearts) appState.hearts = saved.hearts;
    if(saved.practiced) appState.practiced = saved.practiced;
    if(saved.streak) appState.streak = saved.streak;
    if(saved.today && saved.today.date === initToday().date) appState.today = saved.today;
  }catch(e){}
}
function saveState(){
  localStorage.setItem(storageKey, JSON.stringify({
    settings: appState.settings,
    hearts: appState.hearts,
    practiced: appState.practiced,
    streak: appState.streak,
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
  if(id === 'achievementScreen') renderAchievement();
  if(id === 'homeScreen') renderHome();
}
function updateDock(id){
  const map = {homeScreen:'home', achievementScreen:'achievement', helpScreen:'help'};
  const active = map[id];
  $$('.dock-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.dock === active));
}

function goBack(){
  closeSettings();
  if(appState.currentScreen === 'homeScreen') return;
  if(appState.currentScreen === 'quizScreen') stopQuiz();
  if(appState.currentScreen === 'matchScreen') stopMatch();
  const prev = appState.screenHistory[appState.screenHistory.length-2] || 'homeScreen';
  appState.screenHistory.pop();
  showScreen(prev,false);
}

function renderHome(){
  const q = appState.quotes[Math.floor(Math.random()*appState.quotes.length)];
  el.quoteZh.textContent = q.zh;
  el.quoteVi.textContent = q.vi;
  el.unitSelect.innerHTML = appState.units.map(u => `<option value="${u.unit}">${u.labelVi}</option>`).join('');
  el.unitSelect.value = appState.currentUnit;
  renderMenu();
}

function renderMenu(){ el.menuTitle.innerHTML = `Bài ${appState.currentUnit}`; }

function renderHelp(){
  const total = appState.units.reduce((sum,u)=>sum+u.words.length,0);
  el.helpArticle.innerHTML = `
    <h2>📘 Hướng dẫn / 使用說明</h2>

    <h3>📚 Về bài học / 關於課程</h3>
    <p>Gồm <b>${total}</b> từ vựng TOCFL B1, chia thành <b>35 bài</b>.<br/>
    整理了 TOCFL B1 的單字，共 <b>${total}</b> 個，分成 <b>35 個單元</b>。</p>
    <p>💡 Mỗi ngày <b>15 phút</b>, luyện thường xuyên hiệu quả hơn học dồn.<br/>
    每天花 <b>15 分鐘</b> 練習，比一次學很久更有效。</p>

    <h3>⚙ Cài đặt / 設定</h3>
    <p>Nhấn <b>⚙</b> ở góc phải trên để mở cài đặt.<br/>
    按右上角 <b>⚙</b> 可以打開設定。</p>
    <p><b>Pinyin ở mặt trước</b> — Hiển thị phiên âm khi luyện thẻ.<br/>
    在翻卡正面顯示拼音。</p>
    <p><b>Việt ↔ Trung</b> — Đổi chiều học: nhìn tiếng Việt đoán tiếng Trung.<br/>
    切換學習方向：看越南文猜中文。</p>
    <p><b>Âm thanh tiếng Trung / Việt</b> — Bật phát âm tự động.<br/>
    打開後遊戲和翻卡會自動播放發音，可以跟著練習。</p>
    <p><b>Rung phản hồi</b> — Rung khi trả lời đúng/sai.<br/>
    答題時震動回饋。</p>

    <h3>🔁 Cách luyện tập / 練習方式</h3>
    <p><b>🔊 Danh sách từ / 單字表</b><br/>
    Nhấn vào từ để nghe. Luyện phát âm theo.<br/>
    按單字播放發音，可以跟著朗讀。</p>
    <p><b>🃏 Lật thẻ / 翻卡</b><br/>
    Nhiều thẻ: luyện nhìn nhanh. Từng thẻ: luyện nhận diện, vuốt sang trái/phải.<br/>
    多張練習瀏覽；單張模式可左右滑動（或鍵盤 ←→）。</p>
    <p><b>🧠 4 lựa chọn / 四選一</b><br/>
    Kiểm tra trí nhớ trong thời gian giới hạn với 3 mức độ khó.<br/>
    有3種難度，在限時內測驗記憶。</p>
    <p><b>🧩 Ghép cặp / 配對</b><br/>
    Nối từ Trung–Việt trong 40 giây. Hoàn thành đúng giờ mới tính nhiệm vụ.<br/>
    40秒內配對中文和越南文，時間內完成才算任務成功。</p>
    <p><b>💔 Luyện từ sai / 錯題加強</b><br/>
    Bài luyện không tính giờ với các từ sai hôm nay. Nhấn 💔 ở thanh điều hướng.<br/>
    用今天答錯的單字進行不計時練習，按下方 💔 按鈕進入。</p>

    <h3>💔 Lỗi sai / 心碎記錄</h3>
    <p>Sai → xuất hiện 💔. Đúng → giảm 💔. Vào Cài đặt để đặt lại.<br/>
    答錯出現 💔，答對一次減少一顆。可在「設定」重新歸零。</p>

    <h3>🌱 Cuối cùng / 最後</h3>
    <p>Thành công không đến ngay, nhưng ngày càng gần hơn 😊<br/>
    成功不會馬上到來，但是會越來越靠近 😊</p>

    <hr style="border:none;border-top:1px solid var(--line);margin:16px 0"/>
    <p style="font-size:12px;color:var(--sub);line-height:1.8">
      🐗 Được tạo ra bởi <a href="https://www.instagram.com/dajiangshan999" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700">@dajiangshan999</a><br/>
      本應用程式由 <b>大江山</b> 製作，所有設計、介面與圖片著作權均歸作者所有。<br/>
      單字內容來源：TOCFL B1 公開詞彙表。<br/>
      © 2026 dajiangshan999 · <a href="mailto:jiang.universe999@gmail.com" style="color:var(--accent)">jiang.universe999@gmail.com</a>
    </p>
  `;
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

function trackStudiedUnit(){
  if(!appState.today.studiedUnits) appState.today.studiedUnits = [];
  if(!appState.today.studiedUnits.includes(appState.currentUnit)){
    appState.today.studiedUnits.push(appState.currentUnit);
    saveState();
  }
}

function unitFamiliarity(unitId){
  const unit = appState.units.find(u=>u.unit===unitId);
  if(!unit) return 0;
  const words = unit.words;
  // Only count words that have been practiced at least once AND currently have 0 hearts
  const known = words.filter(w => appState.practiced[w.id] && (appState.hearts[w.id]||0)===0).length;
  return Math.round((known / words.length) * 100);
}

function markPracticed(wordId){
  appState.practiced[wordId] = true;
}

function updateStreak(){
  const today = initToday().date;
  if(appState.streak.lastDate === today) return; // already updated today
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().slice(0, 10);
  if(appState.streak.lastDate === yDate){
    appState.streak.count += 1; // consecutive day
  } else {
    appState.streak.count = 1; // streak broken or first time
  }
  appState.streak.lastDate = today;
  saveState();
}

function buildFlashGrid(){
  appState.flash.gridWords = sample(currentWords(), 16);
}
function renderFlash(){
  $$('.seg-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.flashView === appState.flash.view));
  $('#flashGridWrap').classList.toggle('active', appState.flash.view === 'grid');
  $('#flashSingleWrap').classList.toggle('active', appState.flash.view === 'single');
  $('#shuffleFlashBtn').classList.toggle('hidden', appState.flash.view !== 'grid');
  if(appState.flash.view === 'grid'){
    trackStudiedUnit();
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
    trackStudiedUnit();
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
  if(w) markPracticed(w.id);
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
function getQuizDifficultyLabel(level){ return ({easy:`簡單\nDễ · 3:00`, normal:`普通\nVừa · 2:00`, hard:`困難\nKhó · 1:30`})[level] || `普通\nVừa · 2:00`; }
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
  trackStudiedUnit();
  appState.quiz.difficulty = difficulty;
  appState.quiz.duration = getQuizDuration(difficulty);
  appState.quiz.isReview = false;
  buildQuizQueue(onlyWrong);
  appState.quiz.remaining = appState.quiz.duration;
  appState.quiz.active = false;
  el.quizResultSheet.classList.add('hidden');
  el.quizCountdown.classList.remove('hidden');
  document.getElementById('quizTimerBox').classList.remove('hidden');
  document.getElementById('quizTitle').textContent = '🧠 四選一';
  showScreen('quizScreen');
  countdown(el.quizCountdown, () => {
    appState.quiz.active = true;
    nextQuizQuestion();
    tickQuiz();
    appState.quiz.timer = setInterval(tickQuiz, 1000);
  });
}
function tickQuiz(){
  if(appState.quiz.isReview) return; // no timer for review
  const pct = Math.max(0, appState.quiz.remaining / appState.quiz.duration);
  el.quizTimerText.textContent = `${Math.floor(appState.quiz.remaining/60)}:${String(appState.quiz.remaining%60).padStart(2,'0')}`;
  el.quizTimerFill.style.width = `${pct*100}%`;
  el.quizTimerFill.classList.toggle('warn', appState.quiz.remaining <= 15);
  el.quizTimerFill.classList.toggle('danger', appState.quiz.remaining <= 5);
  el.quizTimerFill.classList.toggle('blink', appState.quiz.remaining <= 5);
  if(appState.quiz.remaining <= 0) return finishQuiz(true);
  appState.quiz.remaining -= 1;
}
function nextQuizQuestion(){
  if(!appState.quiz.queue.length) return appState.quiz.isReview ? finishReviewQuiz() : finishQuiz();
  appState.quiz.current = appState.quiz.queue.shift();
  appState.quiz.asked += 1;
  const current = appState.quiz.current;
  el.quizProgressText.textContent = appState.quiz.isReview
    ? `${appState.quiz.asked} / ${appState.quiz.reviewWordCount}`
    : `${appState.quiz.asked} / ${currentWords().length}`;
  el.quizPrompt.textContent = promptText(current);
  el.quizPromptPinyin.textContent = (!appState.settings.reverseDirection && appState.settings.showPinyinFront) ? current.pinyin : '';
  el.quizFeedback.innerHTML = '';
  const pool = appState.quiz.isReview ? appState.units.flatMap(u=>u.words) : currentWords();
  const options = shuffle([current, ...sample(pool.filter(w=>w.id!==current.id), 3)]);
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
  markPracticed(word.id);
  if(correct){
    appState.quiz.score += 1;
    changeHeart(word.id, -1);
    vibrate(18);
    el.quizFeedback.innerHTML = `<div>答對了 / Đúng rồi</div>`;
  }else{
    changeHeart(word.id, +1);
    appState.quiz.wrongItems.push(word);
    // Track wrong word for review quiz
    if(!appState.today.wrongWordIds) appState.today.wrongWordIds = [];
    if(!appState.today.wrongWordIds.includes(word.id)) appState.today.wrongWordIds.push(word.id);
    vibrate([30,30,30]);
    el.quizFeedback.innerHTML = `<div>答錯了 / Sai rồi</div><div>${word.zh}｜${word.vi}｜${word.pinyin}</div>`;
  }
  renderWordlist();
  const delay = getQuizFeedbackDelay(appState.quiz.difficulty);
  setTimeout(()=>{ appState.quiz.active = true; nextQuizQuestion(); }, delay);
}
function stopQuiz(){ if(appState.quiz.timer){ clearInterval(appState.quiz.timer); appState.quiz.timer = null; } appState.quiz.active = false; }

function triggerBoarPop(imgEl){
  imgEl.classList.remove('boar-pop');
  void imgEl.offsetWidth;
  imgEl.classList.add('boar-pop');
}

function finishQuiz(timeUp=false){
  if(appState.quiz.isReview) return finishReviewQuiz();
  stopQuiz();
  const asked = appState.quiz.asked;
  const score = appState.quiz.score;
  const accuracy = asked > 0 ? score/asked : 0;
  if(!timeUp && asked > 0 && appState.quiz.wrongItems.length === 0){
    appState.today.perfectQuizDone = (appState.today.perfectQuizDone||0)+1;
  }
  if(!timeUp && asked > 0 && accuracy >= 0.8){
    appState.today.goodQuizCount = (appState.today.goodQuizCount||0)+1;
  }
  let title, boarSrc;
  if(timeUp){
    title='時間到！還不夠熟悉喔 @@\nHết giờ! Cần luyện thêm nha!';
    boarSrc='assets/boar_confused_think.png';
  } else if(accuracy===1 && asked>0){
    title='太完美了！🌟\nHoàn hảo tuyệt đối!';
    boarSrc='assets/boar_study_victory.png';
  } else if(accuracy>=0.8){
    title='很棒喔！🎉\nGiỏi lắm!';
    boarSrc='assets/boar_rich_eyes.png';
  } else if(accuracy>=0.5){
    title='哎呀！再一次一定可以的！💪\nCố lên! Lần sau chắc chắn được!';
    boarSrc='assets/boar_confused_think.png';
  } else {
    title='先回翻卡區練習一下再回來吧，慢慢來 🐗\nHãy luyện lật thẻ rồi thử lại nhé!';
    boarSrc='assets/boar_angry_cry_locked.png';
  }
  el.quizBoar.src = boarSrc;
  triggerBoarPop(el.quizBoar);
  el.quizResultTitle.textContent = title;
  el.quizResultText.textContent = `${score}／${asked} 題 (${Math.round(accuracy*100)}%)｜${getQuizDifficultyLabel(appState.quiz.difficulty)}`;
  el.quizResultSheet.classList.remove('hidden');
  appState.today.quizWins += 1;
  saveState();
  checkTaskRewards('quiz');
}

function startReviewQuiz(){
  const wrongIds = new Set(appState.today.wrongWordIds||[]);
  let wrongWords = [];
  appState.units.forEach(u=>u.words.forEach(w=>{if(wrongIds.has(w.id)) wrongWords.push(w);}));
  if(!wrongWords.length){
    openBoarModal('assets/boar_rich_eyes.png','🐗 山豬大王','今天還沒有錯題！\n繼續練習來挑戰看看吧！🎉\n\nHôm nay chưa có từ sai!\nHãy luyện tập và thử thách nhé!');
    return;
  }
  stopMatch(); stopSpeech();
  appState.quiz.isReview = true;
  appState.quiz.difficulty = 'review';
  appState.quiz.duration = 9999;
  appState.quiz.queue = shuffle(wrongWords);
  appState.quiz.reviewWordCount = wrongWords.length;
  appState.quiz.current = null;
  appState.quiz.asked = 0; appState.quiz.score = 0;
  appState.quiz.wrongItems = []; appState.quiz.onlyWrong = false;
  appState.quiz.remaining = 9999;
  appState.quiz.active = false;
  el.quizResultSheet.classList.add('hidden');
  el.quizCountdown.classList.remove('hidden');
  document.getElementById('quizTimerBox').classList.add('hidden');
  document.getElementById('quizTitle').textContent = '💔 錯題加強';
  showScreen('quizScreen');
  countdown(el.quizCountdown, ()=>{
    appState.quiz.active = true;
    nextQuizQuestion();
    // no timer for review
  });
}

function finishReviewQuiz(){
  stopQuiz();
  const asked = appState.quiz.asked;
  const score = appState.quiz.score;
  el.quizBoar.src = 'assets/boar_boba.png';
  triggerBoarPop(el.quizBoar);
  el.quizResultTitle.textContent = '辛苦了！🧋';
  el.quizResultText.textContent = `今天學會了很多新單字！\nRất cố gắng! Hôm nay bạn đã học được nhiều từ mới!\n✅ ${score}／${asked} 題`;
  el.quizResultSheet.classList.remove('hidden');
  document.getElementById('quizTimerBox').classList.remove('hidden');
  document.getElementById('quizTitle').textContent = '🧠 四選一';
  appState.quiz.isReview = false;
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
  trackStudiedUnit();
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
    markPracticed(wordId);
    changeHeart(wordId, -1);
    first.matched = true; card.matched = true;
    appState.match.matched += 1;
    vibrate(18);
    if(appState.match.matched === 9){ renderMatch(); return finishMatch(true,false); }
  } else {
    // Track wrong words for review
    if(!appState.today.wrongWordIds) appState.today.wrongWordIds = [];
    [first.pair, card.pair].forEach(id=>{if(!appState.today.wrongWordIds.includes(id)) appState.today.wrongWordIds.push(id);});
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
  triggerBoarPop(el.matchBoar);
  if(success){
    el.matchBoar.src = 'assets/boar_rich_eyes.png';
    el.matchResultTitle.textContent = '成功 / Thành công';
    el.matchResultText.textContent = '山豬大王得到肉肉了！';
  } else if(timeout){
    el.matchBoar.src = 'assets/boar_confused_think.png';
    el.matchResultTitle.textContent = '時間到 / Hết giờ';
    el.matchResultText.textContent = '差一點！再試一次！';
  } else {
    el.matchBoar.src = 'assets/boar_angry_cry_locked.png';
    el.matchResultTitle.textContent = '失敗 / Thất bại';
    el.matchResultText.textContent = '沒關係，再試一次！';
  }
  el.matchResultSheet.classList.remove('hidden');
  appState.today.matchWins += 1;
  if(success) appState.today.matchSuccesses = (appState.today.matchSuccesses || 0) + 1;
  saveState();
  checkTaskRewards('match');
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

let _voicesReady = false;
function ensureVoices(cb){
  const voices = window.speechSynthesis.getVoices();
  if(voices.length){ _voicesReady = true; cb(); return; }
  if(_voicesReady){ cb(); return; }
  window.speechSynthesis.onvoiceschanged = () => { _voicesReady = true; cb(); };
}
function speakSequence(items){
  if(!('speechSynthesis' in window)) return;
  const filtered = items.filter(i => i.text);
  if(!filtered.length) return;
  stopSpeech();
  ensureVoices(() => {
    let idx = 0;
    function speakNext(){
      if(idx >= filtered.length) return;
      const item = filtered[idx++];
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = item.lang;
      u.rate = 0.9;
      u.onend = speakNext;
      // Chrome desktop bug: speechSynthesis can stall — kick it if needed
      window.speechSynthesis.cancel();
      setTimeout(() => window.speechSynthesis.speak(u), 50);
    }
    speakNext();
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
  if(appState.today.date !== todayDate){ appState.today = initToday(); saveState(); }
  const delta = Math.min(5, Math.floor((now - appState.study.lastTick)/1000));
  if(delta > 0){ appState.today.seconds += delta; appState.study.lastTick = now; updateStreak(); saveState(); }
  const mins = Math.floor(appState.today.seconds / 60);
  if(appState.currentScreen === 'achievementScreen') renderAchievement();
  if(mins >= 15 && !appState.today.milestoneShown){
    appState.today.milestoneShown = true;
    const encouragements = ['我會繼續加油的！💪\nTôi sẽ cố gắng tiếp!','我是最棒的！🌟\nTôi giỏi nhất!','我愛學中文！❤️\nTôi yêu học tiếng Trung!','繼續衝！🔥\nTiếp tục nào!'];
    const btnText = encouragements[Math.floor(Math.random()*encouragements.length)];
    openBoarModal('assets/boar_study_victory.png','🐗 山豬大王說','今天學習了15分鐘！\n你好棒喔！🌟\n\nHôm nay bạn đã học 15 phút!\nBạn thật giỏi!', btnText);
  }
}

function formatDate(){
  const now = new Date();
  const viDays=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  return `${viDays[now.getDay()]}, ${now.getDate()}/${now.getMonth()+1}`;
}

function renderEmojiProgress(containerId, emoji, done, goal){
  const el = document.getElementById(containerId);
  if(!el) return;
  let html = '';
  for(let i=0; i<goal; i++){
    html += `<span class="emoji-prog${i < done ? ' earned' : ''}">${emoji}</span>`;
  }
  el.innerHTML = html;
}

function renderUnitProgress(){
  const studied = (appState.today.studiedUnits||[]).slice(-2);
  const section = document.getElementById('unitProgressSection');
  if(!section) return;
  if(!studied.length){section.innerHTML='';return;}
  section.innerHTML = `<div class="unit-prog-title">📚 Bài đã học hôm nay</div>`+studied.map(uid=>{
    const unit=appState.units.find(u=>u.unit===uid);
    const fam=unitFamiliarity(uid);
    return `<div class="unit-prog-item"><div class="unit-prog-label"><span>${unit?unit.labelVi:'Bài '+uid}</span><span>${fam}%</span></div><div class="unit-prog-track"><div class="unit-prog-fill" style="width:${fam}%"></div></div></div>`;
  }).join('');
}

function renderAchievement(){
  const mins = Math.floor(appState.today.seconds / 60);
  const task1Done = Math.min(appState.today.perfectQuizDone || 0, 1);
  const task2Done = Math.min(appState.today.goodQuizCount || 0, 3);
  const task3Done = Math.min(appState.today.matchSuccesses || 0, 3);
  const diamonds = (task1Done >= 1 ? 1 : 0) + (task2Done >= 3 ? 1 : 0) + (task3Done >= 3 ? 1 : 0);
  el.todayStudyText.innerHTML = `⏱ <b>${mins}</b> phút`;
  if(el.diamondRow) el.diamondRow.innerHTML =
    '<span>💎</span>'.repeat(diamonds) +
    '<span style="filter:grayscale(1) opacity(0.25)">💎</span>'.repeat(3 - diamonds);

  // Emoji progress for missions
  renderEmojiProgress('missionTask1Emojis', '🍗', task1Done, 1);
  renderEmojiProgress('missionTask2Emojis', '🥩', task2Done, 3);
  renderEmojiProgress('missionTask3Emojis', '🍖', task3Done, 3);

  document.getElementById('missionTask1').classList.toggle('done', task1Done >= 1);
  document.getElementById('missionTask2').classList.toggle('done', task2Done >= 3);
  document.getElementById('missionTask3').classList.toggle('done', task3Done >= 3);

  // Boar state based on diamonds
  el.achievementBoar.src = diamonds >= 3 ? 'assets/boar_study_victory.png' : diamonds >= 1 ? 'assets/boar_rich_eyes.png' : 'assets/boar_confused_think.png';

  // Streak
  const streakEl = document.getElementById('streakRow');
  if(streakEl){
    const s = appState.streak.count || 0;
    streakEl.innerHTML = s >= 2
      ? `🔥 <b>${s}</b> ngày liên tiếp / 連續 <b>${s}</b> 天`
      : `🌱 Ngày đầu tiên / 第一天`;
  }

  // Date and editable title
  document.getElementById('achieveDate').textContent = formatDate();
  const titleEl = document.getElementById('achieveTitle');
  if(titleEl && document.activeElement !== titleEl) titleEl.value = appState.today.sessionTitle || '';

  // Unit progress
  renderUnitProgress();
}


function checkTaskRewards(source){
  const messages = [];
  if(source === 'quiz'){
    if((appState.today.perfectQuizDone || 0) === 1) messages.push('💎 Hoàn thành nhiệm vụ 4 lựa chọn hoàn hảo!');
    if((appState.today.goodQuizCount || 0) === 3) messages.push('💎 Hoàn thành nhiệm vụ 4 lựa chọn ≥80%!');
  }
  if(source === 'match' && (appState.today.matchSuccesses || 0) === 3) messages.push('💎 Hoàn thành nhiệm vụ ghép cặp!');
  if(messages.length){
    openBoarModal('assets/boar_study_victory.png', 'Chúa tể heo rừng\n山豬大王', '眼睛發亮！拿到鑽石了！\n' + messages.join('\n'));
  }
}

function openBoarModal(img, title, text, btnText='好 / OK'){
  el.boarModalImg.src = img;
  el.boarModalTitle.textContent = title || 'Chúa tể heo rừng\n山豬大王';
  el.boarModalText.textContent = text;
  document.getElementById('closeBoarBtn').textContent = btnText;
  el.boarModal.classList.remove('hidden');
}
function closeBoarModal(){ el.boarModal.classList.add('hidden'); }

function bindEvents(){
  el.unitSelect.onchange = () => { appState.currentUnit = Number(el.unitSelect.value); renderMenu(); };

  $$('.dock-btn').forEach(btn => btn.onclick = () => {
    const dock = btn.dataset.dock;
    if(dock === 'review'){
      startReviewQuiz();
      return;
    }
    const map = {home:'homeScreen', achievement:'achievementScreen', help:'helpScreen'};
    if(dock === 'help') renderHelp();
    showScreen(map[dock]);
  });

  $$('[data-action="home"]').forEach(b => b.onclick = () => showScreen('homeScreen'));
  $$('[data-action="back"]').forEach(b => b.onclick = goBack);
  $$('[data-action="menu"]').forEach(b => b.onclick = () => { stopQuiz(); stopMatch(); showScreen('homeScreen'); });
  $$('[data-action="settings"]').forEach(b => b.onclick = openSettings);
  $('#closeSettingsBtn').onclick = $('#settingsBackdrop').onclick = closeSettings;
  $('#goHomeBtn').onclick = () => { closeSettings(); showScreen('homeScreen'); };
  el.unitSelect.value = appState.currentUnit;
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

  let dragging = false;
  el.flashSingleCard.addEventListener('pointerdown', (e)=>{ dragging=true; appState.flash.dragStartX = e.clientX; appState.flash.currentTranslate = 0; el.flashSingleCard.setPointerCapture(e.pointerId); });
  el.flashSingleCard.addEventListener('pointermove', (e)=>{
    if(!dragging || appState.flash.singleDone) return;
    appState.flash.currentTranslate = e.clientX - appState.flash.dragStartX;
    renderFlashSingle();
  });
  el.flashSingleCard.addEventListener('pointerup', ()=> {
    if(!dragging) return; dragging=false;
    const dx = appState.flash.currentTranslate;
    if(Math.abs(dx) > 90){
      vibrate(20);
      stepFlash(dx > 0);
    } else if(Math.abs(dx) < 10){
      toggleSingleFlip();
    } else {
      appState.flash.currentTranslate = 0; renderFlashSingle();
    }
  });
  $('#swipeLeftBtn').onclick = () => { vibrate(20); stepFlash(false); };
  $('#swipeRightBtn').onclick = () => { vibrate(20); stepFlash(true); };
  $('#flashReplayBtn').onclick = resetFlashSingle;

  // Flash info modal
  $('#flashInfoBtn').onclick = () => document.getElementById('flashInfoModal').classList.remove('hidden');
  $('#closeFlashInfoBtn').onclick = $('#flashInfoBackdrop').onclick = () => document.getElementById('flashInfoModal').classList.add('hidden');

  // Flash keyboard navigation
  document.addEventListener('keydown', (e)=>{
    if(appState.currentScreen !== 'flashScreen' || appState.flash.view !== 'single') return;
    if(appState.flash.singleDone) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); vibrate(20); stepFlash(false); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); vibrate(20); stepFlash(true); }
    if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); toggleSingleFlip(); }
  });

  el.quizOptions.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-quiz]');
    if(btn){
      const allWords = appState.quiz.isReview ? appState.units.flatMap(u=>u.words) : currentWords();
      const chosen = allWords.find(w=>w.id===btn.dataset.quiz);
      if(chosen) handleQuizAnswer(chosen.id);
    }
  });
  $('#quizRestartBtn').onclick = () => {
    if(appState.quiz.isReview) startReviewQuiz();
    else startQuiz(false, appState.quiz.difficulty);
  };
  $('#quizWrongBtn').onclick = openWrongModal;
  $('#quizMenuBtn').onclick = () => showScreen('homeScreen');
  $('#closeWrongBtn').onclick = $('#wrongBackdrop').onclick = closeWrongModal;
  $('#retryWrongBtn').onclick = () => { closeWrongModal(); startQuiz(true, appState.quiz.difficulty); };

  el.matchBoard.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-match]');
    if(btn) handleMatch(btn.dataset.match);
  });
  $('#matchRestartBtn').onclick = () => startMatch();
  $('#matchMenuBtn').onclick = () => showScreen('homeScreen');

  $('#closeQuizDifficultyBtn').onclick = $('#quizDifficultyBackdrop').onclick = closeQuizDifficulty;
  $$("[data-quiz-difficulty]").forEach(btn => btn.onclick = () => {
    closeQuizDifficulty();
    startQuiz(false, btn.dataset.quizDifficulty);
  });

  $('#closeBoarBtn').onclick = $('#boarBackdrop').onclick = closeBoarModal;

  // Achievement editable title
  const achieveTitleEl = document.getElementById('achieveTitle');
  if(achieveTitleEl){
    achieveTitleEl.oninput = (e) => { appState.today.sessionTitle = e.target.value; saveState(); };
  }

  document.addEventListener('visibilitychange', ()=>{ appState.study.lastTick = Date.now(); });
}

loadState();
renderHome();
renderHelp();
bindEvents();
showScreen('homeScreen', false);
setInterval(updateStudyTime, 1000);
