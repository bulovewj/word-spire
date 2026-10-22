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
  content/   types.ts, validate.ts, index.ts(콘텐츠 모음·findWord), story.ts(주인공 '나'·공통 문구), words/(낱말 팩), passages/(글), towers/(탑 문구)
  engine/    balance.ts(숫자), judge.ts(판정), state.ts(GameState·reduce), battle.ts(턴 단계), support.ts(안개 걷기·단서 보기), run.ts(탑 진행 RunState), rng.ts — React·DOM 의존 금지
  grading/   embed.worker.ts, embedder.ts, cosine.ts, policy.ts(기준값), word.ts, summary.ts
  storage/   store.ts
  ui/        App.tsx(게임 상태를 여기 한곳에), screens/, components/, sprites/, eventText.ts(사건 → 문구)
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
- (v2 요약 실측, 2026-10-20) 요약도 의미 점수만으로는 못 거른다: 맞는 요약 0.93~0.98, 반대·세부만 쓴 요약 0.93~0.95로 겹침 → `summaryOwnMin` 조정으로는 해결 안 됨. 실제 거름망은 **핵심 개념(동의어 묶음)**. 학생 답이 억울하게 떨어지면 개념 동의어를 넓히고, 반대 결론 앵커는 문장 겉모양이 비슷한 것만 막으니 신중히.

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
| M5 | 의미 채점기 + 낱말 카드 | ✅ |
| M6 | 요약 봉인 | ✅ |
| M7 | 안개 걷기 + 단서 보기 | ✅ |
| M8 | 탑 3층 + 저장 | 🔄 |
| M9 | 기록·스탯·결과 코드 | ✅ |
| M10 | 교사 화면 | ✅ |
| M11 | 도트 디자인 | ✅ (실기기 확인 남음) |
| M12 | 정리·배포 | ⬜ |

### 다음 세션 메모
- Codex 스토리·디자인(왕명과 닫힌궁, 한국풍) main 병합 완료(2026-10-21). 적 이름·sprite id(dokkaebi·tiger·fox)·대사·탑 문구 데이터 연결함. 다시 맡길 땐 `docs/codex-요청.md`에 요청 추가 → Codex가 `git merge main` 후 처리.
- M11 주의: `src/ui/sprites/`의 PNG는 v1 초안(drought·bloomgap·erasure)이라 새 id와 안 맞음 → 새 게임용 시트 필요. 한국풍 컨셉 PNG(reader·부적패·봉인 도구)는 RGBA지만 완전 불투명 픽셀이 0개(어두운 번짐이 반투명으로 구워짐) → 컨셉 참고용, 스프라이트로 못 씀.
- M8 남은 것: Codex 요청 3(2·3층 근거 범위·정답 보기 바꿔 쓰기) 병합 → `npm test`의 시뮬레이션이 그대로 통과하는지 확인 → 사용자 사실 검수 → M8 ✅. 그 뒤 M9(기록·스탯·결과 코드). Codex 작업 중에는 `bee-2·3.ts`, `docs/스토리.md`를 건드리지 않는다.
- M9 기준(2026-10-21 사용자 확정): 정답 = 정타만(약타는 틀림으로 셈). 첫 시도 = 같은 진행·같은 층 안에서 그 대상을 처음 푼 것(층 다시 하기도 첫 시도 아님, 새 탑 시작이면 다시 첫 시도). 단서 보기로 푼 건 정답률에서 빼고 '도움받아 해결'로 셈. 약점 = 표본 5개 이상인 영역이 둘 이상일 때 최저. 결과 코드는 브라우저 내장 CompressionStream(deflate-raw) + base64url, 앞머리 `NT1-`.
- Codex [요청6] 열림(시작 화면을 main에 맞추기·타이틀 이미지 400KB 이하·호랑이 얼굴). story의 4da42e7은 사용자가 시험으로 맡긴 시작 화면 작업 → [요청6] 처리 뒤 합칠 것.
- Codex [요청4] 병합·검사 완료(2026-10-21): `src/ui/sprites/` 9장 모두 크기·프레임 수·알파 0/255·frames.json 일치, 바닥선 정렬. M11 연결 때 손볼 것: card-frame 네 귀 장식이 영문자(pl·Jq·br·1d)처럼 읽힘, 호랑이 얼굴 줄무늬가 눈을 가려 표정이 흐림, 16px 아이콘 중 생각력(마패)·약타는 글자와 함께 써야 읽힘. 옛 v1은 docs/design/concept/v1-sprites/.
- 2026-10-21 플레이테스트 반영(사용자 결정): ① 낱말은 뽑지 않고 '내 낱말 묶음'에서 골라 방어, 낱말마다 탑당 2번(맞든 틀리든 -1, 새 낱말은 가득) ② 틀린 질문은 바로 정답·근거 공개, '다시 보기' 삭제 ③ 내 체력 30·층 사이 회복 8 → 다 맞히고 방어하면 22/30, 공격만 하면 3층에서 짐. 부작용: 무작위 클릭 1층 승률 8%→18%(요약이 일찍 열림), 시뮬 기준 20% 미만으로 완화.
- 헛소문 반박 구현(2026-10-21, 3층 시험, 작업지시서 F11): `engine/rumor.ts`, `RumorPanel`. 실측: 소문 동의 답 통과 0, 바른 반박 억울한 탈락 2/27 → 의미 점수로는 동의/반박을 완전히 못 가름(요약과 같은 한계). 탈락 사례가 모이면 모범 반박을 넓힐 것. 1·2층 후보는 docs/codex-요청.md [요청5] 처리 결과. 시뮬: 다 맞히고 방어 16/30(3층 소문 때문에 22→16).
- M11 구현(2026-10-22): `ui/components/Sprite.tsx`(시트 한 칸·정수 배율·움직임 줄이기 시 once는 마지막 칸), `ui/usePoses.ts`(사건 → 700ms 포즈). card-frame.png는 귀퉁이가 글자처럼 읽혀 안 쓰고 CSS 종이 테두리로. 안개 걷힘은 사건 줄 문구로만(조각 연출 없음). 남은 아트 과제: 호랑이 얼굴 줄무늬. 실기기(웨일북·아이폰) 확인은 사용자.
- 디자인 피드백은 CODING_PLAN M11에 모아 둠. 디자인은 M11 전까지 손대지 않는다.
- 실행 엔진 wasm은 `onnxruntime-web` 일반판을 앱에 묶어 씀(CDN 요청 없음, jsdelivr 차단 상태로 확인). 빌드에 안 쓰는 asyncify wasm(27MB)도 같이 나옴 → M12에서 정리.
- 브라우저 점검 스크립트로 버튼 누를 때 본문 문장에 같은 글자가 있으면 오클릭한다("계속", "농약…"). 셀렉터로 범위를 좁힐 것.
- 가정값(사용자 플레이테스트 후 조정): 낱말 붙이기 +4 규칙, 다시 보기 절반은 약타 절반 다음에 적용, 채점 비교 대상 낱말 범위.
- `GameState.passage`에 글 데이터를 통째로 넣어 둠. M8 저장 때 id로 바꿀지 결정.

## 참조
상세 명세는 `docs/작업지시서.md`, 마일스톤 상세는 `CODING_PLAN.md`. 필요할 때만 읽을 것.
다른 에이전트용 안내는 `AGENTS.md`, 협업 방식은 `docs/협업-가이드.md`.
