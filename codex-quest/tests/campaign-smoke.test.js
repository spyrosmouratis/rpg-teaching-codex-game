import test from 'node:test';
import assert from 'node:assert/strict';
import { mobs } from '../src/data/encounters.js';

test('mage can clear all nine encounters and the optional boss', async () => {
  const nodes = new Map();
  let clickPanel;
  let keyDown;
  let drawingCalls = 0;
  const ctx = {
    save() {}, restore() {}, translate() {}, fillText() {},
    fillRect() { drawingCalls += 1; }, clearRect() {},
  };
  const panel = {
    innerHTML: '',
    addEventListener(name, handler) { if (name === 'click') clickPanel = handler; },
    querySelector() { return { disabled: false }; },
  };
  const canvas = { getContext() { return ctx; }, addEventListener() {} };
  globalThis.document = {
    activeElement: { tagName: 'BODY' },
    getElementById(id) {
      if (id === 'panel') return panel;
      if (id === 'world') return canvas;
      if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', style: { width: '' }, focus() {} });
      return nodes.get(id);
    },
  };
  globalThis.window = {
    addEventListener(name, handler) { if (name === 'keydown') keyDown = handler; },
  };
  await import('../src/game.js');
  assert.match(panel.innerHTML, /The dungeon awaits/);
  assert.ok(drawingCalls > 0, 'initial scene is drawn');
  const click = (kind, value) => {
    clickPanel({ target: { closest(selector) {
      const expected = { action: '[data-action]', choice: '[data-choice]', guard: '[data-guard]' }[kind];
      return selector === expected ? { dataset: { [kind]: String(value) } } : null;
    } } });
  };
  const walk = key => keyDown({ key, preventDefault() {} });
  click('action', 'start');
  assert.match(panel.innerHTML, /torchlit corridor/);
  const encounterSteps = [3, 7, 11, 16, 20, 24, 29, 35, 40];
  for (let i = 1; i <= 40; i += 1) {
    const key = i <= 13 ? 'ArrowRight' : i <= 15 ? 'ArrowDown' : i <= 28 ? 'ArrowLeft' : i <= 30 ? 'ArrowDown' : 'ArrowRight';
    walk(key);
    const encounterIndex = encounterSteps.indexOf(i);
    if (encounterIndex < 0) continue;
    const mob = mobs[encounterIndex];
    assert.ok(panel.innerHTML.includes(mob.name), `${mob.name} appears`);
    const bestAttack = mob.choices.findIndex(c => c.damage === Math.max(...mob.choices.map(x => x.damage)));
    click('choice', bestAttack);
    click('action', 'attack');
    assert.match(panel.innerHTML, /Strike landed/);
    click('action', 'defend');
    assert.match(panel.innerHTML, /Arcane shield/);
    click('guard', mob.defbest);
    assert.match(panel.innerHTML, /Successful defence/);
    click('action', 'claim');
  }
  assert.equal(nodes.get('killed').textContent, '9 / 9');
  assert.match(panel.innerHTML, /sealed dragon gate/);
  click('action', 'bossStart');
  assert.match(panel.innerHTML, /The Agentic Dragon/);
  globalThis.document.getElementById('codeInput').value = `import { Codex } from '@openai/codex-sdk';
async function runFix(task: string) {
  const codex = new Codex();
  const thread = codex.startThread();
  const result = await thread.run(task);
  return result.finalResponse;
}`;
  click('action', 'checkBoss');
  assert.match(panel.innerHTML, /The dragon falls/);
  click('action', 'retire');
  assert.match(panel.innerHTML, /CAMPAIGN COMPLETE/);
  assert.ok(drawingCalls > 100, 'dungeon and sprites drawn throughout');
  delete globalThis.document;
  delete globalThis.window;
});
