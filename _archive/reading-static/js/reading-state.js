// 새 읽기 모험은 예전 속담 덱의 저장 키와 분리한다.
const READING_SAVE_KEY = 'wordSpireReadingV1';
const READING_CHALLENGES = [...WORD_CHALLENGES, ...REASONING_CHALLENGES].sort((a, b) => a.id.localeCompare(b.id));
const TOTAL_FLOORS = READING_CHALLENGES.length;
const gameState = { screen:'title', records:[], isDemo:false, storageUnavailable:false };

function shuffleChoices(choices) {
  const ids = choices.map((choice) => choice.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
function getCurrentChallenge() { return READING_CHALLENGES[gameState.floor - 1]; }
function resetChallenge() {
  Object.assign(gameState, { answerId:null, evidence:[], attempts:0, hintUsed:false, revealed:false,
    solved:false, feedback:null, lastSubmission:null, choiceOrder:shuffleChoices(getCurrentChallenge().choices) });
}
function startReading(isDemo = false) {
  Object.assign(gameState, { floor:1, records:[], isDemo, screen:'battle', storageUnavailable:false });
  resetChallenge();
  saveReading();
}
function saveReading() {
  if (gameState.isDemo) return;
  try {
    const fields = ['floor','records','answerId','evidence','attempts','hintUsed','revealed','solved','lastSubmission','choiceOrder'];
    const payload = { version:1 };
    fields.forEach((key) => { payload[key] = gameState[key]; });
    localStorage.setItem(READING_SAVE_KEY, JSON.stringify(payload));
    gameState.storageUnavailable = false;
  } catch (_) { gameState.storageUnavailable = true; }
}
function sameEvidence(left, right) {
  return left.length === right.length && left.every((index) => right.includes(index));
}
function validRecord(record, challenge) {
  if (!record || record.id !== challenge.id || !Number.isSafeInteger(record.attempts) || record.attempts < 1) return false;
  if (!['hintUsed','revealed','firstTry'].every((key) => typeof record[key] === 'boolean')) return false;
  if (record.revealed && !record.hintUsed) return false;
  if (record.firstTry !== (record.attempts === 1 && !record.hintUsed && !record.revealed)) return false;
  return Array.isArray(record.evidence) && new Set(record.evidence).size === record.evidence.length && challenge.solutions.some((solution) =>
    solution.answerId === record.answerId && solution.evidenceSets.some((set) => sameEvidence(set, record.evidence)));
}
function parseReadingSubmission(signature, challenge) {
  if (typeof signature !== 'string') return null;
  const parts = signature.split(':');
  if (parts.length !== 2 || !challenge.choices.some((choice) => choice.id === parts[0])) return null;
  const evidence = parts[1].split(',').map(Number);
  if (evidence.length !== challenge.evidenceCount || new Set(evidence).size !== evidence.length) return null;
  if (!evidence.every((index) => Number.isInteger(index) && index >= 0 && index < challenge.passage.length)) return null;
  if (signature !== parts[0] + ':' + evidence.slice().sort().join(',')) return null;
  const correct = challenge.solutions.some((solution) => solution.answerId === parts[0] &&
    solution.evidenceSets.some((set) => sameEvidence(set, evidence)));
  return { answerId:parts[0], evidence, correct };
}
function parseReadingSave() {
  try {
    const data = JSON.parse(localStorage.getItem(READING_SAVE_KEY));
    if (!data || data.version !== 1 || !Number.isInteger(data.floor) || data.floor < 1 || data.floor > TOTAL_FLOORS) return null;
    if (!['hintUsed','revealed','solved'].every((key) => typeof data[key] === 'boolean')) return null;
    if (!Number.isSafeInteger(data.attempts) || data.attempts < 0 || !Array.isArray(data.records)) return null;
    if (data.revealed && !data.hintUsed) return null;
    if (data.records.length !== data.floor - 1 + Number(data.solved)) return null;
    if (!data.records.every((record, index) => validRecord(record, READING_CHALLENGES[index]))) return null;
    const challenge = READING_CHALLENGES[data.floor - 1];
    if (data.answerId !== null && !challenge.choices.some((choice) => choice.id === data.answerId)) return null;
    if (!Array.isArray(data.evidence) || data.evidence.length > challenge.evidenceCount || new Set(data.evidence).size !== data.evidence.length) return null;
    if (!data.evidence.every((index) => Number.isInteger(index) && index >= 0 && index < challenge.passage.length)) return null;
    if (!Array.isArray(data.choiceOrder) || data.choiceOrder.length !== challenge.choices.length || new Set(data.choiceOrder).size !== data.choiceOrder.length) return null;
    if (!data.choiceOrder.every((id) => challenge.choices.some((choice) => choice.id === id))) return null;
    if ((data.attempts === 0) !== (data.lastSubmission === null)) return null;
    if (data.attempts > 0) {
      const submitted = parseReadingSubmission(data.lastSubmission, challenge);
      if (!submitted || submitted.correct !== data.solved) return null;
      if (data.solved && (submitted.answerId !== data.answerId || !sameEvidence(submitted.evidence, data.evidence))) return null;
    }
    if (data.solved) {
      const record = data.records[data.floor - 1];
      if (!validRecord({ ...data, id:challenge.id, firstTry:data.attempts === 1 && !data.hintUsed && !data.revealed }, challenge)) return null;
      if (!['answerId','attempts','hintUsed','revealed'].every((key) => data[key] === record[key])) return null;
      if (!sameEvidence(data.evidence, record.evidence)) return null;
    }
    return data;
  } catch (_) { return null; }
}
function continueReading() {
  const data = parseReadingSave();
  if (!data) return false;
  Object.assign(gameState, data, { isDemo:false, storageUnavailable:false, feedback:null,
    screen:data.floor === TOTAL_FLOORS && data.solved ? 'result' : 'battle' });
  if (data.solved) gameState.feedback = { kind:'success', text:getCurrentChallenge().explanation };
  return true;
}
function chapterName(floor = gameState.floor) {
  return floor <= 5 ? '문맥의 서가' : floor <= 10 ? '이어진 문장' : '근거의 꼭대기';
}
function recordLabel(record) {
  return record.revealed || record.hintUsed ? '도움받아 해결' : record.firstTry ? '첫 시도에 해결' : '다시 읽고 해결';
}
function readingSummary() {
  return ['문맥 낱말','문장 연결','내용 추론','근거 판단'].map((skill) => {
    const records = gameState.records.filter((record) => READING_CHALLENGES.find((c) => c.id === record.id).skill === skill);
    return { skill, total:records.length, independent:records.filter((record) => record.firstTry).length };
  });
}
