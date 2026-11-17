// 주인공·공통 문구 (docs/스토리.md 1~3장 + docs/개편-기록.md 1장). 주인공은 이름 없이 '나'
// 이야기는 짧게: 읽는 시간은 본문 글에 쓴다(기획안 6-6). 문구는 낱말 뜻·정답의 단서가 되면 안 된다

/** 처음 시작할 때 보는 이야기 한 장면. art는 화면이 고르는 그림 */
export interface StoryScene {
  art: 'trio' | 'hero' | 'gourd'
  lines: string[]
}

export const STORY = {
  playerName: '나',
  world: '왕명과 닫힌궁',
  sealed: '봉인했어!',
  defeatTitle: '쓰러졌어…',
  defeatLine: '괜찮아, 글은 그대로 있어. 이 층부터 다시 도전해 봐.',
  prologue: [
    { art: 'trio', lines: ['어느 날부터 사람들이 글을 읽어도 뜻을 놓치기 시작했어.', '요괴 삼총사가 낱말을 흐리고, 글을 뒤섞고, 헛소문을 퍼뜨렸거든.'] },
    { art: 'hero', lines: ['임금님은 글과 도술을 함께 익힌 너에게 마패를 내렸어.', '“닫힌궁에 들어가 요괴가 가린 글을 되찾아라.”'] },
    { art: 'gourd', lines: ['글을 읽고 근거를 찾으면 요괴의 힘이 약해져.', '마지막엔 글을 한 문장으로 묶어 호리병에 봉인하는 거야!'] },
  ] satisfies StoryScene[],
  /** 모든 탑에 왕명 인장을 찍었을 때 */
  epilogue: ['되찾은 글이 모두 마을로 돌아갔어.', '이제 사람들은 소문을 그대로 옮기지 않고, 글의 근거를 서로 이야기해.'],
} as const
