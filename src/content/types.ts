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
}

export interface LockedWord {
  word: string             // 문장 안에 그대로 있는 문자열
  sentence: number         // 이 낱말이 있는 문장 index
  clues: number[]          // 정답 단서 문장 index (하나만 골라도 성공)
  card: WordEntry          // 성공 시 덱에 들어갈 낱말 카드
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  options: string[]        // 4개
  answer: number           // options index
  evidence: number[][]     // 허용 근거 조합
  bonusWords?: string[]    // author 전용. 이 낱말 카드를 붙이면 +4
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
}
