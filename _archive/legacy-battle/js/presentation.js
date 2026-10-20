// 표시용 문자열과 체험 상태 생성. DOM 조작은 ui.js에서만 한다.
const CARD_ART_IDS = ["c01", "c02", "c03", "c17", "c23"];
const EFFECT_LABELS = { draw1: "카드 +1", block4: "방어 +4", energy1: "다음 생각 +1" };

function cardMarkup(card, grade = "") {
  const art = CARD_ART_IDS.includes(card.id) ? "art-" + card.id : "art-generic";
  return '<span class="card-topline"><span class="card-cost">' + card.cost + '</span><span class="card-type">' + card.type + '</span></span>' +
    '<span class="card-art ' + art + '" aria-hidden="true">' + (art === "art-generic" ? card.type : "") + '</span>' +
    '<span class="card-word">' + card.word + '</span><span class="card-meaning">' + card.meaning + '</span>' +
    '<span class="card-tags">' + card.tags.join(" · ") + '</span>' +
    '<span class="card-stats"><span>힘 ' + card.power + '</span><span class="card-grade">' + grade + '</span></span>' +
    '<span class="card-effect">' + (EFFECT_LABELS[card.effect] || "낱말의 힘으로 공격") + '</span>';
}

// 체험 전투는 저장된 모험을 읽거나 덮어쓰지 않는다.
function startBattleDemo() {
  initGame();
  gameState.isDemo = true;
  gameState.floor = 5;
  gameState.mapNodes = Array.from({ length: TOTAL_FLOORS }, (_, i) => BOSS_FLOORS.includes(i + 1) ? "보스" : "전투");
  startBattle("e04");
  const ids = ["c01", "c02", "c03", "c17", "c23"];
  gameState.hand = ids.map((id) => CARDS.find((card) => card.id === id));
  gameState.deck = gameState.deckList.filter((card) => !ids.includes(card.id));
  gameState.enemy.demandIndex = 2;
  gameState.lastMessage = "두더지가 단서를 숨겼어요. 상황에 어울리는 카드를 골라 보세요.";
}
