// 현재 진입점의 읽기 모험과 정적 리소스 연결을 함께 검사한다.
require('./check-reading.cjs');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8');
const resources = [...html.matchAll(/(?:src|href)="([^"?#]+)"/g)].map((match) => match[1]);
for (const path of resources) assert.ok(fs.existsSync(path), path);
const scripts = resources.filter((path) => path.endsWith('.js'));
for (const path of scripts) new vm.Script(fs.readFileSync(path, 'utf8'), { filename:path });
assert.ok(!scripts.some((path) => /\/(battle|state|data-cards|data-enemies|reward|map)\.js$/.test(path)), '구버전 전투 로직을 불러오지 않음');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ID 중복 금지');
const ui = fs.readFileSync('js/ui.js', 'utf8');
for (const match of ui.matchAll(/el\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]), match[1]);
for (const path of resources.filter((file) => file.endsWith('.css'))) {
  const css = fs.readFileSync(path, 'utf8');
  for (const match of css.matchAll(/url\(['"]?([^)'" ]+)/g)) assert.ok(fs.existsSync(require('node:path').resolve('css', match[1])), match[1]);
}
console.log('Page checks passed: script syntax, active reading-only scripts, HTML/CSS assets and DOM IDs.');
