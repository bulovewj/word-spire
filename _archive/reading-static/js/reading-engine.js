// 글별 해석과 근거를 함께 판정한다. 태그, 무작위 손패, 오답 피해는 사용하지 않는다.
function chooseAnswer(id) {
  if (gameState.solved || !getCurrentChallenge().choices.some((choice) => choice.id === id)) return;
  gameState.answerId = id;
  gameState.feedback = null;
  saveReading();
}
function toggleEvidence(index) {
  const challenge = getCurrentChallenge();
  if (gameState.solved || !Number.isInteger(index) || index < 0 || index >= challenge.passage.length) return;
  gameState.feedback = null;
  if (gameState.evidence.includes(index)) gameState.evidence = gameState.evidence.filter((item) => item !== index);
  else if (challenge.evidenceCount === 1) gameState.evidence = [index];
  else if (gameState.evidence.length < challenge.evidenceCount) gameState.evidence.push(index);
  else gameState.feedback = { kind:'notice', text:'근거는 ' + challenge.evidenceCount + '문장만 골라요. 바꾸려면 고른 문장을 한 번 더 눌러 주세요.' };
  saveReading();
}
function canSubmitReading() {
  return !gameState.solved && Boolean(gameState.answerId) && gameState.evidence.length === getCurrentChallenge().evidenceCount;
}
function submitReading() {
  const challenge = getCurrentChallenge();
  if (gameState.solved) return 'already-solved';
  if (!canSubmitReading()) {
    gameState.feedback = { kind:'notice', text:'해석 하나와 근거 ' + challenge.evidenceCount + '문장을 고른 뒤 확인해 주세요.' };
    return 'incomplete';
  }
  const signature = gameState.answerId + ':' + gameState.evidence.slice().sort().join(',');
  if (signature !== gameState.lastSubmission) gameState.attempts++;
  gameState.lastSubmission = signature;
  const solutions = challenge.solutions.filter((solution) => solution.answerId === gameState.answerId);
  const correct = solutions.some((solution) => solution.evidenceSets.some((set) => sameEvidence(set, gameState.evidence)));
  if (correct) {
    gameState.solved = true;
    gameState.records.push({ id:challenge.id, answerId:gameState.answerId, evidence:gameState.evidence.slice(),
      attempts:gameState.attempts, hintUsed:gameState.hintUsed, revealed:gameState.revealed,
      firstTry:gameState.attempts === 1 && !gameState.hintUsed && !gameState.revealed });
    gameState.feedback = { kind:'success', text:challenge.explanation };
  } else {
    const choice = challenge.choices.find((item) => item.id === gameState.answerId);
    gameState.feedback = { kind:'retry', text:solutions.length ?
      '해석은 글에 맞아요. 다만 고른 문장만으로는 그 해석을 뒷받침하기 어려워요. 글 속에서 직접 확인할 수 있는 근거를 다시 골라 보세요.' : choice.feedback };
  }
  saveReading();
  return correct ? 'correct' : 'retry';
}
function useReadingHint() {
  if (gameState.solved) return;
  gameState.hintUsed = true;
  saveReading();
}
function revealReadingExplanation() {
  if (gameState.solved) return;
  gameState.hintUsed = true;
  gameState.revealed = true;
  saveReading();
}
function advanceReading() {
  if (!gameState.solved) return false;
  if (gameState.floor === TOTAL_FLOORS) gameState.screen = 'result';
  else {
    gameState.floor++;
    resetChallenge();
    gameState.screen = 'battle';
  }
  saveReading();
  return true;
}
