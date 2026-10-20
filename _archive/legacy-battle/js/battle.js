// 전투 로직 (턴, 에너지, 판정, 데미지). DOM 조작은 하지 않는다.

// tier와 보스 여부에 맞는 괴물을 하나 무작위로 고른다.
function pickEnemyForTier(tier, isBoss) {
  const candidates = ENEMIES.filter((e) => e.tier === tier && Boolean(e.boss) === isBoss);
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

function startBattle(enemyId) {
  const template = ENEMIES.find((e) => e.id === enemyId);
  gameState.enemy = {
    id: template.id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    demands: template.demands,
    demandIndex: 0
  };
  gameState.block = 0;
  gameState.bonusThought = 0;
  gameState.battleOver = null; // null | "win" | "lose"
  gameState.lastMessage = template.name + "이(가) 나타났다!" + (template.note ? " " + template.note : "");
  resetBattlePiles();
}

function getCurrentDemand() {
  const enemy = gameState.enemy;
  return enemy.demands[enemy.demandIndex % enemy.demands.length];
}

// accept 태그 중 하나라도 겹치면 통함(1.0배), 거기에 type까지 bestType과 같으면 정타(1.5배).
// bestType이 null인 요구는 종류를 안 따지므로 정타 없이 통함이 최선이다.
// 태그가 하나도 안 겹치면 빗나감(0.3배).
function judgeCard(card, demand) {
  const tagHit = demand.accept.some((tag) => card.tags.includes(tag));
  if (!tagHit) return { grade: "빗나감", multiplier: 0.3 };
  if (demand.bestType && card.type === demand.bestType) return { grade: "정타", multiplier: 1.5 };
  return { grade: "통함", multiplier: 1.0 };
}

function applyCardEffect(card) {
  if (card.effect === "draw1") {
    drawCards(1);
  } else if (card.effect === "block4") {
    gameState.block += 4;
  } else if (card.effect === "energy1") {
    gameState.bonusThought += 1;
  }
}

function playCard(cardId) {
  if (gameState.battleOver) return;

  const card = gameState.hand.find((c) => c.id === cardId);
  if (!card || gameState.thought < card.cost) return;

  gameState.thought -= card.cost;
  gameState.hand = gameState.hand.filter((c) => c.id !== cardId);
  gameState.discard.push(card);

  const demand = getCurrentDemand();
  const judged = judgeCard(card, demand);
  const damage = Math.max(1, Math.round(card.power * judged.multiplier));
  gameState.enemy.hp = Math.max(0, gameState.enemy.hp - damage);

  if (judged.grade === "빗나감") {
    gameState.lastMessage = "빗나감 (" + damage + " 데미지). '" + card.word + "'의 뜻: " + card.meaning;
  } else {
    gameState.lastMessage = judged.grade + "! '" + card.word + "'(으)로 " + damage + " 데미지.";
  }

  applyCardEffect(card);
  checkBattleEnd();
}

function checkBattleEnd() {
  if (gameState.enemy.hp <= 0) {
    gameState.battleOver = "win";
    gameState.lastMessage = gameState.enemy.name + "을(를) 물리쳤다!";
  } else if (gameState.focus <= 0) {
    // "도달 층수"는 죽은 층을 그대로 쓴다 (그 층까지는 올라왔다는 뜻). 클리어했다는 뜻은 아니다.
    gameState.battleOver = "lose";
    gameState.lastMessage = "집중력이 다 떨어졌다...";
  }
}

function endTurn() {
  if (gameState.battleOver) return;

  const incoming = Math.max(0, gameState.enemy.attack - gameState.block);
  gameState.focus = Math.max(0, gameState.focus - incoming);
  gameState.lastMessage = gameState.enemy.name + "의 공격! 집중력이 " + incoming + " 줄었다." +
    (gameState.block > 0 ? " (방어 " + gameState.block + " 막음)" : "");
  gameState.block = 0;

  checkBattleEnd();
  if (gameState.battleOver) return;

  gameState.discard.push(...gameState.hand);
  gameState.hand = [];
  gameState.thought = 3 + gameState.bonusThought;
  gameState.bonusThought = 0;
  drawCards(5);
  gameState.enemy.demandIndex++;
}
