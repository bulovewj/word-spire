import type { Passage, WordEntry } from './types'
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
    if (q.evidence.length < 1) errors.push(`${where}: evidence 조합이 없음`)
    q.evidence.forEach((set, j) => {
      if (set.length < 1) errors.push(`${where}.evidence[${j}]: 비어 있음`)
      errors.push(...checkIndexes(set, n, `${where}.evidence[${j}]`))
    })
    for (const id of q.bonusWords ?? []) {
      if (!knownWordIds.has(id)) errors.push(`${where}.bonusWords: 모르는 낱말 id ${id}`)
    }
    if (q.bonusWords && q.type !== 'author') errors.push(`${where}: bonusWords는 author 질문에만`)
  })

  const s = p.summary
  if (s.models.length < 1) errors.push(at('summary.models: 모범 요약이 없음'))
  if (s.conceptLabels.length !== s.concepts.length) {
    errors.push(at(`summary: conceptLabels(${s.conceptLabels.length})와 concepts(${s.concepts.length}) 길이가 다름`))
  }
  if (s.minConcepts < 1 || s.minConcepts > s.concepts.length) {
    errors.push(at(`summary.minConcepts ${s.minConcepts}는 1~${s.concepts.length} 밖`))
  }
  return errors
}

export function validateContent(packs: Record<string, WordEntry[]>, passages: Passage[]): string[] {
  const errors = Object.entries(packs).flatMap(([file, words]) => validateWords(words, file))
  const ids = new Set(Object.values(packs).flat().map((w) => w.id))
  for (const p of passages) {
    for (const lw of p.lockedWords) {
      if (ids.has(lw.card.id)) errors.push(`passages/${p.id}: 낱말 id 중복 ${lw.card.id}`)
      ids.add(lw.card.id)
    }
  }
  for (const p of passages) errors.push(...validatePassage(p, ids))
  return errors
}
