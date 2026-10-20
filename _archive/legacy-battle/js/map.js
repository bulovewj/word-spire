// 층 진행, 노드 선택. DOM 조작은 하지 않는다.

const TOTAL_FLOORS = 15;
const BOSS_FLOORS = [5, 10, 15];

// 층별 노드 종류를 정해서 배열로 돌려준다. 5·10·15층은 항상 보스.
function generateMapNodes() {
  const nodes = [];
  for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
    if (BOSS_FLOORS.includes(floor)) {
      nodes.push("보스");
    } else {
      nodes.push(Math.random() < 0.25 ? "휴식" : "전투");
    }
  }
  return nodes;
}

function getCurrentNodeType() {
  return gameState.mapNodes[gameState.floor - 1];
}

// 카드·괴물 데이터의 tier: 1층~5층 / 6층~10층 / 11층~15층
function getTierForFloor(floor) {
  if (floor <= 5) return 1;
  if (floor <= 10) return 2;
  return 3;
}

// 새 런 시작: 집중력·덱을 초기화하고 새 맵을 만든다.
function startNewRun() {
  initGame();
  gameState.floor = 1;
  gameState.mapNodes = generateMapNodes();
  saveGame();
}

function advanceFloor() {
  gameState.floor += 1;
  saveGame();
}

// 휴식 노드: 집중력을 최대로 회복하고 다음 층으로 넘어간다.
function restAtCurrentFloor() {
  gameState.focus = 30;
  advanceFloor();
}

// 전투(보스 포함) 승리 + 보상 처리를 마친 뒤 호출한다.
// 15층 보스를 이겼으면 런 완주, 아니면 다음 층으로.
function completeBattleNode() {
  if (gameState.floor === TOTAL_FLOORS) {
    endRun(TOTAL_FLOORS, "clear");
    return "clear";
  }
  advanceFloor();
  return "continue";
}
