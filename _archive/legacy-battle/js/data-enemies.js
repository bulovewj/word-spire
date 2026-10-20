/* 낱말탑 - 괴물 데이터 12종
 *
 * demands: 턴마다 하나씩 순서대로 제시. 다 쓰면 처음으로 돌아간다.
 *   situation - 괴물이 하는 말이나 상황. 빈칸 없음
 *   ask       - 플레이어에게 던지는 요구 문장
 *   accept    - 이 태그 중 하나라도 겹치면 '통함'(1.0배). data-cards.js의 16종만 사용
 *   bestType  - 종류까지 맞으면 '정타'(1.5배). null이면 종류 무관
 *
 * 새 요구를 추가할 때는 accept를 2태그로 잡을 것. 1태그로 잡으면 손패가 막힌다.
 * (예외: 보스는 1태그 요구를 섞어 압박을 준다)
 */

const ENEMIES = [
  /* ===== 1~5층 (단어 구간) ===== */
  {
    id:"e01", name:"어영부영 게으름뱅이", hp:20, attack:4, tier:1,
    demands:[
      { situation:"숙제? 내일 하지 뭐. 내일도 있고 모레도 있고…",
        ask:"이 모습을 뭐라고 할까?", accept:["게으름","뒤늦음"], bestType:"고유어" },
      { situation:"제출 십 분 전에야 가방을 뒤지기 시작한다.",
        ask:"지금 상황에 어울리는 말은?", accept:["뒤늦음","성급함"], bestType:"관용구" },
      { situation:"하다가 어려우니까 그냥 덮어 버렸다.",
        ask:"이건 어떤 태도일까?", accept:["게으름","곤란"], bestType:null },
    ]
  },
  {
    id:"e02", name:"뻥쟁이 허풍선", hp:24, attack:5, tier:1,
    demands:[
      { situation:"살짝 부딪혔을 뿐인데 죽을 뻔했다고 소문을 낸다.",
        ask:"이렇게 부풀려 말하는 걸 뭐라고 할까?", accept:["교만","거짓"], bestType:"한자어" },
      { situation:"자기 자랑을 한참 늘어놓는데 정작 실력은 별로다.",
        ask:"이런 사람을 뭐라고 할까?", accept:["교만","좁은시야"], bestType:"속담" },
      { situation:"친구 칭찬을 쉬지 않고 한다. 듣다 지칠 정도로.",
        ask:"이 모습에 어울리는 말은?", accept:["교만","인간관계"], bestType:"관용구" },
    ]
  },
  {
    id:"e03", name:"우쭐이", hp:22, attack:5, tier:1,
    demands:[
      { situation:"작년엔 자기도 못했으면서 지금은 친구를 놀린다.",
        ask:"이 모습을 뭐라고 할까?", accept:["교만","뒤늦음"], bestType:"속담" },
      { situation:"자기 반이 최고인 줄 안다. 다른 반은 가 본 적도 없으면서.",
        ask:"이런 사람을 뭐라고 할까?", accept:["좁은시야","교만"], bestType:"속담" },
      { situation:"큰소리치더니 막상 지고 나서 아무 말도 못 한다.",
        ask:"지금 이 사람은 어떻게 됐을까?", accept:["곤란","교만"], bestType:"관용구" },
    ]
  },
  {
    id:"e04", name:"숨바꼭질 두더지", hp:40, attack:7, tier:1, boss:true,
    note:"정보 찾기 보스 — 필요한 단서를 말 속에 묻어 둔다",
    demands:[
      { situation:"\"난 그 일 전혀 모르는데?\" 묻지도 않았는데 먼저 변명한다.",
        ask:"이 사람의 속마음을 짚는 말은?", accept:["거짓","걱정"], bestType:"속담" },
      { situation:"알면서도 끝까지 모르는 척 딴청을 부린다.",
        ask:"이 행동을 뭐라고 할까?", accept:["거짓","곤란"], bestType:"관용구" },
      { situation:"온 집을 뒤졌는데 지우개는 필통 안에 있었다.",
        ask:"이럴 때 쓰는 말은?", accept:["좁은시야","성급함"], bestType:"속담" },
      { situation:"조용히 한 말인데 다음 날 반 전체가 알고 있다.",
        ask:"이 상황이 주는 교훈은?", accept:["소문","조심"], bestType:"속담" },
    ]
  },

  /* ===== 6~10층 (문장 구간) ===== */
  {
    id:"e05", name:"딴소리 앵무", hp:30, attack:7, tier:2,
    demands:[
      { situation:"다들 자기 의견만 외친다. 회의가 산으로 간다.",
        ask:"이 상황을 뭐라고 할까?", accept:["혼란","협동"], bestType:"속담" },
      { situation:"신나게 이야기하는데 한마디로 분위기를 얼려 버린다.",
        ask:"이 행동을 뭐라고 할까?", accept:["혼란","인간관계"], bestType:"관용구" },
      { situation:"사소한 것까지 하나하나 다 캐묻는다.",
        ask:"이 모습에 어울리는 말은?", accept:["소문","혼란"], bestType:"고유어" },
      { situation:"광고만 보면 다 사고 싶어지고, 친구 말이면 다 믿는다.",
        ask:"이런 성격을 뭐라고 할까?", accept:["좁은시야","거짓"], bestType:"관용구" },
    ]
  },
  {
    id:"e06", name:"미루기 달팽이", hp:28, attack:6, tier:2,
    demands:[
      { situation:"다 정해지고 난 뒤에야 손을 들고 의견을 낸다.",
        ask:"이 행동을 뭐라고 할까?", accept:["뒤늦음","게으름"], bestType:"관용구" },
      { situation:"시험이 끝난 다음 날부터 열심히 공부하기 시작한다.",
        ask:"이 상황에 어울리는 말은?", accept:["뒤늦음","결과"], bestType:"속담" },
      { situation:"미리 챙겨 두지 않아 놓고 못 찾는다고 화를 낸다.",
        ask:"이건 누구 탓일까?", accept:["뒤늦음","결과"], bestType:"한자어" },
      { situation:"우산을 챙겨 온 사람만 젖지 않았다.",
        ask:"이 차이를 뭐라고 할까?", accept:["조심","노력"], bestType:"한자어" },
    ]
  },
  {
    id:"e07", name:"싸움닭", hp:34, attack:8, tier:2,
    demands:[
      { situation:"먼저 툭 던진 말 한마디에 서로 언성이 높아졌다.",
        ask:"이럴 때 떠오르는 말은?", accept:["인간관계","혼란"], bestType:"속담" },
      { situation:"친구가 상을 받았는데 축하는커녕 속이 쓰리다.",
        ask:"이 마음을 뭐라고 할까?", accept:["욕심","인간관계"], bestType:"관용구" },
      { situation:"6학년 형한테 겁도 없이 대든다.",
        ask:"이 모습을 뭐라고 할까?", accept:["교만","좁은시야"], bestType:"속담" },
      { situation:"화가 나서 서두르다 문제를 잘못 읽고 틀렸다.",
        ask:"이럴 때 필요한 말은?", accept:["조심","성급함"], bestType:"속담" },
    ]
  },
  {
    id:"e08", name:"꽈배기 뱀", hp:55, attack:10, tier:2, boss:true,
    note:"이해하기 보스 — 말은 맞는데 뜻이 반대인 상황을 던진다",
    demands:[
      { situation:"양은 똑같은데 아침에 셋, 저녁에 넷이라며 생색을 낸다.",
        ask:"이 속임수를 뭐라고 할까?", accept:["거짓"], bestType:"한자어" },
      { situation:"\"다 너 생각해서 하는 말이야\"라며 계속 잔소리를 한다.",
        ask:"이 말의 실제 속뜻에 가까운 것은?", accept:["소문","혼란"], bestType:"고유어" },
      { situation:"뽑히지도 않았는데 벌써 상 받는 상상을 한다.",
        ask:"이 모습을 뭐라고 할까?", accept:["성급함","욕심"], bestType:"관용구" },
      { situation:"열심히 하는 건 좋은데 몸이 상할 만큼 한다.",
        ask:"여기에 필요한 말은?", accept:["욕심","조심"], bestType:"한자어" },
      { situation:"늦잠을 잤는데 버스까지 놓쳤다.",
        ask:"이 상황을 뭐라고 할까?", accept:["곤란","결과"], bestType:"한자어" },
    ]
  },

  /* ===== 11~15층 (배경지식 구간) ===== */
  {
    id:"e09", name:"헛소문 까마귀", hp:38, attack:9, tier:3,
    demands:[
      { situation:"한 명에게만 말했는데 하루 만에 학년 전체가 알고 있다.",
        ask:"이 일을 뭐라고 할까?", accept:["소문","조심"], bestType:"속담" },
      { situation:"\"그냥 지어낸 말은 아닐걸? 뭔가 있으니까 돌겠지.\"",
        ask:"이 주장에 어울리는 말은?", accept:["소문","결과"], bestType:"속담" },
      { situation:"아무도 없다고 생각하고 험담을 했다.",
        ask:"여기서 새겨야 할 말은?", accept:["조심","걱정"], bestType:"속담" },
      { situation:"이 말 저 말 옮기다 보니 처음 이야기와 완전히 달라졌다.",
        ask:"이 상황을 뭐라고 할까?", accept:["소문","혼란"], bestType:"고유어" },
    ]
  },
  {
    id:"e10", name:"낚시광고 문어", hp:40, attack:10, tier:3,
    demands:[
      { situation:"\"이것만 사면 성적이 오릅니다!\" 진열장 앞에서 마음이 흔들린다.",
        ask:"이 마음을 뭐라고 할까?", accept:["욕심","거짓"], bestType:"한자어" },
      { situation:"공짜라더니 실제로는 조건이 잔뜩 붙어 있었다.",
        ask:"이 수법을 뭐라고 할까?", accept:["거짓","곤란"], bestType:"한자어" },
      { situation:"남의 것이 항상 더 좋아 보여 자꾸 비교하게 된다.",
        ask:"이 마음에 어울리는 말은?", accept:["욕심","인간관계"], bestType:"속담" },
      { situation:"좋은 것만 고르다 결국 아무것도 못 골랐다.",
        ask:"이런 성격을 뭐라고 할까?", accept:["욕심","좁은시야"], bestType:"관용구" },
    ]
  },
  {
    id:"e11", name:"혼자대장", hp:42, attack:10, tier:3,
    demands:[
      { situation:"\"내가 다 할게. 너희는 가만있어.\" 결국 혼자 지쳐 버렸다.",
        ask:"이 사람이 몰랐던 것은?", accept:["협동","노력"], bestType:"속담" },
      { situation:"모둠이 모여 앉아 같이 답을 찾아 나간다.",
        ask:"이 모습을 뭐라고 할까?", accept:["협동","인간관계"], bestType:"관용구" },
      { situation:"6년을 같은 반에서 웃고 울며 지냈다.",
        ask:"이 사이를 뭐라고 할까?", accept:["협동","곤란"], bestType:"한자어" },
      { situation:"맡은 일이 커지자 밤에 잠이 안 온다.",
        ask:"이 기분을 뭐라고 할까?", accept:["걱정","노력"], bestType:"관용구" },
    ]
  },
  {
    id:"e12", name:"그럴싸 여우", hp:70, attack:12, tier:3, boss:true,
    note:"평가와 성찰 보스 — 그럴듯하지만 따져 봐야 하는 주장을 던진다",
    demands:[
      { situation:"\"우리 반이 제일 잘한대. 다른 반은 볼 것도 없어.\"",
        ask:"이 주장의 문제를 짚는 말은?", accept:["좁은시야","교만"], bestType:"속담" },
      { situation:"\"실력은 타고나는 거야. 늦게 시작하면 소용없어.\"",
        ask:"이 말을 반박할 수 있는 말은?", accept:["노력"], bestType:"한자어" },
      { situation:"\"조금씩 해 봐야 티도 안 나잖아.\"",
        ask:"이 말이 틀린 이유를 담은 말은?", accept:["노력","결과"], bestType:"속담" },
      { situation:"\"한 명이 사고 쳤으니 그 반은 다 그런 애들이야.\"",
        ask:"이 상황을 정확히 짚는 말은?", accept:["곤란"], bestType:"속담" },
      { situation:"\"화려하게 떠드는 쪽이 실력 있는 거 아니야?\"",
        ask:"여기에 맞서는 말은?", accept:["교만","거짓"], bestType:"속담" },
      { situation:"몇 년을 정성껏 쌓아 온 일을 앞두고 불안해한다.",
        ask:"이 사람에게 건넬 말은?", accept:["노력","걱정"], bestType:"속담" },
    ]
  },
];
