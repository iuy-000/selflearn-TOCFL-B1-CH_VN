
const data = window.B1_DATA;

const state = {
  currentDay: 1,
  currentTab: 'list',
  showPinyin: true,
  listFilter: 'all',
  flashMode: 'zh-vi',
  flashCount: 12,
  flashFlipped: {},
  quizMode: 'zh-vi',
  quizIndex: 0,
  quizOrder: [],
  selectedAnswer: null,
  wrongWords: loadWrongWords(),
  pairSize: 6,
  pairDeck: [],
  pairSelected: [],
  pairMatched: 0,
  pairTimeLeft: 60,
  pairTimerId: null,
  pairLocked: false,
};

const els = {
  totalWords: document.getElementById('totalWords'),
  dayGrid: document.getElementById('dayGrid'),
  daySearch: document.getElementById('daySearch'),
  dayPickerPanel: document.getElementById('dayPickerPanel'),
  studyPanel: document.getElementById('studyPanel'),
  dayTitle: document.getElementById('dayTitle'),
  dayMeta: document.getElementById('dayMeta'),
  backBtn: document.getElementById('backBtn'),
  pinyinToggle: document.getElementById('pinyinToggle'),
  wordTableBody: document.getElementById('wordTableBody'),
  flashGrid: document.getElementById('flashGrid'),
  quizDirection: document.getElementById('quizDirection'),
  quizQuestion: document.getElementById('quizQuestion'),
  quizQuestionPinyin: document.getElementById('quizQuestionPinyin'),
  quizOptions: document.getElementById('quizOptions'),
  quizFeedback: document.getElementById('quizFeedback'),
  nextQuestion: document.getElementById('nextQuestion'),
  progressBar: document.getElementById('progressBar'),
  quizStatus: document.getElementById('quizStatus'),
  restartQuiz: document.getElementById('restartQuiz'),
  pairBoard: document.getElementById('pairBoard'),
  pairTimer: document.getElementById('pairTimer'),
  pairMatched: document.getElementById('pairMatched'),
  pairHint: document.getElementById('pairHint'),
  restartPair: document.getElementById('restartPair'),
};

function loadWrongWords(){
  try {
    return JSON.parse(localStorage.getItem('b1_wrong_words') || '{}');
  } catch {
    return {};
  }
}
function saveWrongWords(){
  localStorage.setItem('b1_wrong_words', JSON.stringify(state.wrongWords));
}
function totalWords(){
  return data.days.reduce((sum, d) => sum + d.count, 0);
}
function getDayData(day = state.currentDay){
  return data.days.find(d => d.day === day);
}
function wordKey(word){
  return `${word.zh}|${word.vi}`;
}
function getWrongSet(day){
  return new Set((state.wrongWords[day] || []).map(wordKey));
}
function addWrongWord(day, word){
  if(!state.wrongWords[day]) state.wrongWords[day] = [];
  const key = wordKey(word);
  const exists = state.wrongWords[day].some(x => wordKey(x) === key);
  if(!exists){
    state.wrongWords[day].push(word);
    saveWrongWords();
  }
}
function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function renderDayCards(keyword = ''){
  const query = keyword.trim().toLowerCase();
  const filtered = data.days.filter(day => {
    if(!query) return true;
    const previewText = day.words.slice(0,5).map(w => `${w.zh} ${w.vi} ${w.pinyin}`).join(' ').toLowerCase();
    return String(day.day).includes(query) || previewText.includes(query);
  });

  els.dayGrid.innerHTML = filtered.map(day => {
    const preview = day.words.slice(0, 3).map(w => `${w.zh} / ${w.vi}`).join(' ・ ');
    const wrongCount = (state.wrongWords[day.day] || []).length;
    return `
      <button class="day-card" data-day="${day.day}">
        <strong>第 ${day.day} 天 / Ngày ${day.day}</strong>
        <span>${day.count} 個單字 / ${day.count} từ</span>
        <span>${wrongCount} 個錯題 / ${wrongCount} từ sai</span>
        <div class="preview">${preview}</div>
      </button>
    `;
  }).join('');

  document.querySelectorAll('.day-card').forEach(btn => {
    btn.addEventListener('click', () => openDay(Number(btn.dataset.day)));
  });
}

function openDay(day){
  state.currentDay = day;
  state.listFilter = 'all';
  state.flashFlipped = {};
  state.quizIndex = 0;
  clearPairTimer();
  els.dayPickerPanel.classList.add('hidden');
  els.studyPanel.classList.remove('hidden');
  setTab('list');
  renderStudy();
}

function goBack(){
  clearPairTimer();
  els.studyPanel.classList.add('hidden');
  els.dayPickerPanel.classList.remove('hidden');
  renderDayCards(els.daySearch.value);
}

function renderStudy(){
  const dayData = getDayData();
  els.dayTitle.textContent = `第 ${dayData.day} 天 / Ngày ${dayData.day}`;
  const wrongCount = (state.wrongWords[dayData.day] || []).length;
  els.dayMeta.textContent = `${dayData.count} 個單字 / ${dayData.count} từ vựng ・ ${wrongCount} 個錯題 / ${wrongCount} từ sai`;
  renderWordTable();
  renderFlashGrid();
  setupQuiz(true);
  setupPairGame(true);
}

function filteredWords(){
  const dayData = getDayData();
  if(state.listFilter === 'review'){
    const wrong = getWrongSet(dayData.day);
    return dayData.words.filter(w => wrong.has(wordKey(w)));
  }
  return dayData.words;
}
function renderWordTable(){
  const words = filteredWords();
  if(words.length === 0){
    els.wordTableBody.innerHTML = `<tr><td colspan="4">目前沒有錯題。Hiện chưa có từ sai.</td></tr>`;
    return;
  }
  els.wordTableBody.innerHTML = words.map((w, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${w.zh}</td>
      <td class="pinyin">${state.showPinyin ? (w.pinyin || '—') : '—'}</td>
      <td>${w.vi}</td>
    </tr>
  `).join('');
}

function getFlashWords(){
  const words = [...getDayData().words];
  return words.slice(0, Math.min(state.flashCount, words.length));
}
function renderFlashGrid(){
  const words = getFlashWords();
  els.flashGrid.innerHTML = words.map((word, index) => {
    const flipped = !!state.flashFlipped[index];
    const frontMain = state.flashMode === 'zh-vi' ? word.zh : word.vi;
    const backMain = state.flashMode === 'zh-vi' ? word.vi : word.zh;
    const backSub = state.showPinyin ? (word.pinyin || '') : '';
    return `
      <button class="flash-tile ${flipped ? 'flipped' : ''}" data-flash-index="${index}">
        <div>
          <div class="flash-main">${flipped ? backMain : frontMain}</div>
          ${flipped ? `<div class="flash-sub">${state.flashMode === 'zh-vi' ? word.zh : word.vi}${backSub ? `<br><span class="pinyin">${backSub}</span>` : ''}</div>` : `${state.flashMode === 'zh-vi' && state.showPinyin ? `<div class="flash-sub pinyin">${word.pinyin || ''}</div>` : ''}`}
        </div>
      </button>
    `;
  }).join('');

  document.querySelectorAll('[data-flash-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.flashIndex);
      state.flashFlipped[index] = !state.flashFlipped[index];
      renderFlashGrid();
    });
  });
}

function sampleOptions(correctWord, words, mode){
  const pool = words.filter(w => mode === 'zh-vi' ? w.vi !== correctWord.vi : w.zh !== correctWord.zh);
  shuffle(pool);
  const options = [...pool.slice(0, 3), correctWord];
  return shuffle(options);
}
function setupQuiz(reset = false){
  const words = getDayData().words;
  if(reset || !state.quizOrder.length){
    state.quizOrder = [...Array(words.length).keys()];
    shuffle(state.quizOrder);
    state.quizIndex = 0;
  }
  state.selectedAnswer = null;
  renderQuiz();
}
function renderQuiz(){
  const words = getDayData().words;
  if(state.quizIndex >= state.quizOrder.length){
    const wrongCount = (state.wrongWords[state.currentDay] || []).length;
    els.quizDirection.textContent = '完成 / Hoàn thành';
    els.quizQuestion.textContent = '今天這一組做完了！';
    els.quizQuestionPinyin.textContent = `你可以切到「只看錯題」再複習。現在有 ${wrongCount} 個錯題。`;
    els.quizOptions.innerHTML = '';
    els.quizFeedback.textContent = '';
    els.nextQuestion.disabled = true;
    els.progressBar.style.width = '100%';
    els.quizStatus.textContent = `${state.quizOrder.length} / ${state.quizOrder.length}`;
    return;
  }
  const current = words[state.quizOrder[state.quizIndex]];
  const options = sampleOptions(current, words, state.quizMode);
  els.quizDirection.textContent = state.quizMode === 'zh-vi'
    ? '看中文，選越南文 / Nhìn tiếng Hoa, chọn tiếng Việt'
    : '看越南文，選中文 / Nhìn tiếng Việt, chọn tiếng Hoa';
  els.quizQuestion.textContent = state.quizMode === 'zh-vi' ? current.zh : current.vi;
  els.quizQuestionPinyin.textContent = state.quizMode === 'zh-vi' && state.showPinyin ? (current.pinyin || '') : '';
  els.quizFeedback.textContent = '';
  els.quizFeedback.className = 'feedback';
  els.nextQuestion.disabled = true;
  els.quizOptions.innerHTML = options.map((option, idx) => `
    <button class="option-btn" data-correct="${wordKey(option) === wordKey(current)}" data-index="${idx}">
      ${state.quizMode === 'zh-vi' ? option.vi : option.zh}
    </button>
  `).join('');
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => answerQuestion(btn, current));
  });
  els.progressBar.style.width = `${(state.quizIndex / state.quizOrder.length) * 100}%`;
  els.quizStatus.textContent = `${state.quizIndex + 1} / ${state.quizOrder.length}`;
}
function answerQuestion(btn, current){
  if(state.selectedAnswer !== null) return;
  state.selectedAnswer = btn.dataset.index;
  const isCorrect = btn.dataset.correct === 'true';
  document.querySelectorAll('.option-btn').forEach(option => {
    option.disabled = true;
    if(option.dataset.correct === 'true') option.classList.add('correct');
  });
  if(isCorrect){
    btn.classList.add('correct');
    els.quizFeedback.textContent = '答對了！ / Đúng rồi!';
    els.quizFeedback.classList.add('ok');
  } else {
    btn.classList.add('wrong');
    els.quizFeedback.textContent = '答錯了。正確答案已標出。 / Sai rồi. Đáp án đúng đã được đánh dấu.';
    els.quizFeedback.classList.add('bad');
    addWrongWord(state.currentDay, current);
    renderDayCards(els.daySearch.value);
  }
  els.nextQuestion.disabled = false;
  els.progressBar.style.width = `${((state.quizIndex + 1) / state.quizOrder.length) * 100}%`;
}

function buildPriorityWords(size){
  const dayWords = [...getDayData().words];
  const wrongKeys = getWrongSet(state.currentDay);
  const wrongWords = dayWords.filter(w => wrongKeys.has(wordKey(w)));
  const freshWords = dayWords.filter(w => !wrongKeys.has(wordKey(w)));
  shuffle(wrongWords);
  shuffle(freshWords);
  const picked = [...wrongWords.slice(0, size)];
  for(const word of freshWords){
    if(picked.length >= size) break;
    picked.push(word);
  }
  return shuffle(picked);
}
function setupPairGame(reset = false){
  clearPairTimer();
  state.pairSelected = [];
  state.pairMatched = 0;
  state.pairLocked = false;
  state.pairTimeLeft = 60;
  if(reset || !state.pairDeck.length){
    const words = buildPriorityWords(Math.min(state.pairSize, getDayData().words.length));
    state.pairDeck = shuffle([
      ...words.map((word, i) => ({ id: `zh-${i}`, pairId: i, type: 'zh', label: word.zh, word })),
      ...words.map((word, i) => ({ id: `vi-${i}`, pairId: i, type: 'vi', label: word.vi, word }))
    ]).map(card => ({ ...card, matched: false, wrong: false }));
  }
  renderPairBoard();
  startPairTimer();
}
function renderPairBoard(){
  const totalPairs = state.pairDeck.filter(c => c.type === 'zh').length;
  els.pairTimer.textContent = state.pairTimeLeft;
  els.pairMatched.textContent = `${state.pairMatched} / ${totalPairs}`;
  els.pairBoard.innerHTML = state.pairDeck.map(card => {
    const selected = state.pairSelected.includes(card.id);
    const classes = ['pair-card', card.type];
    if(selected) classes.push('selected');
    if(card.matched) classes.push('matched');
    if(card.wrong) classes.push('wrong');
    if(state.pairTimeLeft <= 0 || card.matched) classes.push('disabled');
    return `<button class="${classes.join(' ')}" data-pair-id="${card.id}" ${state.pairTimeLeft <= 0 || card.matched ? 'disabled' : ''}>${card.label}</button>`;
  }).join('');

  document.querySelectorAll('[data-pair-id]').forEach(btn => {
    btn.addEventListener('click', () => handlePairClick(btn.dataset.pairId));
  });
}
function handlePairClick(cardId){
  if(state.pairLocked || state.pairTimeLeft <= 0) return;
  const card = state.pairDeck.find(c => c.id === cardId);
  if(!card || card.matched) return;
  if(state.pairSelected.includes(cardId)) return;
  if(state.pairSelected.length === 1){
    const first = state.pairDeck.find(c => c.id === state.pairSelected[0]);
    if(first.type === card.type) return;
  }
  state.pairSelected.push(cardId);
  if(state.pairSelected.length < 2){
    els.pairHint.textContent = card.type === 'zh'
      ? '再點一個越南文。Bây giờ bấm một thẻ tiếng Việt.'
      : '再點一個中文。Bây giờ bấm một thẻ tiếng Hoa.';
    renderPairBoard();
    return;
  }
  const [aId, bId] = state.pairSelected;
  const a = state.pairDeck.find(c => c.id === aId);
  const b = state.pairDeck.find(c => c.id === bId);
  state.pairLocked = true;
  if(a.pairId === b.pairId){
    a.matched = true;
    b.matched = true;
    state.pairMatched += 1;
    state.pairSelected = [];
    state.pairLocked = false;
    els.pairHint.textContent = '配對成功！ / Ghép đúng rồi!';
    renderPairBoard();
    if(state.pairMatched === state.pairDeck.filter(c => c.type === 'zh').length){
      clearPairTimer();
      els.pairHint.textContent = '全部配對完成！ / Đã nối xong tất cả!';
    }
  } else {
    a.wrong = true;
    b.wrong = true;
    addWrongWord(state.currentDay, a.word);
    addWrongWord(state.currentDay, b.word);
    renderDayCards(els.daySearch.value);
    els.pairHint.textContent = '配錯了，這兩張會重置。 / Sai rồi, hai thẻ này sẽ được đặt lại.';
    renderPairBoard();
    window.setTimeout(() => {
      a.wrong = false;
      b.wrong = false;
      state.pairSelected = [];
      state.pairLocked = false;
      els.pairHint.textContent = '先點一個中文，再點對應的越南文。Bấm một thẻ tiếng Hoa rồi bấm thẻ tiếng Việt tương ứng.';
      renderPairBoard();
    }, 650);
  }
}
function startPairTimer(){
  clearPairTimer();
  els.pairHint.textContent = '先點一個中文，再點對應的越南文。Bấm một thẻ tiếng Hoa rồi bấm thẻ tiếng Việt tương ứng.';
  els.pairTimer.textContent = state.pairTimeLeft;
  state.pairTimerId = window.setInterval(() => {
    state.pairTimeLeft -= 1;
    els.pairTimer.textContent = state.pairTimeLeft;
    if(state.pairTimeLeft <= 0){
      clearPairTimer();
      els.pairTimer.textContent = 0;
      els.pairHint.textContent = `時間到。你完成了 ${state.pairMatched} 組。 / Hết giờ. Bạn đã nối được ${state.pairMatched} cặp.`;
      renderPairBoard();
    }
  }, 1000);
}
function clearPairTimer(){
  if(state.pairTimerId){
    window.clearInterval(state.pairTimerId);
    state.pairTimerId = null;
  }
}

function setTab(tab){
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
  if(tab === 'pair'){
    setupPairGame(false);
  } else {
    clearPairTimer();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('totalDays').textContent = data.days.length;
  els.totalWords.textContent = totalWords();
  renderDayCards();

  els.daySearch.addEventListener('input', e => renderDayCards(e.target.value));
  els.backBtn.addEventListener('click', goBack);

  els.pinyinToggle.addEventListener('change', e => {
    state.showPinyin = e.target.checked;
    renderWordTable();
    renderFlashGrid();
    renderQuiz();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-list-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-list-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.listFilter = btn.dataset.listFilter;
      renderWordTable();
    });
  });

  document.querySelectorAll('[data-flash-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-flash-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.flashMode = btn.dataset.flashMode;
      state.flashFlipped = {};
      renderFlashGrid();
    });
  });

  document.querySelectorAll('[data-flash-count]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-flash-count]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.flashCount = Number(btn.dataset.flashCount);
      state.flashFlipped = {};
      renderFlashGrid();
    });
  });

  document.querySelectorAll('[data-quiz-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-quiz-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.quizMode = btn.dataset.quizMode;
      setupQuiz(true);
    });
  });

  els.nextQuestion.addEventListener('click', () => {
    state.quizIndex += 1;
    state.selectedAnswer = null;
    renderQuiz();
  });

  els.restartQuiz.addEventListener('click', () => setupQuiz(true));

  document.querySelectorAll('[data-pair-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-pair-size]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.pairSize = Number(btn.dataset.pairSize);
      setupPairGame(true);
    });
  });
  els.restartPair.addEventListener('click', () => setupPairGame(true));
});
