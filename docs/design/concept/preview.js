// 1단계 디자인 검토용. 게임 상태·저장·채점 코드를 호출하지 않는다.
const icons = {
  book: '<path d="M2 3h5l1 2 1-2h5v10H9l-1 1-1-1H2z"/><path d="M8 5v8M4 6h2M4 8h2M10 6h2M10 8h2"/>',
  gem: '<path d="M5 2h6l3 5-6 7-6-7z"/><path d="M2 7h12M5 2l3 5 3-5M8 7v7"/>',
  impact: '<path d="M6 2v4H2l3 3-1 4 4-2 4 2-1-4 3-3h-4V2L8 5z"/>',
  shield: '<path d="M3 3l5-1 5 1v6l-5 5-5-5z"/><path d="M5 7l2 2 4-4"/>',
  fog: '<path d="M2 6h3V4h6v2h3M1 9h14M4 12h8"/>',
  evidence: '<path d="M3 2h10v12H3zM5 5h6M5 8h6M5 11h3"/>',
  clue: '<path d="M2 2h8v8H2zM10 10l4 4M5 4v4M3 6h4"/>',
  seal: '<path d="M4 2h8v12l-4-3-4 3zM6 5h4M6 7h4"/>',
  literal: '<path d="M2 2h11v12H2zM5 5h5M5 8h5M5 11h3"/>',
  connect: '<path d="M2 3h5v5H2zM9 8h5v5H9zM7 5h4v3"/>',
  author: '<path d="M2 2h9v8H7l-3 3v-3H2zM12 5h2v9h-4"/>',
  check: '<path d="M2 8l4 4L14 4"/>',
  unsure: '<path d="M5 4V2h6v5H8v3M8 12v2"/>',
  arrow: '<path d="M2 8h11M9 3l5 5-5 5"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
};
const icon = (name) => `<svg class="icon" data-icon="${name}" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges">${icons[name] || icons.book}</svg>`;
const miniBook = '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><path fill="#2f2a3d" d="M4 4h10v4h4V4h10v23H18v3h-4v-3H4z"/><path fill="#fffaf0" d="M6 6h6v3h3v16h-3V8H6zm12 3h2V6h6v19h-6v2h-2z"/><path fill="#a8741a" d="M6 20h6v3H6zm14 0h6v3h-6z"/></svg>';
const creature = '<svg class="creature" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-label="가뭄 도깨비 배치용 실루엣"><path fill="#2f2a3d" d="M6 8h5v4h10V8h5v8h3v11h-4v3h-7v-3h-4v3H7v-3H3V16h3z"/><path fill="#fffaf0" d="M8 10h1v4h14v-4h1v8h3v7H5v-7h3z"/><path fill="#b6acc2" d="M5 21h22v4H5zM9 27h3v1H9zm11 0h3v1h-3z"/><path fill="#2f2a3d" d="M15 14h3v5h-3v3h3v3h-5v-5h2z"/><path fill="#a8741a" d="M9 17h3v3H9zm12 0h3v3h-3z"/></svg>';
const sentences = [
  '꿀벌은 꽃가루를 이 꽃에서 저 꽃으로 옮겨 열매가 맺히도록 돕는다.',
  '우리가 먹는 과일과 채소 가운데 상당수가 이런 꿀벌의 도움을 받아 자란다.',
  '그런데 최근 여러 나라에서 꿀벌의 수가 크게 줄어들고 있다.',
  '과학자들은 농약 사용과 기후 변화를 그 원인으로 꼽는다.',
  '꿀벌이 계속 줄어들면 사람의 밥상도 함께 <span class="fog-word" aria-label="가려진 낱말">▒▒</span>받게 된다.',
];
const cards = [
  ['literal', '질문: 거기 있음', '과학자들이 꼽은, 꿀벌이 줄어드는 원인은?', 1, '질문'],
  ['connect', '질문: 연결', '꿀벌이 줄면 왜 사람의 밥상이 ▒▒받을까?', 2, '질문'],
  ['author', '질문: 글쓴이와 나', '글쓴이가 이 글을 쓴 까닭으로 가장 알맞은 것은?', 2, '질문'],
  ['fog', '안개 걷기', '가려진 낱말의 단서 찾기', 1, '안개'],
  ['shield', '협력', '뜻을 쓰면 방어', 1, '낱말'],
  ['shield', '절약', '뜻을 쓰면 방어', 1, '낱말'],
];
const query = new URLSearchParams(location.search);
const isQuestion = query.get('view') === 'question';
const page = document.getElementById('app');
const header = `<header class="topbar"><a class="brand" href="preview.html">${miniBook}<span>낱말탑</span></a><span class="location">꿀벌 탑 <b>1층</b></span><span class="grading">${icon('check')} 의미 채점</span></header>`;
function passage() {
  return `<section class="paper passage"><div class="paper-head"><span class="eyebrow">${icon('book')} 읽는 글</span><button class="collapse" aria-expanded="true">접기 −</button></div><h1>꿀벌이 사라지면</h1><div class="reading-rule"></div><ol>${sentences.map((s, i) => `<li><button class="sentence" data-sentence="${i}" aria-pressed="false"><span class="sentence-no">${i + 1}</span><span>${s}</span><span class="sentence-check">${icon('check')}</span></button></li>`).join('')}</ol><p class="paper-foot">${icon('evidence')} 글은 언제든 다시 읽을 수 있어.</p></section>`;
}
function enemy() {
  return `<section class="enemy paper"><div class="enemy-drawing">${creature}</div><div class="enemy-info"><div class="unit-title"><strong>가뭄 도깨비</strong><span class="attack">${icon('impact')} 다음 공격 피해 <b>6</b></span></div><p class="dialogue">“내 안개를 지나갈 수 있겠어?”</p><div class="bar-label">적 체력 <b>40 / 40</b></div><div class="hp enemy-hp"><i></i></div><p class="shield-note">${icon('fog')} 안개 보호막: 내 질문 피해 −2</p></div></section>`;
}
function player() {
  return `<section class="player paper"><div class="unit-title"><strong>나</strong><span class="defense">${icon('shield')} 방어 <b>0</b></span><span class="incoming">턴 끝에 받을 피해 <b>6</b></span></div><div class="bar-label">내 체력 <b>40 / 40</b></div><div class="hp player-hp"><i></i><span class="damage-segment"><span>−6</span></span></div><div class="hp-caption"><span class="pattern-key"></span>줄무늬만큼 턴 끝에 깎여. <b>40 → 34</b></div><div class="think-row"><span>생각력 <strong>3 / 3</strong></span><span class="gems">${icon('gem').repeat(3)}</span><span class="think-note">이번 턴에 쓸 힘</span></div></section>`;
}
function hand() {
  return `<section class="hand-area"><div class="section-head"><h2>내 카드</h2><span>쓸 카드를 골라 봐.</span></div><div class="cards">${cards.map(([kind, title, sub, cost, label]) => `<button class="card card-${kind}" data-card="${kind}"><span class="card-top">${icon(kind)}<span>${label}</span><span class="cost">생각력 <b>${cost}</b></span></span><strong>${title}</strong><span class="card-description">${sub}</span></button>`).join('')}</div></section><footer class="turn-row"><span><b>1</b>턴</span><button class="end-turn">턴 끝내기 ${icon('arrow')}</button></footer>`;
}
function question() {
  return `<section class="qpanel paper"><p class="eyebrow">${icon('literal')} 질문: 거기 있음</p><h2>과학자들이 꼽은,<br class="zoom-break"> 꿀벌이 줄어드는 원인은?</h2><div class="options" role="radiogroup" aria-label="보기">${['사람들이 꿀을 많이 먹은 것', '농약 사용과 기후 변화', '꽃이 줄어든 것', '열매가 맺히지 않은 것'].map((s, i) => `<button role="radio" aria-checked="${i === 0}" class="option ${i === 0 ? 'selected' : ''} ${i === 2 ? 'eliminated' : ''}" data-option="${i}" ${i === 2 ? 'disabled' : ''}><span class="option-no">${['①', '②', '③', '④'][i]}</span><span>${s}</span><span class="option-mark">${i === 2 ? '단서로 지움' : i === 0 ? icon('check') : ''}</span></button>`).join('')}</div><div class="hint-row"><button class="hint-button" disabled>${icon('clue')} 단서 보기 (이미 씀)</button></div><p class="evidence-callout">${icon('evidence')} 본문에서 근거 문장 <b>1개</b>를 골라 봐.<span class="evidence-count">(1/1 · 3번)</span></p><div class="confidence" role="radiogroup" aria-label="확신도"><button class="selected" data-confidence="sure" role="radio" aria-checked="true">${icon('check')} 확실</button><button data-confidence="unsure" role="radio" aria-checked="false">${icon('unsure')} 애매</button></div><p class="confidence-note">확실: 정타면 더 세게, 약타·실패면 다음 공격 +3.</p><p class="preview">정타 <b>7</b><span>/</span>약타 <b>1</b><span>/</span>실패 <b>0</b></p><div class="question-actions"><button class="cancel">취소</button><button class="primary submit">제출 ${icon('arrow')}</button></div></section>`;
}
if (isQuestion) {
  document.body.classList.add('question-view');
  page.innerHTML = `<div class="zoom-top"><span>낱말탑</span><span>질문 패널 · 선택은 정답 표시가 아니야.</span></div><main class="zoom-sheet">${question()}</main>`;
} else {
  page.innerHTML = `${header}<main class="battle-layout">${passage()}<div class="battle-field">${enemy()}${player()}<div class="event-line" role="status">${icon('book')} 본문을 읽고, 쓸 카드를 골라 봐.</div><div id="active-area">${hand()}</div></div></main>`;
}
function bindQuestion() {
  applyArt();
  document.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
    if (button.disabled) return;
    document.querySelectorAll('[data-option]').forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); b.querySelector('.option-mark').innerHTML = b.disabled ? '단서로 지움' : ''; });
    button.classList.add('selected'); button.setAttribute('aria-checked', 'true'); button.querySelector('.option-mark').innerHTML = icon('check');
  }));
  document.querySelectorAll('[data-confidence]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-confidence]').forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); });
    button.classList.add('selected'); button.setAttribute('aria-checked', 'true');
    document.querySelector('.preview b').textContent = button.dataset.confidence === 'sure' ? '7' : '4';
  }));
  document.querySelector('.cancel')?.addEventListener('click', () => { const active=document.getElementById('active-area'); if(active){active.innerHTML=hand();bindCards();}else{location.href='preview.html';} });
  document.querySelector('.submit')?.addEventListener('click', () => {
    document.querySelector('.preview').textContent = '디자인 확인용 시안이야. 실제 채점은 하지 않아.';
  });
}
function bindCards() { document.querySelectorAll('[data-card]').forEach((button) => button.addEventListener('click', () => { if (['literal', 'connect', 'author'].includes(button.dataset.card)) { document.getElementById('active-area').innerHTML = question(); bindQuestion(); } })); applyArt(); }
document.querySelector('.collapse')?.addEventListener('click', (event) => {
  const paper = document.querySelector('.passage'); paper.classList.toggle('folded');
  const folded = paper.classList.contains('folded'); event.currentTarget.setAttribute('aria-expanded', String(!folded)); event.currentTarget.textContent = folded ? '펼치기 +' : '접기 −';
});
document.querySelectorAll('[data-sentence]').forEach((button) => button.addEventListener('click', () => {
  if (!document.querySelector('.qpanel')) return;
  document.querySelectorAll('[data-sentence]').forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
  button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
  document.querySelector('.evidence-count').textContent = `(1/1 · ${Number(button.dataset.sentence) + 1}번)`;
}));
bindCards(); bindQuestion();

function applyArt() {
  if (query.get('art') !== '1') return;
  document.body.classList.add('with-art');
  const enemy = document.querySelector('.enemy-drawing');
  if (enemy) enemy.innerHTML = '<span class="sprite sprite-drought" role="img" aria-label="가뭄 도깨비"></span>';
  const player = document.querySelector('.player .unit-title strong');
  if (player && !player.querySelector('.sprite')) player.insertAdjacentHTML('afterbegin', '<span class="sprite sprite-reader" aria-hidden="true"></span>');
  const mapping = {gem:'think',impact:'damage',shield:'defense',fog:'fog',evidence:'evidence',clue:'clue',seal:'seal',check:'sure',unsure:'unsure'};
  document.querySelectorAll('svg[data-icon]').forEach((svg) => {
    const target = mapping[svg.dataset.icon];
    if (target) { const image = document.createElement('img'); image.className='icon pixel-icon'; image.alt=''; image.setAttribute('aria-hidden','true'); image.src=`icons/${target}.png`; svg.replaceWith(image); }
  });
}
applyArt();
