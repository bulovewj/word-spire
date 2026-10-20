// 화면 전환, DOM 조작, 키보드 초점과 입력 연결을 한곳에 모은다.
function el(id) { return document.getElementById(id); }
function showScreen(name) {
  gameState.screen = name;
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === 'screen-' + name));
  window.scrollTo(0, 0);
  const heading = document.querySelector('#screen-' + name + ' h1');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll:true }); }
}
function renderPassage(challenge) {
  el('passage').replaceChildren();
  challenge.passage.forEach((sentence, index) => {
    const button = document.createElement('button');
    button.id = 'sentence-' + index;
    button.className = 'sentence';
    button.setAttribute('aria-pressed', gameState.evidence.includes(index));
    button.disabled = gameState.solved;
    button.innerHTML = '<span class="sentence-number" aria-hidden="true">' + (index + 1) + '</span><span>' + escapeHtml(sentence) + '</span>';
    button.setAttribute('aria-label', (index + 1) + '번 문장. ' + sentence);
    button.onclick = () => { toggleEvidence(index); renderReading(); };
    el('passage').appendChild(button);
  });
}
function renderChoices(challenge) {
  el('choices').replaceChildren();
  gameState.choiceOrder.forEach((id, index) => {
    const choice = challenge.choices.find((item) => item.id === id);
    const button = document.createElement('button');
    button.id = 'choice-' + id;
    button.className = 'choice';
    button.setAttribute('aria-pressed', gameState.answerId === id);
    button.disabled = gameState.solved;
    button.innerHTML = '<span class="choice-number" aria-hidden="true">' + (index + 1) + '</span><span>' + escapeHtml(choice.text) + '</span>';
    button.onclick = () => { chooseAnswer(id); renderReading(); };
    el('choices').appendChild(button);
  });
}
function renderHelp(challenge) {
  el('hint-panel').hidden = !gameState.hintUsed || gameState.solved;
  el('hint-panel').innerHTML = '<strong>단서 · 글을 다시 살펴봐요</strong>' + escapeHtml(challenge.hint);
  el('explanation-panel').hidden = !gameState.revealed || gameState.solved;
  el('explanation-panel').innerHTML = gameState.revealed ? explanationMarkup(challenge) : '';
  el('btn-hint').hidden = gameState.solved;
  el('btn-explain').hidden = gameState.solved;
  el('btn-hint').textContent = gameState.hintUsed ? '단서 다시 보기' : '단서 얻기';
  el('btn-explain').textContent = gameState.revealed ? '함께 읽기 다시 보기' : '함께 읽기';
}
function renderFeedback(challenge) {
  const feedback = gameState.feedback;
  el('feedback').hidden = !feedback;
  el('feedback').className = 'feedback' + (feedback?.kind === 'success' ? ' success' : '');
  const title = feedback?.kind === 'success' ? '해석과 근거가 이어졌어요!' : feedback?.kind === 'retry' ? '한 번 더 읽어 볼까요?' : '근거를 골라 주세요';
  el('feedback').innerHTML = feedback ? '<strong>' + title + '</strong>' + escapeHtml(feedback.text) : '';
  el('success-panel').hidden = !gameState.solved;
  el('takeaway').innerHTML = gameState.solved ? '<strong>수첩에 담았어요 · ' + escapeHtml(challenge.takeaway.word) + '</strong>' + escapeHtml(challenge.takeaway.meaning) + '<br>' + recordLabel(gameState.records[gameState.records.length - 1]) : '';
  el('btn-next').textContent = gameState.floor === TOTAL_FLOORS ? '모험 기록 보기 →' : (gameState.floor + 1) + '층으로 올라가기 →';
}
function renderReading() {
  const focusedId = document.activeElement?.id;
  const challenge = getCurrentChallenge();
  el('battle-floor').textContent = gameState.floor + '층';
  el('battle-mode').textContent = gameState.isDemo ? '체험' : '';
  el('chapter-name').textContent = chapterName() + ' · ' + (gameState.floor <= 5 ? '낱말의 뜻을 짐작해요' : gameState.floor <= 10 ? '문장과 문장을 이어요' : '정보의 근거를 살펴요');
  el('page-count').textContent = gameState.floor + ' / ' + TOTAL_FLOORS + ' 이야기';
  el('passage-title').textContent = challenge.title;
  el('skill-label').textContent = challenge.skill;
  el('transfer-note').hidden = !challenge.transferFrom;
  el('transfer-note').textContent = '다른 문맥에서 다시 만나는 낱말';
  el('evidence-instruction').textContent = '글을 읽고, 해석을 뒷받침하는 근거 ' + challenge.evidenceCount + '문장을 골라 주세요.';
  el('evidence-count').textContent = '근거 ' + gameState.evidence.length + ' / ' + challenge.evidenceCount;
  el('question').textContent = challenge.question;
  el('guardian-message').innerHTML = gameState.solved ? '이야기 한 장을 되찾았어!<br>새로운 문장에서도 만나 보자.' : '답을 찾았다면<br>그 까닭도 글에서 찾아볼까?';
  el('progress-label').textContent = gameState.records.length + ' / ' + TOTAL_FLOORS;
  el('reading-progress').value = gameState.records.length;
  el('journal-count').textContent = gameState.records.length;
  el('btn-submit').hidden = gameState.solved;
  el('btn-submit').disabled = !canSubmitReading();
  el('selection-status').textContent = gameState.solved ? '이 이야기 해결 완료' : (gameState.answerId ? '해석 선택 완료' : '해석을 골라요') + ' · 근거 ' + gameState.evidence.length + '/' + challenge.evidenceCount;
  el('save-status').textContent = gameState.isDemo ? '체험 중 · 이 모험은 저장되지 않아요' : gameState.storageUnavailable ? '이 브라우저에서는 저장할 수 없어요. 창을 닫으면 진행이 사라져요.' : '이 브라우저에 자동 저장돼요 · 언제든 다시 읽을 수 있어요';
  renderPassage(challenge); renderChoices(challenge); renderHelp(challenge); renderFeedback(challenge);
  if (focusedId && el(focusedId) && !el(focusedId).disabled && !el(focusedId).hidden) el(focusedId).focus({ preventScroll:true });
}
function renderMap() {
  el('map-list').replaceChildren();
  READING_CHALLENGES.forEach((challenge, index) => {
    const done = index < gameState.records.length;
    const current = index + 1 === gameState.floor;
    const row = document.createElement('div');
    row.className = 'map-node map-node-' + (done ? 'done' : current ? 'current' : 'locked');
    row.innerHTML = '<span>' + (index + 1) + '층 · ' + escapeHtml(challenge.title) + '</span><small>' + (done ? '이야기 되찾음' : current ? '읽는 중' : '앞 층을 읽으면 열려요') + '</small>';
    el('map-list').appendChild(row);
  });
}
function renderResult() {
  el('result-summary').innerHTML = resultMarkup();
  el('skill-summary').innerHTML = skillSummaryMarkup();
}
function refreshTitle() {
  const saved = parseReadingSave();
  el('btn-continue').hidden = !saved;
  el('btn-continue').textContent = saved?.floor === TOTAL_FLOORS && saved.solved ? '지난 모험 기록 보기' : (saved?.floor || 1) + '층부터 이어하기';
  el('title-record').textContent = saved ? '되찾은 이야기 ' + saved.records.length + ' / ' + TOTAL_FLOORS + ' · 이 브라우저에 저장됨' : '총 15층 · 시간제한 없이 천천히 읽어요';
}
function returnToTitle() { refreshTitle(); showScreen('title'); }
function openJournal() { el('journal-list').innerHTML = journalMarkup(); el('journal-modal').showModal(); }
function beginReading(isDemo = false) { startReading(isDemo); renderReading(); showScreen('battle'); }
function initUI() {
  el('btn-new-game').onclick = () => { if (parseReadingSave()) el('restart-modal').showModal(); else beginReading(); };
  el('btn-confirm-restart').onclick = () => { el('restart-modal').close(); beginReading(); };
  el('btn-cancel-restart').onclick = () => el('restart-modal').close();
  el('btn-continue').onclick = () => {
    if (!continueReading()) { refreshTitle(); return; }
    if (gameState.screen === 'result') renderResult(); else renderReading();
    showScreen(gameState.screen);
  };
  el('btn-demo').onclick = () => beginReading(true);
  el('btn-home').onclick = returnToTitle;
  el('btn-map').onclick = () => { renderMap(); showScreen('map'); };
  el('btn-map-return').onclick = () => { renderReading(); showScreen('battle'); };
  ['btn-journal','btn-result-journal'].forEach((id) => { el(id).onclick = openJournal; });
  el('btn-close-journal').onclick = () => el('journal-modal').close();
  el('btn-hint').onclick = () => { useReadingHint(); renderReading(); el('hint-panel').scrollIntoView({ block:'nearest' }); };
  el('btn-explain').onclick = () => { revealReadingExplanation(); renderReading(); el('explanation-panel').scrollIntoView({ block:'nearest' }); };
  el('btn-submit').onclick = () => {
    submitReading(); renderReading();
    if (gameState.solved) el('btn-next').focus();
    else el('feedback').scrollIntoView({ block:'nearest' });
  };
  el('btn-next').onclick = () => {
    if (!advanceReading()) return;
    if (gameState.screen === 'result') renderResult(); else renderReading();
    showScreen(gameState.screen);
  };
  el('btn-result-home').onclick = returnToTitle;
  refreshTitle();
  if (['reading','battle'].includes(new URLSearchParams(window.location.search).get('demo'))) beginReading(true);
}
document.addEventListener('DOMContentLoaded', initUI);
