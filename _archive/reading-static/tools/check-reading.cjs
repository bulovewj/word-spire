#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = `${__dirname}/..`;
const names = ['data-reading-words', 'data-reading-reasoning', 'reading-state', 'reading-engine'];
const source = names.map(name => fs.readFileSync(`${root}/js/${name}.js`, 'utf8')).join('\n');
function harness(random = () => 0.43, storage = new Map()) {
  const context = vm.createContext({ Math: Object.assign(Object.create(Math), { random }), localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  }});
  vm.runInContext(`${source}\nglobalThis.api = { gameState, READING_CHALLENGES, READING_SAVE_KEY,
    startReading, getCurrentChallenge, resetChallenge, chooseAnswer, toggleEvidence, submitReading,
    advanceReading, useReadingHint, revealReadingExplanation, parseReadingSave, continueReading,
    saveReading, readingSummary };`, context);
  return { ...context.api, storage };
}
const plain = value => JSON.parse(JSON.stringify(value));
function combinations(length, count, start = 0, prefix = []) {
  if (!count) return [prefix];
  return Array.from({ length: Math.max(0, length - start - count + 1) }, (_, offset) => start + offset)
    .flatMap(index => combinations(length, count - 1, index + 1, [...prefix, index]));
}
function answer(api, answerId, evidence) {
  api.chooseAnswer(answerId);
  evidence.forEach(index => api.toggleEvidence(index));
  return api.submitReading();
}
function solve(api) {
  const solution = api.getCurrentChallenge().solutions[0];
  api.gameState.evidence.slice().forEach(index => api.toggleEvidence(index));
  return answer(api, solution.answerId, solution.evidenceSets[0]);
}
const api = harness();
const challenges = api.READING_CHALLENGES;
assert.equal(challenges.length, 15, 'The adventure must have fifteen floors');
assert.deepEqual(plain(challenges.map(challenge => challenge.id)), Array.from({ length: 15 }, (_, i) => `r${String(i + 1).padStart(2, '0')}`));
let judged = 0;
for (const [floor, challenge] of challenges.entries()) {
  const ids = challenge.choices.map(choice => choice.id);
  assert.equal(new Set(ids).size, ids.length, `${challenge.id}: unique choice ids`);
  assert.ok(challenge.passage.every(text => typeof text === 'string' && text.trim()));
  assert.ok(challenge.choices.every(choice => choice.text && choice.feedback));
  assert.ok(challenge.hint && challenge.explanation && challenge.takeaway.example);
  assert.ok(challenge.solutions.length > 0 && challenge.evidenceCount > 0);
  for (const solution of challenge.solutions) {
    assert.ok(ids.includes(solution.answerId), `${challenge.id}: solution refers to a real answer`);
    assert.ok(solution.evidenceSets.length > 0);
    for (const set of solution.evidenceSets) {
      assert.equal(set.length, challenge.evidenceCount);
      assert.equal(new Set(set).size, set.length);
      assert.ok(set.every(index => Number.isInteger(index) && index >= 0 && index < challenge.passage.length));
    }
  }
  for (const choice of challenge.choices) {
    for (const evidence of combinations(challenge.passage.length, challenge.evidenceCount)) {
      api.startReading(true);
      api.gameState.floor = floor + 1;
      api.resetChallenge();
      const accepted = challenge.solutions.some(solution => solution.answerId === choice.id &&
        solution.evidenceSets.some(set => set.length === evidence.length && set.every(index => evidence.includes(index))));
      assert.equal(answer(api, choice.id, evidence), accepted ? 'correct' : 'retry', `${challenge.id}/${choice.id}/${evidence}`);
      assert.equal(api.gameState.solved, accepted);
      assert.equal(api.gameState.records.length, Number(accepted));
      assert.equal(api.gameState.attempts, 1);
      if (accepted) {
        assert.equal(api.submitReading(), 'already-solved');
        api.chooseAnswer(ids.find(id => id !== choice.id));
        api.toggleEvidence(evidence[0]);
        assert.equal(api.gameState.answerId, choice.id);
        assert.deepEqual(plain(api.gameState.evidence), evidence);
        assert.equal(api.gameState.records.length, 1, 'No duplicate rewards');
      } else {
        assert.equal(api.submitReading(), 'retry');
        assert.equal(api.gameState.attempts, 1, 'Duplicate submission is not another attempt');
        assert.equal(api.advanceReading(), false, 'Wrong answers cannot advance');
      }
      judged++;
    }
  }
  for (let count = 0; count < challenge.evidenceCount; count++) {
    api.startReading(true); api.gameState.floor = floor + 1; api.resetChallenge();
    assert.equal(answer(api, challenge.solutions[0].answerId, combinations(challenge.passage.length, count)[0]), 'incomplete');
    assert.equal(api.gameState.attempts, 0);
    assert.equal(api.gameState.records.length, 0);
    assert.equal(api.advanceReading(), false);
  }
}
api.startReading(true);
api.chooseAnswer('invalid'); api.toggleEvidence(-1); api.toggleEvidence(999); api.toggleEvidence(0.5);
assert.equal(api.gameState.answerId, null); assert.equal(api.gameState.evidence.length, 0);
api.toggleEvidence(0); api.toggleEvidence(1); api.toggleEvidence(2);
assert.equal(api.gameState.evidence.length, 2, 'Evidence selection cannot exceed the requested count');
assert.equal(api.submitReading(), 'incomplete', 'Evidence without an answer cannot pass');
for (const help of ['useReadingHint', 'revealReadingExplanation', 'retry']) {
  api.startReading(true);
  if (help === 'retry') assert.equal(answer(api, 'a', [0, 1]), 'retry');
  else api[help]();
  assert.equal(api.gameState.solved, false);
  assert.equal(api.gameState.records.length, 0);
  assert.equal(api.advanceReading(), false, 'Reading an explanation cannot advance');
  assert.equal(solve(api), 'correct');
  assert.equal(api.gameState.records[0].firstTry, false, `${help} is not independent first-try success`);
}
const first = harness(() => 0), second = harness(() => 0.999);
first.startReading(true); second.startReading(true);
assert.notDeepEqual(plain(first.gameState.choiceOrder), plain(second.gameState.choiceOrder), 'Choice display order is randomized');
const storage = new Map([['wordSpireSave', 'legacy-save-sentinel']]);
let saved = harness(undefined, storage);
saved.startReading();
assert.equal(saved.READING_SAVE_KEY, 'wordSpireReadingV1');
const newRunSave = storage.get(saved.READING_SAVE_KEY);
saved.startReading(true); saved.useReadingHint(); solve(saved); saved.advanceReading();
assert.equal(storage.get(saved.READING_SAVE_KEY), newRunSave, 'Demo leaves the real reading save untouched');
assert.equal(storage.get('wordSpireSave'), 'legacy-save-sentinel', 'Old game storage stays untouched');
saved.startReading();
answer(saved, 'a', [0, 1]); saved.useReadingHint(); saved.toggleEvidence(1); saved.chooseAnswer('b');
const partial = plain(saved.gameState);
saved = harness(undefined, storage); assert.equal(saved.continueReading(), true);
for (const key of ['floor', 'answerId', 'evidence', 'attempts', 'hintUsed', 'revealed', 'choiceOrder', 'lastSubmission']) {
  assert.deepEqual(plain(saved.gameState[key]), partial[key], `Resume retains partial work: ${key}`);
}
assert.equal(solve(saved), 'correct'); assert.equal(saved.gameState.records[0].firstTry, false);
saved.startReading();
for (let floor = 1; floor <= 15; floor++) {
  assert.equal(saved.gameState.floor, floor);
  assert.equal(solve(saved), 'correct');
  const savedState = plain(saved.gameState);
  saved = harness(undefined, storage);
  assert.equal(saved.continueReading(), true);
  assert.equal(saved.gameState.floor, floor);
  assert.deepEqual(plain(saved.gameState.records), savedState.records);
  assert.equal(saved.submitReading(), 'already-solved');
  assert.equal(saved.advanceReading(), true);
  if (floor < 15) {
    saved = harness(undefined, storage); assert.equal(saved.continueReading(), true);
    assert.equal(saved.gameState.floor, floor + 1); assert.equal(saved.gameState.solved, false);
  }
}
assert.equal(saved.gameState.screen, 'result');
assert.equal(saved.readingSummary().reduce((total, row) => total + row.total, 0), 15);
assert.equal(saved.readingSummary().reduce((total, row) => total + row.independent, 0), 15);
const finished = storage.get(saved.READING_SAVE_KEY);
const malformed = [null, '{', '{}', JSON.stringify({ version: 1, floor: 999 })];
const corruptions = [value => value.version++, value => value.floor = 0, value => value.records.pop(),
  value => value.answerId = 'missing', value => value.evidence = [0, 0], value => value.evidence = [-1, 1],
  value => value.choiceOrder = ['a', 'a', 'b'], value => value.attempts = -1,
  value => value.records[0].evidence = [2], value => value.records[0].firstTry = false,
  value => value.hintUsed = true, value => value.lastSubmission = null,
  value => value.lastSubmission = 'b:01,0', value => value.lastSubmission = 'a:0,1',
  value => value.lastSubmission = 'b:0,0', value => value.records[0].revealed = true];
for (const mutate of corruptions) {
  const payload = JSON.parse(finished); mutate(payload); malformed.push(JSON.stringify(payload));
}
for (const payload of malformed) {
  storage.set(saved.READING_SAVE_KEY, payload);
  assert.ok(saved.parseReadingSave() === null, 'Invalid or internally inconsistent save must be rejected');
  assert.equal(saved.continueReading(), false);
}
storage.set(saved.READING_SAVE_KEY, finished);
assert.ok(saved.parseReadingSave());
const freshPayload = JSON.parse(newRunSave);
freshPayload.lastSubmission = 'b:0,1';
storage.set(saved.READING_SAVE_KEY, JSON.stringify(freshPayload));
assert.equal(saved.parseReadingSave(), null, 'Zero attempts cannot have a past submission');
freshPayload.attempts = 1;
storage.set(saved.READING_SAVE_KEY, JSON.stringify(freshPayload));
assert.equal(saved.parseReadingSave(), null, 'A correct last submission cannot remain unsolved');
const unavailable = harness(); unavailable.storage.set = () => { throw new Error('Storage disabled'); };
unavailable.startReading(); assert.equal(unavailable.gameState.storageUnavailable, true);
assert.equal(solve(unavailable), 'correct', 'Storage failure must not block play');
console.log(`Reading checks passed: ${judged} answer/evidence combinations across 15 floors; progression, hints, retry, shuffle, save validation, resume and demo isolation.`);
