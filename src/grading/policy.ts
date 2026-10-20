// 채점 기준값은 전부 여기 (작업지시서 2장). 실제 학생 답으로 점검 화면(?dev=grading)에서 조정한다.

export const POLICY = {
  model: 'Xenova/multilingual-e5-small',
  dtype: 'q8',
  inputPrefix: 'query: ',        // e5는 이 접두어가 없으면 성능이 떨어진다

  // 낱말 뜻 사전 검사
  giveUpPrefixes: ['모르겠', '몰라', '모름', '잘 모르', '글쎄', 'ㅁㄹ', 'ㅇㅇ', '아무거나', '???'],
  minAnswerLength: 2,            // 공백 뺀 글자 수
  copyExtraChars: 2,             // 낱말 + 이 글자 수 이내로만 더 쓰면 베낀 것

  // 낱말 뜻 의미 채점
  wordOwnMin: 0.88,              // 이 낱말 뜻과의 유사도 기준
  wordOtherMargin: 0,            // own - other 가 이보다 작으면 다른 낱말과 헷갈린 것

  // 간이 채점 (모델 로딩 중·실패)
  simpleUnigramWeight: 0.4,
  simpleBigramWeight: 0.6,
  simpleWordMin: 0.42,

  // 요약 (작업지시서 2-2). summaryOwnMin 0.86 유지(사용자 확정 2026-10-20). 의미 점수는 맞는/틀린 요약이 겹쳐서
  // 실제 거름망은 핵심 개념. 억울한 답이 나오면 기준값이 아니라 글 데이터의 개념 동의어를 넓힌다
  summaryMinLength: 10,          // 공백 뺀 글자 수
  summaryMaxLength: 60,
  summaryOwnMin: 0.86,

  // 뜻 가까움 미터 표시 범위 [0%, 100%]
  meterSemantic: [0.75, 0.95],
  meterSimple: [0, 0.8],
} as const
