import type { Evidence, Passage, SummarySpec, Tower, WordEntry } from './types'
import { findStem } from './wordStem'

// 콘텐츠 검사 (작업지시서 1-4). 문제마다 "어디: 무엇" 한 줄을 돌려준다.

function checkWord(w: WordEntry, where: string): string[] {
  const errors: string[] = []
  if (!w.id) errors.push(`${where}: id가 비어 있음`)
  if (!w.word) errors.push(`${where}: word가 비어 있음`)
  if (!w.meaning) errors.push(`${where}: meaning이 비어 있음`)
  if (w.accepts.length < 1) errors.push(`${where}: accepts가 1개 이상이어야 함`)
  if (w.rejects.length < 1) errors.push(`${where}: rejects가 1개 이상이어야 함`)
  if (w.example && !findStem(w.example, w.word)) {
    errors.push(`${where}: 예문에 "${w.word}"가 없음(가리지 말고 그대로 쓸 것. 화면이 가린다)`)
  }
  return errors
}

function checkIndexes(list: number[], max: number, where: string): string[] {
  return list
    .filter((i) => !Number.isInteger(i) || i < 0 || i >= max)
    .map((i) => `${where}: 문장 index ${i}는 범위(0~${max - 1}) 밖`)
}

export function validateWords(words: WordEntry[], file: string): string[] {
  const errors = words.flatMap((w, i) => checkWord(w, `${file} [${i}] ${w.id}`))
  const seen = new Set<string>()
  for (const w of words) {
    if (seen.has(w.id)) errors.push(`${file}: 낱말 id 중복 ${w.id}`)
    seen.add(w.id)
  }
  return errors
}

export function validatePassage(p: Passage, knownWordIds: Set<string>): string[] {
  const errors: string[] = []
  const n = p.sentences.length
  const at = (path: string) => `passages/${p.id} ${path}`

  if (n < 1) errors.push(at('sentences: 문장이 없음'))
  if (p.enemy.maxHp <= 0) errors.push(at('enemy.maxHp: 0보다 커야 함'))
  if (p.enemy.pattern.length < 1) errors.push(at('enemy.pattern: 비어 있음'))
  if (!p.enemy.introLine || !p.enemy.sealLine) errors.push(at('enemy: introLine·sealLine이 필요함'))

  p.lockedWords.forEach((lw, i) => {
    const where = at(`lockedWords[${i}]`)
    errors.push(...checkIndexes([lw.sentence], n, where))
    errors.push(...checkIndexes(lw.clues, n, `${where}.clues`))
    const sentence = p.sentences[lw.sentence]
    if (sentence !== undefined && !sentence.includes(lw.word)) {
      errors.push(`${where}: "${lw.word}"가 문장 ${lw.sentence}에 없음`)
    }
    if (lw.clues.length < 1) errors.push(`${where}.clues: 1개 이상이어야 함`)
    errors.push(...checkWord(lw.card, `${where}.card`))
  })

  p.questions.forEach((q, i) => {
    const where = at(`questions[${i}] ${q.id}`)
    if (q.options.length !== 4) errors.push(`${where}: 보기는 4개여야 함(지금 ${q.options.length}개)`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      errors.push(`${where}: answer ${q.answer}는 보기 범위 밖`)
    }
    errors.push(...checkEvidence(q.evidence, n, where))
    const ev = q.evidence
    if (q.type === 'literal' && ev.count !== 1) errors.push(`${where}: literal 질문의 근거 개수(count)는 1`)
    if (q.type === 'connect' && ev.count < 2) errors.push(`${where}: connect 질문의 근거 개수(count)는 2 이상`)
    for (const id of q.bonusWords ?? []) {
      if (!knownWordIds.has(id)) errors.push(`${where}.bonusWords: 모르는 낱말 id ${id}`)
    }
    if (q.bonusWords && q.type !== 'author') errors.push(`${where}: bonusWords는 author 질문에만`)
  })

  errors.push(...checkSpec(p.summary, at('summary')))
  if (p.rumor) {
    const r = p.rumor
    if (!r.claim.trim()) errors.push(at('rumor.claim: 소문 문장이 없음'))
    if (p.sentences.some((s) => s.includes(r.claim.trim()))) errors.push(at('rumor.claim: 소문은 본문에 넣지 않는다'))
    errors.push(...checkEvidence(r.evidence, n, at('rumor')))
    errors.push(...checkSpec(r.rebuttal, at('rumor.rebuttal')))
    if (r.rebuttal.rejects.length < 1) errors.push(at('rumor.rebuttal.rejects: 소문에 동의하는 답 앵커가 필요함'))
  }
  return errors
}

function checkEvidence(ev: Evidence, n: number, where: string): string[] {
  const errors: string[] = []
  if (ev.required.length < 1) errors.push(`${where}: evidence.required가 없음`)
  ev.required.forEach((set, j) => {
    if (set.length < 1) errors.push(`${where}.evidence.required[${j}]: 비어 있음`)
    errors.push(...checkIndexes(set, n, `${where}.evidence.required[${j}]`))
  })
  errors.push(...checkIndexes(ev.allowed ?? [], n, `${where}.evidence.allowed`))
  const related = new Set([...ev.required.flat(), ...(ev.allowed ?? [])])
  if (ev.required.some((set) => set.length > ev.count)) errors.push(`${where}: 필수 묶음이 count(${ev.count})보다 큼`)
  if (related.size < ev.count) errors.push(`${where}: 관련 문장(필수+허용)이 count(${ev.count})보다 적음`)
  return errors
}

function checkSpec(s: SummarySpec, where: string): string[] {
  const errors: string[] = []
  if (s.models.length < 1) errors.push(`${where}.models: 모범 답이 없음`)
  if (s.conceptLabels.length !== s.concepts.length) {
    errors.push(`${where}: conceptLabels(${s.conceptLabels.length})와 concepts(${s.concepts.length}) 길이가 다름`)
  }
  if (s.minConcepts < 1 || s.minConcepts > s.concepts.length) {
    errors.push(`${where}.minConcepts ${s.minConcepts}는 1~${s.concepts.length} 밖`)
  }
  return errors
}

export function validateTowers(towers: Tower[], passages: Passage[]): string[] {
  const errors: string[] = []
  const ids = new Set(towers.map((t) => t.id))
  for (const t of towers) {
    if (t.intro.length < 1 || t.outro.length < 1) errors.push(`towers/${t.id}: intro·outro가 필요함`)
  }
  for (const p of passages) {
    if (!ids.has(p.towerId)) errors.push(`passages/${p.id}: 모르는 탑 ${p.towerId}`)
  }
  return errors
}

export function validateContent(packs: Record<string, WordEntry[]>, passages: Passage[], towers: Tower[] = []): string[] {
  const errors = Object.entries(packs).flatMap(([file, words]) => validateWords(words, file))
  const ids = new Set(Object.values(packs).flat().map((w) => w.id))
  for (const p of passages) {
    for (const lw of p.lockedWords) {
      if (ids.has(lw.card.id)) errors.push(`passages/${p.id}: 낱말 id 중복 ${lw.card.id}`)
      ids.add(lw.card.id)
    }
  }
  for (const p of passages) errors.push(...validatePassage(p, ids))
  if (towers.length > 0) errors.push(...validateTowers(towers, passages))
  return errors
}
