# AGENTS.md — 낱말탑 (word-spire v2)

이 파일은 Codex 같은 다른 코딩 에이전트용 안내다. 프로젝트 전체 규칙의 원본은 `CLAUDE.md`이고, 둘이 다르면 `CLAUDE.md`가 우선이다.

## 프로젝트 한 줄
초등 5~6학년 문해력 카드 전투 웹 게임. 글을 읽고 근거를 대며 질문에 답하면 공격, 낱말 뜻을 쓰면 방어, 한 문장 요약으로 적을 봉인한다. 한 층 5~10분, 학생 기기에서만 돈다(서버·계정 없음).

## 먼저 읽을 것 (이 순서로)
1. `CLAUDE.md` — 규칙, 폴더 구조, 하지 말 것
2. `docs/기획안.md` — 무엇을 만드는가 (게임 규칙은 6장). **읽기 전용, 수정 금지**
3. `docs/작업지시서.md` 1장 — 데이터 형식(`WordEntry`, `Passage`)
4. 맡은 일의 작업지시서 (스토리 담당이면 `docs/스토리-작업지시서.md`)
5. **`docs/codex-요청.md` — Claude Code가 남긴 요청. 작업 시작 때 `git merge main` 후 "열림" 요청부터 처리한다.**

## 역할과 쓸 수 있는 곳

| 역할 | 일하는 폴더·브랜치 | 고쳐도 되는 파일 | 고치면 안 되는 파일 |
|---|---|---|---|
| Claude Code (개발) | `word-spire/` · `main` | 전부 (CLAUDE.md 규칙 안에서) | — |
| Codex (스토리·글 데이터) | `word-spire-story/` · `story` | `docs/스토리.md`, `docs/codex-요청.md`의 "처리 결과" 칸, `docs/스토리-작업지시서.md`의 "질문과 답" 칸, `src/content/passages/bee-2.ts`, `src/content/passages/bee-3.ts`, `src/content/index.ts`의 `passages` 배열 한 줄 | 그 밖의 전부. 특히 `src/engine/`, `src/ui/`, `src/grading/`, `src/content/types.ts`, `src/content/validate.ts`, `CLAUDE.md`, `CODING_PLAN.md`, `docs/기획안.md`, `docs/작업지시서.md` |

데이터 형식을 바꿔야 할 것 같으면 **코드를 고치지 말고** `docs/스토리.md`의 "데이터 칸 제안"에 적는다. 반영은 사용자 승인 뒤 Claude Code가 한다.

## 명령
```sh
npm install --ignore-scripts   # 처음 한 번 (scripts 실행 금지)
npm test                       # 데이터 검사 포함. 커밋 전 반드시 통과
npm run build                  # 타입 검사 + 빌드
```

## 꼭 지킬 것
- 새 라이브러리 설치 금지(필요하면 사용자에게 묻기). `any` 금지.
- 슬레이 더 스파이어의 이름·카드명·그림 사용 금지(형식만 빌림).
- 학생 화면 문구는 반말, 교사 화면은 존댓말. 초등 5~6학년 어휘.
- 본문 글은 확인 가능한 사실만. 이야기용 허구를 정보글에 섞지 않는다.
- 실행 중 생성형 AI 호출 금지. 대사·글은 전부 미리 써 둔 데이터다.
- 질문 제출 전에 정답을 암시하는 문구 금지(보기 길이·말투로 정답이 티 나지 않게).
- 커밋 메시지: `M8: 한 줄 요약` (스토리·글 작업은 M8 준비 작업이다). 맡은 브랜치에만 커밋한다. `main`에 직접 커밋·병합하지 않는다.
- 끝나면 무엇을 했는지, 사용자가 확인할 것(사실 검수가 필요한 문장 등)을 짧게 남긴다.
