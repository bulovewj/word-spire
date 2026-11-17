// 균형 시뮬레이션에 쓰는 학생 모형 (simulate.test.ts). 난수는 시드 난수만.
// 게임 코드는 이 파일을 쓰지 않는다(테스트 전용). 숫자를 바꾸면 여기 모형으로 다시 확인한다
import type { Evidence, Question } from '../content/types'
import { nextRandom } from './rng'
import { reduceRun, type RunContext, type RunState } from './run'
import { canUseWord, incomingDamage, reduce, type Action, type GameState } from './state'

export type Policy = (s: GameState, rand: () => number) => Action[]

/** 정답 근거 한 벌: 첫 필수 묶음 + 관련 문장으로 count개 채우기 */
export function goodEvidence(ev: Evidence): number[] {
  const pick = [...(ev.required[0] ?? [])]
  for (const i of [...ev.required.flat(), ...(ev.allowed ?? [])]) if (pick.length < ev.count && !pick.includes(i)) pick.push(i)
  return pick
}

/** 횟수가 가장 많이 남은 낱말 (여러 낱말을 고루 쓰게) */
const freshestWord = (s: GameState) => s.deck.filter((id) => canUseWord(s, id))
  .sort((a, b) => (s.wordUses[b] ?? 0) - (s.wordUses[a] ?? 0))[0]

const has = (s: GameState, kind: string) => s.textCards.some((c) => c.kind === kind)

export interface Skill {
  option: number        // 보기를 맞힐 확률
  evidence: number      // (보기를 맞혔을 때) 근거까지 맞힐 확률
  fog: number           // 안개 단서를 맞힐 확률
  word: number          // 낱말 방어를 통과할 확률
  summary: number       // 요약을 첫 시도에 통과할 확률
  summaryLearn: number  // 실패할 때마다(빠진 것을 듣고 고쳐 써서) 통과 확률이 오르는 폭
  rumor: number         // 반박 글이 통과할 확률
  sureRight: number     // 맞힐 때 '확실'로 낼 확률
  sureWrong: number     // 틀릴 때 '확실'로 낼 확률 (자기 점검을 잘할수록 낮다)
  defend: 'write' | 'pick' | 'none'
  guardAt: number       // 받을 피해가 이만큼 이상이고 방어가 없으면 공격보다 먼저 막는다 (Infinity = 남는 생각력으로만)
  thorough: boolean     // 요약 봉인이 열려도 남은 질문을 다 푼다
}

export const PERFECT: Skill = {
  option: 1, evidence: 1, fog: 1, word: 1, summary: 1, summaryLearn: 0, rumor: 1, sureRight: 1, sureWrong: 1, defend: 'write', guardAt: Infinity, thorough: true,
}
/** 보통 학생: 열에 일곱은 맞히고, 요약은 한두 번 고쳐 쓰고, 방어는 뜻 고르기로 */
export const AVERAGE: Skill = {
  option: 0.7, evidence: 0.65, fog: 0.6, word: 0.85, summary: 0.5, summaryLearn: 0.2, rumor: 0.4, sureRight: 0.65, sureWrong: 0.35, defend: 'pick', guardAt: 7, thorough: true,
}
/** 서툰 학생: 반쯤 맞히고 요약을 여러 번 고쳐 쓴다 */
export const STRUGGLING: Skill = {
  option: 0.5, evidence: 0.45, fog: 0.4, word: 0.7, summary: 0.3, summaryLearn: 0.2, rumor: 0.2, sureRight: 0.5, sureWrong: 0.45, defend: 'pick', guardAt: 7, thorough: true,
}
/** 아무거나 누르는 학생: 보기·근거·확신도 무작위, 요약은 열에 한 번만 우연히 통과 */
export const RANDOM: Skill = {
  option: 0.25, evidence: 0.2, fog: 0.2, word: 0.33, summary: 0.1, summaryLearn: 0, rumor: 0.05, sureRight: 0.5, sureWrong: 0.5, defend: 'pick', guardAt: Infinity, thorough: true,
}

function wrongEvidence(q: Question, n: number): number[] {
  const related = new Set([...q.evidence.required.flat(), ...(q.evidence.allowed ?? [])])
  const out: number[] = []
  for (let i = 0; i < n && out.length < q.evidence.count; i++) if (!related.has(i)) out.push(i)
  for (let i = 0; out.length < q.evidence.count; i++) if (!out.includes(i)) out.push(i)   // 관련 없는 문장이 모자라면 아무 문장
  return out
}

/** 실력(확률)에 따라 한 번에 낼 action들. 생각력이 모자란 것은 reduce가 무시한다 */
export function student(k: Skill): Policy {
  return (s, rand) => {
    const acts: Action[] = []
    const p = s.passage
    const questionsLeft = has(s, 'question')
    if (has(s, 'summary') && (!k.thorough || !questionsLeft)) {
      const chance = Math.min(0.95, k.summary + k.summaryLearn * s.tally.summaryFails)
      acts.push({ type: 'resolveSummary', pass: rand() < Math.max(chance, k.summary), answer: '' })
    }
    s.textCards.filter((c) => c.kind === 'fog').forEach((c) => {
      const lw = p.lockedWords[Number(c.refId)]
      if (lw) acts.push({ type: 'resolveFog', wordIndex: Number(c.refId), sentence: rand() < k.fog ? lw.clues[0] ?? 0 : lw.sentence })
    })
    if (p.rumor && has(s, 'rumor')) {
      const ok = rand() < k.evidence
      acts.push({ type: 'resolveRumor', evidence: ok ? goodEvidence(p.rumor.evidence) : [0, p.sentences.length - 2], pass: rand() < k.rumor, answer: '' })
    }
    for (const c of s.textCards.filter((x) => x.kind === 'question')) {
      const q = p.questions.find((x) => x.id === c.refId)
      if (!q) continue
      const right = rand() < k.option
      const ev = right && rand() < k.evidence ? goodEvidence(q.evidence) : wrongEvidence(q, p.sentences.length)
      acts.push({
        type: 'resolveQuestion', questionId: q.id, option: right ? q.answer : (q.answer + 1) % q.options.length, evidence: ev,
        confidence: rand() < (right ? k.sureRight : k.sureWrong) ? 'sure' : 'unsure',
      })
    }
    const id = freshestWord(s)
    if (id && k.defend !== 'none' && incomingDamage(s) > 0) {
      const pass = rand() < k.word
      const guard: Action = k.defend === 'write' ? { type: 'resolveWordCard', wordId: id, pass, answer: '' } : { type: 'resolveWordPick', wordId: id, choice: pass ? 0 : 1 }
      if (s.player.block === 0 && incomingDamage(s) >= k.guardAt) acts.unshift(guard)
      else acts.push(guard)
    }
    return acts
  }
}

/** 한 층 전투를 끝까지. 정책이 낸 action 중 생각력이 되는 것만 적용된다 */
export function playBattle(start: GameState, policy: Policy, seed: number): GameState {
  let r = seed >>> 0
  const rand = () => { const [v, next] = nextRandom(r); r = next; return v }
  let s = start
  for (let turn = 0; turn < 40 && s.outcome === 'playing'; turn++) {
    for (let round = 0; round < 6 && s.outcome === 'playing'; round++) {
      for (const a of policy(s, rand)) s = reduce(s, a)
    }
    if (s.outcome === 'playing') s = reduce(s, { type: 'endTurn' })
  }
  return s
}

export interface TowerRun { run: RunState; retries: number; lostAt: number | null }

/** 탑 끝까지. 지면 다시 하기(층마다 maxRetries번까지), 보상은 pick번째를 고른다 */
export function playTower(start: RunState, policy: Policy, ctx: RunContext, seed: number, maxRetries = 0, pick = 0): TowerRun {
  let r = reduceRun(start, { type: 'startFloor' }, ctx)
  let retries = 0
  for (let f = 1; f <= ctx.floors.length; f++) {
    let tries = 0
    for (;;) {
      const battle = playBattle(r.battle!, policy, seed + f * 101 + tries * 7)
      r = { ...r, battle }
      if (battle.outcome === 'won') break
      if (tries >= maxRetries) return { run: r, retries, lostAt: f }
      tries++; retries++
      r = reduceRun(r, { type: 'retryFloor' }, ctx)
    }
    r = reduceRun(r, { type: 'finishFloor' }, ctx)
    if (f < ctx.floors.length) {
      r = reduceRun(r, { type: 'chooseReward', index: Math.min(pick, (r.reward?.offers.length ?? 1) - 1) }, ctx)
      r = reduceRun(r, { type: 'startFloor' }, ctx)
    }
  }
  return { run: r, retries, lostAt: null }
}
