# 낱말탑 (word-spire v2)

## 개요
초등 문해력 카드 전투 웹 게임. 글을 읽고 근거를 대며 질문에 답하면 공격, 낱말 뜻을 쓰면 방어, 한 문장 요약으로 적을 마무리한다.
수업 자투리 시간용(한 층 5~10분). 학생 기기에서만 돌고 서버·계정 없음.
규칙 기준 `docs/기획안.md` 6장 · 구현 명세 `docs/작업지시서.md` · 마일스톤 `CODING_PLAN.md`

## 기술 스택 (바꾸지 않는다)
- Vite + React + TypeScript: 의미 모델 워커를 묶으려면 빌드 도구가 필요해서. 상태는 useState + 엔진 `reduce`
- Vitest: 게임 규칙·채점 정책 테스트
- @huggingface/transformers: Web Worker에서 `Xenova/multilingual-e5-small`(q8, 입력 앞에 `query: `) 문장 임베딩
- localStorage: `storage/store.ts` 안에서만 접근
- Galmuri 픽셀 폰트(OFL)
- 설치는 `npm install --ignore-scripts`

## 폴더 구조
```
src/
  content/   types.ts, validate.ts, words/(낱말 팩), passages/(글)
  engine/    balance.ts(숫자), judge.ts(판정), state.ts(reduce), rng.ts — React·DOM 의존 금지
  grading/   embed.worker.ts, embedder.ts, cosine.ts, policy.ts(기준값), word.ts, summary.ts
  storage/   store.ts
  ui/        screens/, components/, sprites/
  styles/    tokens.css
docs/        기획안.md(읽기 전용), 작업지시서.md
references/  문해력 근거 자료(기획안 4장)
_archive/    옛 게임 코드·원화. 참고·빌드 대상 아님
```

## 코딩 컨벤션
- 파일 200줄 초과 금지. 넘으면 나눈다.
- 컴포넌트는 상태를 직접 바꾸지 않고 엔진 action만 보낸다.
- 새 게임 규칙 = `reduce`의 새 action + 테스트 1개 이상.
- 난수는 `GameState.rng`만(Math.random 금지).
- `GameState` 모양을 바꾸면 `STATE_VERSION` 올리기.
- 게임 숫자는 `engine/balance.ts`, 채점 기준값은 `grading/policy.ts` 한곳에만.
- 이름: 컴포넌트 PascalCase, 함수·변수 camelCase, 파일은 컴포넌트면 PascalCase.tsx, 나머지 camelCase.ts. 예외: 글·낱말 데이터 파일은 id와 같은 kebab-case(`bee-1.ts`, `pack-5-6.ts`).
- UI 문구는 한국어. 학생 화면 반말, 교사 화면 존댓말.
- 커밋: `M[번호]: 한 줄 요약`

## 채점에서 이미 알아낸 것 (v1 실측, 다시 실험하지 말 것)
- 짧은 한국어 문장은 내용이 달라도 코사인 유사도 0.8~0.95. **절대 기준 하나로 판정 금지.**
- 문장 임베딩은 반대말을 비슷하게 본다 → 반대 뜻 앵커(rejects) 필수.
- paraphrase-multilingual-MiniLM은 정확도 80%, e5-small은 96~98%. e5는 `query: ` 접두어 없으면 성능이 떨어진다.

## 하지 말 것
- 새 라이브러리 설치 전 반드시 물어볼 것
- any 타입 금지
- 지시받지 않은 파일 수정 금지
- 학생 답·기록을 기기 밖으로 보내는 코드 금지. 실행 중 생성형 AI 호출 금지
- 슬레이 더 스파이어의 이름·카드명·그림 사용 금지(형식만 빌림)
- 질문 제출 전에 정답을 암시하는 UI 금지
- 기획안과 다르게 구현해야 할 것 같으면 구현하지 말고 먼저 물어볼 것

## 현재 상태
| 마일스톤 | 내용 | 상태 |
|---|---|---|
| M1 | 빈 앱 | ✅ |
| M2 | 데이터와 본문 화면 | ✅ |
| M3 | 질문 판정 엔진 | ✅ |
| M4 | 전투 루프 | ✅ |
| M5 | 의미 채점기 + 낱말 카드 | ⬜ |
| M6 | 요약 봉인 | ⬜ |
| M7 | 안개 걷기 + 단서 보기 | ⬜ |
| M8 | 탑 3층 + 저장 | ⬜ |
| M9 | 기록·스탯·결과 코드 | ⬜ |
| M10 | 교사 화면 | ⬜ |
| M11 | 도트 디자인 | ⬜ |
| M12 | 정리·배포 | ⬜ |

### 다음 세션 메모
- Codex가 `story` 브랜치(`../word-spire-story`)에서 스토리·bee-2/3 글 작업 중. 그동안 `docs/스토리*.md`, `passages/bee-2·3.ts`는 건드리지 않는다. 병합 절차는 `docs/협업-가이드.md`.
- M5부터. `@huggingface/transformers` 4.x 설치 완료(사용자 허락함).
- 전투 상태는 `engine/state.ts`(타입·reduce) + `engine/battle.ts`(턴 단계). 보기 순서는 전투 시작 때 rng로 섞어 `optionOrder`에 둔다(데이터 정답이 늘 ①이라서).
- 가정값(사용자 플레이테스트 후 조정): 낱말 붙이기 +4 규칙, 다시 보기 절반은 약타 절반 다음에 적용, 채점 비교 대상 낱말 범위.
- `GameState.passage`에 글 데이터를 통째로 넣어 둠. M8 저장 때 id로 바꿀지 결정.

## 참조
상세 명세는 `docs/작업지시서.md`, 마일스톤 상세는 `CODING_PLAN.md`. 필요할 때만 읽을 것.
다른 에이전트용 안내는 `AGENTS.md`, 협업 방식은 `docs/협업-가이드.md`.
