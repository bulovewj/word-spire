// 전투 후 카드 3장 중 1택. DOM 조작은 하지 않는다.

// 현재 층의 tier에 맞는 카드 풀에서 3장을 무작위로 제시한다 (이미 가진 카드도 나올 수 있다 = ×2 성장).
function generateRewardOffers() {
  const tier = getTierForFloor(gameState.floor);
  const pool = CARDS.filter((card) => card.tier === tier);
  return shuffleArray(pool.slice()).slice(0, 3);
}

function enterReward() {
  gameState.rewardOffers = generateRewardOffers();
  gameState.rewardDecided = false;
  gameState.rewardMessage = "";
}

function chooseRewardCard(cardId) {
  if (gameState.rewardDecided) return;
  const card = CARDS.find((c) => c.id === cardId);
  gameState.deckList.push(card); // CARDS의 참조를 그대로 쌓는다 — 카드가 값 불변이라 복사가 필요 없다
  gameState.rewardDecided = true;
  gameState.rewardMessage = "'" + card.word + "' 카드를 낱말 주머니에 넣었다.";
}

function skipReward() {
  if (gameState.rewardDecided) return;
  gameState.rewardDecided = true;
  gameState.rewardMessage = "이번엔 받지 않았다.";
}

// 덱 보기용: 같은 카드를 {card, count}로 묶는다.
function groupDeckList(list) {
  const groups = [];
  const indexById = new Map();
  list.forEach((card) => {
    if (indexById.has(card.id)) {
      groups[indexById.get(card.id)].count++;
    } else {
      indexById.set(card.id, groups.length);
      groups.push({ card, count: 1 });
    }
  });
  return groups;
}
