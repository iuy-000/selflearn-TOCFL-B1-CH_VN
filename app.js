const state = {
  units: window.APP_DATA.units,
  quotes: window.APP_DATA.quotes || [],
  currentUnit: 1,
  currentScreen: 'homeScreen',
  screenStack: ['homeScreen'],
  settings: loadSettings(),
  flash: { view:'grid', currentGroup:[], singleQueue:[], singleIndex:0, singleFlipped:false, singleDone:false, dragX:0, dragActive:false },
  quiz: { duration:90, remaining:90, timer:null, queue:[], index:0, current:null, score:0, wrongIds:[], wrongOnly:false, active:false },
  match: { duration:40, remaining:40, timer:null, board:[], selected:null, active:false, pairsDone:0, roundHistory:[], currentRoundIds:[] },
  mistakeMap: loadJSON('mistakeMap', {})
};
const el = {}; document.querySelectorAll('[id]').forEach(n=>el[n.id]=n);
const guideZh = `
<h2>📘 使用說明</h2>
<h3>🎯 核心學習概念</h3>
<p>👉 我們先讓大腦「熟悉」漢字的形狀<br>👉 用「視覺 + 聽覺」一起建立記憶<br>👉 讓學習變成可以每天持續的習慣</p>
<h3>🧠 為什麼這樣學？</h3>
<p>👉 先輸入知識（看、聽、認）<br>👉 再反覆使用（練習、測驗、反應）</p>
<p>當這兩件事情不斷重複：<br>👉 就會慢慢變成「肌肉記憶」</p>
<ul><li>不用想就認得字</li><li>不用翻譯就理解意思</li><li>自然地說出中文</li></ul>
<h3>🚀 最終目標</h3>
<p>希望透過這個練習，你可以在更短的時間內：<br>👉 更快認字<br>👉 更快理解<br>👉 更高效通過 TOCFL 考試</p>
<h3>📚 關於 35 個單元</h3>
<p>本系統分為 35 個單元。每一個單元都有一組單字，一次專注一個單元。</p>
<p>💡 建議：每 2～5 天練一個單元，或依自己的速度調整。</p>
<h3>🔁 練習方式</h3>
<p><strong>🔊 單字表</strong><br>連結聲音與文字</p>
<p><strong>🔁 翻卡</strong><br>反覆練習，建立記憶</p>
<p><strong>🔴 四選一</strong><br>檢查自己是否記得</p>
<p><strong>🟣 配對</strong><br>訓練反應速度</p>
<p>將中文與越南文正確配對，有時間限制：訓練臨場感。配對成功會消失，全部在時間內配對完成即成功。</p>
<h3>💔 心碎（錯題系統）</h3>
<p>當你答錯時，會出現 💔。💔 越多，代表越不熟；答對後會慢慢減少。你也可以重新歸零，再測試自己。</p>
<p>那些中文很好的人都是經過反覆練習的人，背後都有一個穩定的知識輸入庫。而這個 App，就是幫你建立這個輸入庫的工具。</p>
<p>🌱 不用一次學很多，每天一點點就很好了。只要持續練習，你一定會越來越自然 😊</p>`;
const guideVi = `
<h2>📘 Hướng dẫn sử dụng</h2>
<h3>🎯 Ý tưởng học tập cốt lõi</h3>
<p>👉 Giúp bạn làm quen với hình dạng chữ Hán<br>👉 Kết hợp nhìn + nghe để ghi nhớ<br>👉 Biến việc học thành thói quen mỗi ngày</p>
<h3>🧠 Vì sao học theo cách này?</h3>
<p>👉 Tiếp nhận kiến thức (xem, nghe, nhận diện)<br>👉 Sau đó lặp lại và sử dụng (luyện tập, kiểm tra, phản xạ)</p>
<p>Khi hai việc này lặp lại nhiều lần:<br>👉 Sẽ dần tạo thành trí nhớ phản xạ</p>
<ul><li>Nhìn là nhận ra</li><li>Hiểu mà không cần dịch</li><li>Nói tiếng Trung tự nhiên hơn</li></ul>
<h3>🚀 Mục tiêu cuối cùng</h3>
<p>👉 Nhận chữ nhanh hơn<br>👉 Hiểu nhanh hơn<br>👉 Vượt qua kỳ thi TOCFL hiệu quả hơn</p>
<h3>📚 Về 35 bài học</h3>
<p>Hệ thống có 35 bài. Mỗi lần tập trung vào một bài.</p>
<p>💡 Gợi ý: Học 1 bài trong 2–5 ngày, hoặc điều chỉnh theo tốc độ của bạn.</p>
<h3>🔁 Cách luyện tập</h3>
<p><strong>🔊 Bảng từ</strong><br>Kết nối âm thanh và chữ viết</p>
<p><strong>🔁 Thẻ lật</strong><br>Lặp lại để ghi nhớ</p>
<p><strong>🔴 4 lựa 1</strong><br>Kiểm tra xem bạn đã nhớ chưa</p>
<p><strong>🟣 Ghép cặp</strong><br>Luyện phản xạ</p>
<p>Ghép đúng tiếng Trung với tiếng Việt. Có giới hạn thời gian để tăng cảm giác phản xạ thực tế. Ghép đúng sẽ biến mất; hoàn thành tất cả trong thời gian quy định là thành công.</p>
<h3>💔 Hệ thống lỗi sai</h3>
<p>Khi bạn làm sai sẽ xuất hiện 💔. 💔 càng nhiều nghĩa là từ đó càng chưa quen; làm đúng sẽ giảm dần. Bạn cũng có thể đặt lại để tự kiểm tra lại từ đầu.</p>
<p>Những người giỏi tiếng Trung đều đã luyện tập rất nhiều và có một kho kiến thức ổn định phía sau. App này chính là công cụ giúp bạn xây dựng kho đó.</p>
<p>🌱 Không cần học quá nhiều một lúc. Mỗi ngày một chút là đủ. Chỉ cần tiếp tục luyện, bạn chắc chắn sẽ tiến bộ 😊</p>`;

function loadJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
function saveJSON(key,val){localStorage.setItem(key, JSON.stringify(val))}
function loadSettings(){ return Object.assign({showPinyinFront:false, reverseDirection:false, zhAudio:true, viAudio:false, haptics:true}, loadJSON('settings', {})); }
function saveSettings(){ saveJSON('settings', state.settings); }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function getUnit(n){ return state.units.find(u=>u.unit===n); }
function words(){ return getUnit(state.currentUnit).words; }
function mistakeCount(word){ return state.mistakeMap[word.id] || 0; }
function heartText(word){ const c = mistakeCount(word); return c ? '💔'.repeat(Math.min(6,c)) : ''; }
function markMistake(word){ state.mistakeMap[word.id] = (state.mistakeMap[word.id] || 0) + 1; saveJSON('mistakeMap', state.mistakeMap); }
function markSuccess(word){ if(state.mistakeMap[word.id]){ state.mistakeMap[word.id]--; if(state.mistakeMap[word.id] <= 0) delete state.mistakeMap[word.id]; saveJSON('mistakeMap', state.mistakeMap); } }
function frontOf(word){ return state.settings.reverseDirection ? word.vi : word.zh; }
function backOf(word){ return state.settings.reverseDirection ? word.zh : word.vi; }
function promptPinyin(word){ return !state.settings.reverseDirection ? word.pinyin || '' : ''; }
function directionLabel(){ return state.settings.reverseDirection ? 'Việt → Trung' : 'Trung → Việt'; }
function haptic(ms){ if(state.settings.haptics && navigator.vibrate) navigator.vibrate(ms); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); if(state.currentScreen !== id){ state.screenStack.push(id); if(state.screenStack.length>20) state.screenStack.shift(); } state.currentScreen = id; closeSettings(); }
function goBack(){ closeSettings(); if(state.currentScreen==='homeScreen') return; if(['quizScreen','matchScreen'].includes(state.currentScreen)){ stopQuiz(); stopMatch(); }
  if(state.screenStack.length>1) state.screenStack.pop();
  const prev = state.screenStack[state.screenStack.length-1] || 'homeScreen';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(prev).classList.add('active'); state.currentScreen = prev;
}
function speakUtter(text, lang){ return new Promise(resolve => { if(!('speechSynthesis' in window) || !text) return resolve(); const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate = 0.92; const voices = speechSynthesis.getVoices(); const preferred = voices.find(v => lang.startsWith('zh') ? /zh|taiwan|mandarin/i.test((v.lang||'')+' '+(v.name||'')) : /vi/i.test((v.lang||'')+' '+(v.name||''))); if(preferred) u.voice = preferred; u.onend = () => resolve(); u.onerror = () => resolve(); speechSynthesis.speak(u); }); }
async function speakBySettings(word, mode='context'){
  if(!word) return; speechSynthesis.cancel();
  if(mode==='wordlist'){
    if(state.settings.viAudio && state.settings.zhAudio){ await speakUtter(word.vi, 'vi-VN'); await new Promise(r=>setTimeout(r,220)); await speakUtter(word.zh, 'zh-TW'); return; }
    if(state.settings.viAudio){ await speakUtter(word.vi, 'vi-VN'); return; }
    if(state.settings.zhAudio){ await speakUtter(word.zh, 'zh-TW'); return; }
    return;
  }
  const frontLangZh = !state.settings.reverseDirection;
  if(frontLangZh && state.settings.zhAudio) await speakUtter(word.zh, 'zh-TW');
  if(!frontLangZh && state.settings.viAudio) await speakUtter(word.vi, 'vi-VN');
}
async function speakVisibleSide(word, flipped){
  speechSynthesis.cancel();
  const showingZh = flipped ? true : !state.settings.reverseDirection;
  const showingVi = flipped ? true : state.settings.reverseDirection;
  if(!flipped){
    if(showingZh && state.settings.zhAudio) await speakUtter(word.zh,'zh-TW');
    else if(showingVi && state.settings.viAudio) await speakUtter(word.vi,'vi-VN');
  } else {
    if(state.settings.zhAudio) await speakUtter(word.zh,'zh-TW');
    if(state.settings.viAudio) await speakUtter(word.vi,'vi-VN');
  }
}
function populateHome(){ const q = state.quotes[Math.floor(Math.random()*state.quotes.length)] || {zh:'每天一點點，也很好。',vi:'Mỗi ngày một chút cũng rất tốt.'}; el.quoteZh.textContent=q.zh; el.quoteVi.textContent=q.vi; el.unitSelect.innerHTML=state.units.map(u=>`<option value="${u.unit}">單元 ${u.unit} / Bài ${u.unit}</option>`).join(''); el.unitSelect.value=String(state.currentUnit); }
function renderGuide(){ el.guideArticle.innerHTML = guideZh + '<hr style="border:none;border-top:1px solid #ecdccc;margin:20px 0">' + guideVi; }
function updateTitles(){ el.menuUnitTitle.textContent = `單元 ${state.currentUnit} / Bài ${state.currentUnit}`; el.wordlistTitle.textContent = `🔊 單字表 / Bảng từ`; }
function renderWordlist(){ el.wordlistContainer.innerHTML = words().map(w=>`<button class="word-item" data-id="${w.id}"><div class="word-top"><div class="word-head"><span class="word-zh">${escapeHtml(w.zh)}</span><span class="sound-icon">🔊</span></div><div class="hearts">${heartText(w)}</div></div><div class="word-pinyin">${escapeHtml(w.pinyin||'')}</div><div class="word-vi">${escapeHtml(w.vi)}</div></button>`).join(''); }
function openSettings(){ el.settingsSheet.classList.remove('hidden'); el.pinyinToggle.checked = state.settings.showPinyinFront; el.directionToggle.checked = state.settings.reverseDirection; el.zhAudioToggle.checked = state.settings.zhAudio; el.viAudioToggle.checked = state.settings.viAudio; el.hapticToggle.checked = state.settings.haptics; el.directionHelp.textContent = 'Hiện tại: ' + directionLabel(); }
function closeSettings(){ el.settingsSheet.classList.add('hidden'); }
function allWordsShuffled(){ const list=words(); const priority=list.filter(w=>mistakeCount(w)>0).sort((a,b)=>mistakeCount(b)-mistakeCount(a)); const rest=shuffle(list.filter(w=>!priority.some(p=>p.id===w.id))); return [...priority,...rest]; }
function newFlashGroup(exclude=[]){ let pool = allWordsShuffled().filter(w=>!exclude.includes(w.id)); if(pool.length<16) pool = [...pool, ...shuffle(words().filter(w=>!pool.some(p=>p.id===w.id)))]; return shuffle(pool).slice(0,16); }
function renderFlashGrid(){ if(!state.flash.currentGroup.length) state.flash.currentGroup = newFlashGroup(); el.flashGrid.innerHTML = state.flash.currentGroup.map(w=>`<button class="flash-card" data-id="${w.id}"><div class="flash-card-inner"><div class="flash-face"><div><div class="flash-main">${escapeHtml(frontOf(w))}</div>${(!state.settings.reverseDirection && state.settings.showPinyinFront)?`<div class="flash-sub">${escapeHtml(w.pinyin||'')}</div>`:''}</div></div><div class="flash-face flash-back"><div class="flash-main">${escapeHtml(w.zh)}</div><div class="flash-sub">${escapeHtml(w.pinyin||'')}</div><div class="flash-sub strong">${escapeHtml(w.vi)}</div></div></div></button>`).join(''); }
function setupFlashSingle(){ state.flash.singleQueue = shuffle(words()); state.flash.singleIndex = 0; state.flash.singleFlipped = false; state.flash.singleDone = false; state.flash.dragX = 0; renderFlashSingle(); el.flashReplayBtn.classList.add('hidden'); }
function currentSingle(){ return state.flash.singleQueue[state.flash.singleIndex]; }
function renderFlashSingle(){ const w = currentSingle(); if(!w){ state.flash.singleDone = true; el.flashSingleProgress.textContent = `${state.flash.singleQueue.length} / ${state.flash.singleQueue.length}`; el.flashSingleCard.innerHTML = '<div class="flash-main">完成了</div><div class="flash-sub">Hoàn thành</div>'; el.flashSingleCard.style.transform = 'translateX(0px) rotate(0deg)'; el.flashReplayBtn.classList.remove('hidden'); return; } el.flashSingleProgress.textContent = `${state.flash.singleIndex+1} / ${state.flash.singleQueue.length}`; const front = `<div class="flash-main">${escapeHtml(frontOf(w))}</div>${(!state.settings.reverseDirection && state.settings.showPinyinFront)?`<div class="flash-sub">${escapeHtml(w.pinyin||'')}</div>`:''}`; const back = `<div class="flash-main">${escapeHtml(w.zh)}</div><div class="flash-sub">${escapeHtml(w.pinyin||'')}</div><div class="flash-sub strong">${escapeHtml(w.vi)}</div>`; el.flashSingleCard.innerHTML = state.flash.singleFlipped ? back : front; const rot = clamp(state.flash.dragX/18,-12,12); el.flashSingleCard.style.transform = `translateX(${state.flash.dragX}px) rotate(${rot}deg)`; if(!state.flash.dragActive) speakVisibleSide(w, state.flash.singleFlipped); }
function switchFlashView(v){ state.flash.view=v; document.querySelectorAll('[data-flash-view]').forEach(b=>b.classList.toggle('active', b.dataset.flashView===v)); el.flashGridWrap.classList.toggle('active', v==='grid'); el.flashSingleWrap.classList.toggle('active', v==='single'); el.gridToolbar.classList.toggle('hidden', v!=='grid'); if(v==='grid'){ state.flash.currentGroup = newFlashGroup(state.flash.currentGroup.map(w=>w.id)); renderFlashGrid(); } else { setupFlashSingle(); } }
function advanceSingle(known){ const w=currentSingle(); if(!w) return; if(known) { markSuccess(w); haptic(20); } else { markMistake(w); haptic([40,30,40]); } renderWordlist(); state.flash.singleIndex += 1; state.flash.singleFlipped=false; state.flash.dragX=0; state.flash.dragActive=false; renderFlashSingle(); }
function startQuiz(wrongOnly=false){ state.quiz = { duration:90, remaining:90, timer:null, queue: buildQuizQueue(wrongOnly), index:0, current:null, score:0, wrongIds:[], wrongOnly, active:false }; el.quizResultSheet.classList.add('hidden'); el.quizWrongSheet.classList.add('hidden'); showScreen('quizScreen'); runCountdown(el.quizCountdown).then(()=>{ state.quiz.active=true; tickQuiz(); state.quiz.timer=setInterval(tickQuiz,1000); renderQuizQuestion(); }); }
function buildQuizQueue(wrongOnly){ const list = wrongOnly ? words().filter(w=>mistakeCount(w)>0) : words(); return shuffle(list.length ? list : words()); }
function tickQuiz(){ const pct=Math.max(0,state.quiz.remaining/state.quiz.duration); el.quizTimerFill.style.width = `${pct*100}%`; el.quizTimerText.textContent = `${Math.floor(state.quiz.remaining/60)}:${String(state.quiz.remaining%60).padStart(2,'0')}`; if(state.quiz.remaining<=0) return finishQuiz(false); state.quiz.remaining--; }
function quizOptionsFor(w){ const others=shuffle(words().filter(x=>x.id!==w.id)).slice(0,3); return shuffle([w,...others]); }
function renderQuizQuestion(){ if(state.quiz.index >= state.quiz.queue.length) return finishQuiz(true); const w = state.quiz.queue[state.quiz.index]; state.quiz.current = w; el.quizProgressText.textContent = `${state.quiz.index+1} / ${state.quiz.queue.length}`; el.quizPrompt.textContent = frontOf(w); el.quizPromptPinyin.textContent = promptPinyin(w); speakBySettings(w,'context'); const opts=quizOptionsFor(w); el.quizOptions.innerHTML = opts.map(o=>`<button class="quiz-option" data-id="${o.id}">${escapeHtml(backOf(o))}</button>`).join(''); el.quizFeedback.innerHTML=''; }
function answerQuiz(id){ if(!state.quiz.active || !state.quiz.current) return; state.quiz.active=false; const w=state.quiz.current; const correct = id===w.id; document.querySelectorAll('.quiz-option').forEach(btn=>{ btn.disabled=true; if(btn.dataset.id===w.id) btn.classList.add('correct'); if(btn.dataset.id===id && !correct) btn.classList.add('wrong'); }); if(correct){ state.quiz.score++; markSuccess(w); haptic(22); el.quizFeedback.innerHTML = `<div>✔ 答對 / Đúng</div><div>${escapeHtml(w.zh)} · ${escapeHtml(w.vi)}</div>`; } else { markMistake(w); state.quiz.wrongIds.push(w.id); haptic([50,35,50]); el.quizFeedback.innerHTML = `<div class="feedback-heart">💔</div><div>❌ 答錯 / Sai</div><div>${escapeHtml(w.zh)} ｜ ${escapeHtml(w.vi)}</div><div>${escapeHtml(w.pinyin||'')}</div>`; } renderWordlist(); setTimeout(()=>{ state.quiz.index++; state.quiz.active=true; renderQuizQuestion(); }, 800); }
function stopQuiz(){ if(state.quiz.timer){ clearInterval(state.quiz.timer); state.quiz.timer=null; } state.quiz.active=false; }
function finishQuiz(successByComplete){ stopQuiz(); const success = successByComplete && state.quiz.index >= state.quiz.queue.length; el.quizResultSheet.classList.remove('hidden'); el.quizResultIcon.textContent = success ? '✓' : '✕'; el.quizResultTitle.textContent = success ? 'Thành công / 成功' : 'Thất bại / 失敗'; el.quizResultText.textContent = `Đúng ${state.quiz.score} / ${state.quiz.queue.length}`; }
function openWrongSheet(){ const ids = [...new Set(state.quiz.wrongIds)]; const list = words().filter(w=>ids.includes(w.id)); el.quizWrongList.innerHTML = list.length ? list.map(w=>`<div class="wrong-item"><div><strong>${escapeHtml(w.zh)}</strong> ${heartText(w)}</div><div>${escapeHtml(w.vi)}</div><div>${escapeHtml(w.pinyin||'')}</div></div>`).join('') : '<div class="wrong-item">沒有錯題 / Không có câu sai</div>'; el.quizWrongSheet.classList.remove('hidden'); }
function buildMatchRound(excludeCurrent=false){ const exclude = new Set(excludeCurrent ? state.match.currentRoundIds : []); const source = words(); const high = source.filter(w=>mistakeCount(w)>0 && !exclude.has(w.id)).sort((a,b)=>mistakeCount(b)-mistakeCount(a)); const lastTwo = new Set(state.match.roundHistory.flat()); const fresh = shuffle(source.filter(w=>!exclude.has(w.id) && !lastTwo.has(w.id) && !high.some(h=>h.id===w.id))); const rest = shuffle(source.filter(w=>!exclude.has(w.id) && !high.some(h=>h.id===w.id) && !fresh.some(f=>f.id===w.id))); let chosen = [...high, ...fresh, ...rest].slice(0,9); if(chosen.length<9) chosen = [...chosen, ...shuffle(source.filter(w=>!chosen.some(c=>c.id===w.id)))].slice(0,9); state.match.currentRoundIds = chosen.map(w=>w.id); state.match.roundHistory.push(state.match.currentRoundIds); state.match.roundHistory = state.match.roundHistory.slice(-2); state.match.board = shuffle(chosen.flatMap(w => [{pairId:w.id, text:w.zh, lang:'zh', word:w, matched:false},{pairId:w.id, text:w.vi, lang:'vi', word:w, matched:false}])); state.match.selected = null; state.match.pairsDone = 0; renderMatchBoard(); }
function renderMatchBoard(){ el.matchBoard.innerHTML = state.match.board.map((c,i)=>`<button class="match-card ${c.lang} ${c.matched?'matched':''}" data-idx="${i}">${c.matched?'':escapeHtml(c.text)}</button>`).join(''); el.matchProgressText.textContent = `${state.match.pairsDone} / 9`; }
function startMatch(excludeCurrent=false){ stopMatch(); state.match.remaining=40; el.matchResultSheet.classList.add('hidden'); buildMatchRound(excludeCurrent); showScreen('matchScreen'); runCountdown(el.matchCountdown).then(()=>{ state.match.active=true; tickMatch(); state.match.timer=setInterval(tickMatch,1000); }); }
function stopMatch(){ if(state.match.timer){ clearInterval(state.match.timer); state.match.timer=null; } state.match.active=false; }
function tickMatch(){ const pct=Math.max(0,state.match.remaining/state.match.duration); el.matchTimerFill.style.width = `${pct*100}%`; el.matchTimerText.textContent = `0:${String(state.match.remaining).padStart(2,'0')}`; el.matchTimerFill.classList.remove('warn','danger','blink'); if(state.match.remaining<=15) el.matchTimerFill.classList.add('warn'); if(state.match.remaining<=5) el.matchTimerFill.classList.add('danger','blink'); if(state.match.remaining<=0) return finishMatch(false); state.match.remaining--; }
function tapMatch(idx){ if(!state.match.active) return; const card = state.match.board[idx]; if(!card || card.matched) return; if(state.match.selected===null){ state.match.selected=idx; renderSelection(); return; } if(state.match.selected===idx){ state.match.selected=null; renderSelection(); return; } const first = state.match.board[state.match.selected]; if(first.pairId===card.pairId && first.lang!==card.lang){ first.matched=true; card.matched=true; state.match.pairsDone++; markSuccess(first.word); haptic(18); state.match.selected=null; renderWordlist(); renderMatchBoard(); if(state.match.pairsDone===9) finishMatch(true); } else { markMistake(first.word); markMistake(card.word); renderWordlist(); haptic([50,35,50]); const btns=document.querySelectorAll('.match-card'); [state.match.selected, idx].forEach(i=>btns[i]?.classList.add('wrong')); state.match.selected=null; setTimeout(renderMatchBoard, 420); } }
function renderSelection(){ document.querySelectorAll('.match-card').forEach((b,i)=>b.classList.toggle('selected', i===state.match.selected)); }
function finishMatch(success){ stopMatch(); el.matchResultSheet.classList.remove('hidden'); el.matchResultIcon.textContent = success ? '✓' : '✕'; el.matchResultTitle.textContent = success ? 'Thành công / 成功' : 'Thất bại / 失敗'; el.matchResultText.textContent = success ? '全部配對完成 / Hoàn thành đủ 9 cặp' : `Đúng ${state.match.pairsDone} / 9`; }
function runCountdown(node){ node.classList.remove('hidden'); return new Promise(resolve=>{ const nums=['3','2','1']; let i=0; node.textContent=nums[0]; const timer=setInterval(()=>{ i++; if(i>=nums.length){ clearInterval(timer); node.classList.add('hidden'); resolve(); } else node.textContent=nums[i]; }, 700); }); }
function restartCurrent(){ if(state.currentScreen==='wordlistScreen') renderWordlist(); if(state.currentScreen==='flashScreen'){ state.flash.view==='grid' ? (state.flash.currentGroup = newFlashGroup(state.flash.currentGroup.map(w=>w.id)), renderFlashGrid()) : setupFlashSingle(); } if(state.currentScreen==='quizScreen') startQuiz(state.quiz.wrongOnly); if(state.currentScreen==='matchScreen') startMatch(true); }
function bindDrag(){ const card = el.flashSingleCard; let sx=0;
  card.addEventListener('pointerdown', e=>{ if(state.flash.singleDone) return; state.flash.dragActive=true; sx=e.clientX; card.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', e=>{ if(!state.flash.dragActive) return; state.flash.dragX = e.clientX - sx; renderFlashSingle(); });
  function endDrag(){ if(!state.flash.dragActive) return; const dx=state.flash.dragX; state.flash.dragActive=false; if(Math.abs(dx)>90){ advanceSingle(dx>0); } else { state.flash.dragX=0; renderFlashSingle(); } }
  card.addEventListener('pointerup', endDrag); card.addEventListener('pointercancel', endDrag);
}
function bind(){
  el.startBtn.addEventListener('click', ()=>{ state.currentUnit=Number(el.unitSelect.value); updateTitles(); showScreen('menuScreen'); });
  el.guideHomeBtn.addEventListener('click', ()=> showScreen('guideScreen'));
  el.guideMenuBtn.addEventListener('click', ()=> showScreen('guideScreen'));
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click', ()=>{ const a=btn.dataset.action; if(a==='back') goBack(); if(a==='backToMenu'){ stopQuiz(); stopMatch(); showScreen('menuScreen'); } if(a==='settings') openSettings(); }));
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click', ()=>{ const mode=btn.dataset.mode; if(mode==='wordlist'){ renderWordlist(); showScreen('wordlistScreen'); } if(mode==='flash'){ switchFlashView('grid'); showScreen('flashScreen'); } if(mode==='quiz') startQuiz(false); if(mode==='match') startMatch(false); }));
  el.settingsBackdrop.addEventListener('click', closeSettings); el.closeSettingsBtn.addEventListener('click', closeSettings);
  el.pinyinToggle.addEventListener('change', e=>{ state.settings.showPinyinFront=e.target.checked; saveSettings(); if(state.currentScreen==='flashScreen'){ state.flash.view==='grid'?renderFlashGrid():renderFlashSingle(); } });
  el.directionToggle.addEventListener('change', e=>{ state.settings.reverseDirection=e.target.checked; saveSettings(); el.directionHelp.textContent='Hiện tại: '+directionLabel(); if(state.currentScreen==='flashScreen'){ state.flash.view==='grid'?renderFlashGrid():renderFlashSingle(); } if(state.currentScreen==='quizScreen' && state.quiz.current) renderQuizQuestion(); });
  el.zhAudioToggle.addEventListener('change', e=>{ state.settings.zhAudio=e.target.checked; saveSettings(); });
  el.viAudioToggle.addEventListener('change', e=>{ state.settings.viAudio=e.target.checked; saveSettings(); });
  el.hapticToggle.addEventListener('change', e=>{ state.settings.haptics=e.target.checked; saveSettings(); });
  el.goHomeBtn.addEventListener('click', ()=>{ stopQuiz(); stopMatch(); populateHome(); state.screenStack=['homeScreen']; showScreen('homeScreen'); });
  el.goBackBtn.addEventListener('click', goBack);
  el.restartBtn.addEventListener('click', ()=>{ closeSettings(); restartCurrent(); });
  el.resetHeartsBtn.addEventListener('click', ()=>{ state.mistakeMap={}; saveJSON('mistakeMap', state.mistakeMap); renderWordlist(); closeSettings(); });
  el.wordlistContainer.addEventListener('click', e=>{ const item=e.target.closest('.word-item'); if(!item) return; const w=words().find(x=>x.id===item.dataset.id); speakBySettings(w,'wordlist'); haptic(10); });
  document.querySelectorAll('[data-flash-view]').forEach(btn=>btn.addEventListener('click', ()=>switchFlashView(btn.dataset.flashView)));
  el.shuffleFlashBtn.addEventListener('click', ()=>{ state.flash.currentGroup = newFlashGroup(state.flash.currentGroup.map(w=>w.id)); renderFlashGrid(); haptic(10); });
  el.flashGrid.addEventListener('click', e=>{ const card=e.target.closest('.flash-card'); if(!card) return; card.classList.toggle('flipped'); const w=state.flash.currentGroup.find(x=>x.id===card.dataset.id); haptic(10); speakVisibleSide(w, card.classList.contains('flipped')); });
  el.flashSingleCard.addEventListener('click', ()=>{ if(state.flash.dragActive || state.flash.singleDone || Math.abs(state.flash.dragX)>5) return; state.flash.singleFlipped=!state.flash.singleFlipped; renderFlashSingle(); haptic(10); });
  el.swipeLeftBtn.addEventListener('click', ()=>advanceSingle(false)); el.swipeRightBtn.addEventListener('click', ()=>advanceSingle(true)); el.flashReplayBtn.addEventListener('click', setupFlashSingle);
  el.quizOptions.addEventListener('click', e=>{ const btn=e.target.closest('.quiz-option'); if(btn) answerQuiz(btn.dataset.id); });
  el.quizRestartBtn.addEventListener('click', ()=>startQuiz(false)); el.quizWrongBtn.addEventListener('click', openWrongSheet); el.quizMenuBtn.addEventListener('click', ()=>{ stopQuiz(); showScreen('menuScreen'); }); el.closeWrongSheetBtn.addEventListener('click', ()=>{ el.quizWrongSheet.classList.add('hidden'); showScreen('menuScreen'); }); el.quizReplayWrongBtn.addEventListener('click', ()=>{ el.quizWrongSheet.classList.add('hidden'); startQuiz(true); });
  el.matchBoard.addEventListener('click', e=>{ const btn=e.target.closest('.match-card'); if(btn) tapMatch(Number(btn.dataset.idx)); });
  el.matchRestartBtn.addEventListener('click', ()=>startMatch(true)); el.matchMenuBtn.addEventListener('click', ()=>{ stopMatch(); showScreen('menuScreen'); });
  bindDrag();
}
populateHome(); renderGuide(); updateTitles(); bind();
