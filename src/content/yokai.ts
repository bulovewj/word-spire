// 요괴 삼총사의 성격과 전투 중 한마디 (docs/스토리.md 4장 + docs/개편-기록.md 1장)
// 글의 적(Enemy.sprite)과 같은 id로 찾는다. 대사는 낱말 뜻·정답의 단서가 되면 안 된다(기획안 6-6)

export interface YokaiLines {
  hit: string[]          // 정타를 맞았을 때
  weak: string[]         // 약타(답만 맞음)
  miss: string[]         // 내가 틀렸을 때
  attack: string[]       // 요괴가 공격할 때
  blocked: string[]      // 공격이 다 막혔을 때
  low: string[]          // 요약 봉인이 열렸을 때 (기운이 빠짐)
  fog: string[]          // 안개가 걷혔을 때
}

export interface Yokai {
  id: string
  name: string
  nick: string           // 도감의 별명
  profile: string        // 도감의 소개
  lines: YokaiLines
}

export const yokai: Yokai[] = [
  {
    id: 'dokkaebi', name: '먹안개 도깨비', nick: '안개 장난꾸러기',
    profile: '낱말을 먹빛 안개로 흐려 놓고 숨어서 킥킥거려. 단서를 찾아 뜻을 밝히면 금세 풀이 죽어.',
    lines: {
      hit: ['아야! 안개가 찢어졌잖아!', '어, 어떻게 찾았지?!', '으앗, 제대로 읽었네!'],
      weak: ['에이, 반만 맞았지롱!', '근거가 흐릿한걸?'],
      miss: ['히히, 안개 속에서 헤매네!', '메롱, 틀렸지롱!'],
      attack: ['안개 맛 좀 봐라!', '후우우~ 먹안개다!'],
      blocked: ['어라? 안 통하네?', '낱말로 막다니, 치사해!'],
      low: ['어, 어… 안개가 얇아지고 있어!'],
      fog: ['내 안개가 걷히다니!'],
    },
  },
  {
    id: 'tiger', name: '뒤섞는 호랑이', nick: '큰소리 대장',
    profile: '글의 앞뒤를 뒤섞어 길을 헷갈리게 해. 큰소리를 치지만, 문장과 문장을 이어 보이면 꼬리를 내려.',
    lines: {
      hit: ['크흥! 제법인데?', '어흥… 방금 건 좀 아팠다.', '길을 찾아내다니!'],
      weak: ['흥, 절반짜리로구나.', '근거가 엉켰는걸?'],
      miss: ['어흥! 길을 잃었구나!', '뒤섞인 글에 속았지?'],
      attack: ['어흥! 받아라!', '이 몸의 차례다!'],
      blocked: ['뭣이? 막았다고?', '큼큼, 봐준 거다.'],
      low: ['이, 이 몸이 밀리다니…'],
      fog: ['안개 뒤에 숨은 게 아니라니까!'],
    },
  },
  {
    id: 'fox', name: '헛소문 여우', nick: '소문 우두머리',
    profile: '참말 조각에 거짓을 보태 소문을 퍼뜨리는 삼총사의 우두머리. 근거를 댄 반박 앞에서는 꼼짝 못 해.',
    lines: {
      hit: ['흥, 운이 좋았어.', '제법 꼼꼼히 읽는구나.', '그 문장을 찾아내다니…'],
      weak: ['호호, 근거가 모자라.', '반쪽짜리 답이네?'],
      miss: ['호호, 내 말이 더 그럴듯하지?', '소문에 넘어갔구나!'],
      attack: ['소문은 발이 빠르단다!', '쉿, 다들 이미 믿고 있어.'],
      blocked: ['어머, 안 속네?', '흥, 단단하구나.'],
      low: ['그, 그만! 소문이 다 풀리잖아!'],
      fog: ['안개 없이도 난 강하다고!'],
    },
  },
]

export function findYokai(id: string): Yokai | undefined {
  return yokai.find((y) => y.id === id)
}
