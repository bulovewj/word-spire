# 낱말탑 v2

초등 5~6학년을 위한 문해력 카드 전투 게임입니다. 꿀벌·한글 두 탑, 모두 6개 층을 제공합니다. 한 층은 5~10분입니다.

게임 주소: https://bulovewj.github.io/word-spire/

## 실행

Node.js 24에서 실행합니다.

```sh
npm ci --ignore-scripts
npm run dev
npm test
npm run build
npm run preview
```

## 게임 규칙

답과 근거를 함께 맞히면 정타입니다. 확실하다고 답하면 정타 피해가 커지지만 틀리면 다음 공격이 강해집니다. 낱말 뜻 고르기는 방어 5, 뜻 쓰기는 방어 8입니다. 낱말마다 탑에서 2번 사용할 수 있습니다. 마지막에는 한 문장 요약으로 요괴를 봉인합니다.

층마다 체력이 회복되고, 패배 후 다시 도전하면 요괴 공격이 약해집니다. 층 보상에서는 보물이나 새 낱말을 고릅니다. 별·왕명 인장·모은 낱말은 부적첩과 기록에 남습니다.

## 데이터와 채점

- `src/content/passages/`: 글·질문·근거·요약·반박 기준. 새 글은 `content/index.ts`에 등록합니다.
- `src/content/words/`: 낱말의 뜻·동의 표현·오답 표현.
- `src/content/validate.ts`: 데이터 검사. 탑마다 1~3층을 작성하고 `npm test`로 확인합니다.
- `src/engine/`: 순수 게임 규칙. 숫자는 `balance.ts`에 모읍니다.
- `src/grading/`: 브라우저 워커의 의미 채점. 기준값은 `policy.ts`, 점검 화면은 `?dev=grading`입니다.
- `src/storage/`: 기기 안 저장. 학생 답을 서버로 전송하지 않습니다.
- `src/ui/`: 화면과 연출. 기존 그림을 유지합니다.

의미 모델은 첫 실행 때 내려받습니다. 준비되지 않으면 간이 채점으로 진행합니다. 간이 반박은 근거가 맞아도 약타까지이며, 자동 채점은 표현에 따라 오판할 수 있습니다. 실제 학생 답과 수업 난도 검수는 계속 필요합니다.

## 배포와 문서

`.github/workflows/pages.yml`은 `main` 또는 `codex/finish-release`에 푸시하면 테스트·빌드 후 GitHub Pages에 배포합니다. 배포 대상은 `dist`만입니다. 저장소 설정의 Pages 소스는 GitHub Actions입니다.

- [교사 안내서](docs/교사-안내서.md)
- [원 기획안](docs/기획안.md), [개편 규칙](docs/개편-기록.md)
- [데이터·구현 명세](docs/작업지시서.md)
- [프로젝트 규칙](CLAUDE.md), [협업 규칙](AGENTS.md)
- [디자인 검토본](검토/00-최종검토.html)

단잠 탑·추가 이펙트·저학년 팩은 후속 과제입니다. `_archive/`는 빌드 대상이 아닙니다.
