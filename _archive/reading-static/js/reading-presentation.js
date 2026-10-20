// 표시 문자열만 만든다. 모든 DOM 접근과 이벤트 연결은 ui.js에 둔다.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function explanationMarkup(challenge) {
  const solutions = challenge.solutions.map((solution) => {
    const answer = challenge.choices.find((choice) => choice.id === solution.answerId);
    const evidence = solution.evidenceSets.map((set) => set.map((index) => index + 1).join('·') + '번 문장').join(' 또는 ');
    return '<p>해석: ' + escapeHtml(answer.text) + '<br>근거: ' + evidence + '</p>';
  }).join('');
  return '<strong>함께 읽기 · 도움받은 기록으로 남아요</strong>' + solutions + '<p>' + escapeHtml(challenge.explanation) + '</p><p>글로 돌아가 해석과 근거를 직접 골라 보세요.</p>';
}
function journalMarkup() {
  if (!gameState.records.length) return '<p class="journal-intro">첫 이야기를 해결하면 낱말이 수첩에 담겨요.</p>';
  return gameState.records.map((record, index) => {
    const challenge = READING_CHALLENGES[index];
    const word = challenge.takeaway;
    return '<article class="journal-entry"><small>' + (index + 1) + '층 · ' + escapeHtml(challenge.title) + ' · ' + recordLabel(record) + '</small><h3>' + escapeHtml(word.word) + '</h3><p>' + escapeHtml(word.meaning) + '</p><p class="new-example">다른 문장에서<br>' + escapeHtml(word.example) + '</p></article>';
  }).join('');
}
function resultMarkup() {
  const first = gameState.records.filter((record) => record.firstTry).length;
  const helped = gameState.records.filter((record) => record.hintUsed || record.revealed).length;
  return [[first,'첫 시도에 해결'],[gameState.records.length - first - helped,'다시 읽고 해결'],[helped,'도움받아 해결']].map(([count,label]) => '<div class="result-stat"><strong>' + count + '</strong>' + label + '</div>').join('');
}
function skillSummaryMarkup() {
  return readingSummary().map(({ skill,total,independent }) => '<div class="skill-row"><strong>' + skill + '</strong>' + total + '개 이야기 해결 · 첫 시도 ' + independent + '개</div>').join('');
}
