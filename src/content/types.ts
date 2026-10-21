// 콘텐츠 데이터 형식 (작업지시서 1-1, 1-2)

export type WordKind = '관용구' | '속담' | '한자어' | '교과어' | '기타'

export interface WordEntry {
  id: string
  word: string
  kind: WordKind
  meaning: string          // 대표 뜻. 틀렸을 때 보여 줌
  accepts: string[]        // 같은 뜻 다른 표현 2~3개
  rejects: string[]        // 반대 뜻 1개 + 글자 그대로 오해 1개
  example?: string         // 예문 (낱말 자리를 ○○○로 가려 힌트로 씀)
}

export type QuestionType = 'literal' | 'connect' | 'author'   // 거기 있음 / 연결 / 글쓴이와 나

export interface Enemy {
  name: string
  sprite: string
  maxHp: number
  pattern: number[]        // 턴별 공격값, 반복
  introLine: string        // 층에 들어설 때 한 줄 (낱말 뜻·정답의 단서 금지)
  sealLine: string         // 봉인될 때 한 줄
}

/** 탑 = 화제 하나, 3층. 이야기 문구는 짧게(기획안 6-6) */
export interface Tower {
  id: string
  title: string
  intro: string[]          // 탑에 들어갈 때 2줄
  outro: string[]          // 3층 봉인 뒤 2줄
}

export interface LockedWord {
  word: string             // 문장 안에 그대로 있는 문자열
  sentence: number         // 이 낱말이 있는 문장 index
  clues: number[]          // 정답 단서 문장 index (하나만 골라도 성공)
  card: WordEntry          // 성공 시 덱에 들어갈 낱말 카드
}

/**
 * 근거 판정(기획안 7장): 정확히 count개를 고르고, required 후보 중 하나를 다 포함하고,
 * 고른 문장이 모두 관련 문장(required 전체 + allowed) 안에 있으면 근거 정답
 */
export interface Evidence {
  count: number            // 학생이 고를 문장 수. 화면에 "N개를 골라 봐"로 안내
  required: number[][]     // 꼭 들어가야 할 문장 묶음 후보. 하나만 만족하면 된다
  allowed?: number[]       // 함께 골라도 되는 문장
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  options: string[]        // 4개
  answer: number           // options index
  evidence: Evidence
  bonusWords?: string[]    // author 전용. 이 낱말 카드를 붙이면 +4
}

/** 적이 퍼뜨리는 헛소문. 본문에는 넣지 않고 적의 말·카드로만 보인다. 학생은 근거를 고르고 반박을 쓴다 */
export interface Rumor {
  claim: string            // 소문 한 문장 (반말, 적의 말투)
  evidence: Evidence       // 반박 근거 문장 (질문과 같은 판정)
  rebuttal: SummarySpec    // 반박 글 채점: models=모범 반박, concepts=꼭 들어갈 생각, rejects=소문에 동의하는 답
}

export interface SummarySpec {
  models: string[]         // 모범 요약 3~5개
  concepts: string[][]     // 핵심 개념. 각 배열은 동의어 묶음
  minConcepts: number
  conceptLabels: string[]  // 빠졌을 때 보여 줄 말. concepts와 같은 순서
  rejects: string[]        // 오답 요약 앵커
}

export interface Passage {
  id: string
  towerId: string
  floor: 1 | 2 | 3
  title: string
  enemy: Enemy
  sentences: string[]      // 화면 번호는 1부터, 데이터 index는 0부터
  lockedWords: LockedWord[]
  questions: Question[]
  summary: SummarySpec
  rumor?: Rumor            // 헛소문 반박 (시험 중: 3층부터)
}
