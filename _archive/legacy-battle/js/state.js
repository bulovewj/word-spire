// 런 상태 객체 + 셔플/드로우. localStorage 저장은 M5에서 채운다.

const SAVE_KEY = "wordSpireSave";
const BEST_FLOOR_KEY = "wordSpireBestFloor";

const gameState = {
  isDemo: false,   // 체험 전투는 진행·최고 기록을 저장하지 않는다
  focus: 30,        // 집중력 (체력)
  thought: 3,       // 생각 (에너지)
  block: 0,         // 방어막. 다음 괴물 공격에서 이만큼 깎는다
  bonusThought: 0,  // energy1 효과로 예약된 다음 턴 생각
  deckList: [],     // 이번 런에서 소유한 카드 전체 (보상으로 늘어난다)
  deck: [],         // 이번 전투에서 아직 안 뽑은 카드
  hand: [],         // 손에 든 카드
  discard: [],      // 버린 카드
  floor: 1,         // 현재 층
  mapNodes: []      // 층별 노드 종류 (map.js가 생성)
};

// Fisher-Yates 셔플. 원본 배열을 섞어서 그대로 반환한다.
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 런 시작: 집중력과 소유 카드(시작덱)를 초기화한다. 전투 준비는 startBattle이 한다.
function initGame() {
  gameState.isDemo = false;
  gameState.focus = 30;
  gameState.deckList = CARDS.filter((card) => card.start).slice();
}

// 전투 시작 전: deckList를 섞어 뽑을 덱으로 만들고 손패 5장을 뽑는다.
function resetBattlePiles() {
  gameState.hand = [];
  gameState.discard = [];
  gameState.thought = 3;
  gameState.deck = shuffleArray(gameState.deckList.slice());
  drawCards(5);
}

// 덱에서 n장을 손패로 옮긴다. 덱이 비면 버린 더미를 섞어 덱으로 되돌린다.
function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (gameState.deck.length === 0) {
      if (gameState.discard.length === 0) {
        console.log("뽑을 카드가 더 없다 (덱과 버린 더미 모두 비어 있음)");
        return;
      }
      console.log("덱 소진 → 버린 더미 " + gameState.discard.length + "장을 섞어 덱으로 되돌린다");
      gameState.deck = shuffleArray(gameState.discard);
      gameState.discard = [];
    }
    gameState.hand.push(gameState.deck.pop());
  }
}

// 저장 데이터를 읽어서 검증만 한다. gameState는 건드리지 않는다.
function parseSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (
      typeof data.floor !== "number" ||
      typeof data.focus !== "number" ||
      !Array.isArray(data.mapNodes) ||
      data.mapNodes.length !== TOTAL_FLOORS || // map.js가 정의. 층 수가 바뀌면 옛 저장은 손상으로 취급
      !Array.isArray(data.deckIds)
    ) {
      return null;
    }
    const deckList = data.deckIds.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
    if (deckList.length !== data.deckIds.length) return null; // 알 수 없는 카드 id → 손상된 저장

    return { floor: data.floor, focus: data.focus, mapNodes: data.mapNodes, deckList };
  } catch (e) {
    return null; // JSON이 깨졌을 때도 조용히 실패
  }
}

function hasSavedGame() {
  return parseSave() !== null;
}

// 저장이 없거나 깨졌으면 null만 반환하고 gameState는 건드리지 않는다.
// 성공하면 gameState를 덮어쓰는 부수효과가 있으니, 단순히 저장 존재 여부만 알고 싶으면 hasSavedGame()을 쓴다.
function loadGame() {
  const data = parseSave();
  if (!data) return null;

  gameState.floor = data.floor;
  gameState.focus = data.focus;
  gameState.mapNodes = data.mapNodes;
  gameState.deckList = data.deckList;
  return gameState;
}

function saveGame() {
  if (gameState.isDemo) return;
  const payload = {
    floor: gameState.floor,
    focus: gameState.focus,
    mapNodes: gameState.mapNodes,
    deckIds: gameState.deckList.map((card) => card.id)
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function clearSavedGame() {
  localStorage.removeItem(SAVE_KEY);
}

function getBestFloor() {
  const value = parseInt(localStorage.getItem(BEST_FLOOR_KEY), 10);
  return Number.isFinite(value) ? value : 0;
}

function saveBestFloor(floor) {
  if (floor > getBestFloor()) {
    localStorage.setItem(BEST_FLOOR_KEY, String(floor));
  }
}

// 런 종료(승리 또는 패배) 공통 처리: 기록 갱신 + 저장 삭제 + 결과 문구 준비
function endRun(reachedFloor, outcome) {
  const previousBest = getBestFloor();
  saveBestFloor(reachedFloor);
  clearSavedGame();

  const newBest = Math.max(previousBest, reachedFloor);
  gameState.resultTitle = outcome === "clear" ? "탑 정복!" : "런 종료";
  gameState.resultDetail =
    "도달 층수: " + reachedFloor + "층" +
    (reachedFloor > previousBest ? " (최고 기록 갱신!)" : " (최고 기록: " + newBest + "층)");
}
