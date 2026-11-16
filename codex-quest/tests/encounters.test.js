import test from 'node:test';
import assert from 'node:assert/strict';
import { mobs } from '../src/data/encounters.js';

test('campaign has seven normal mobs and two coding elites', () => {
  assert.equal(mobs.length, 9);
  assert.equal(mobs.filter(m => m.kind === 'normal').length, 7);
  assert.equal(mobs.filter(m => m.kind === 'elite').length, 2);
});

test('each encounter has valid attacks and a valid defensive response', () => {
  for (const mob of mobs) {
    assert.ok(mob.name && mob.question && mob.topic, `${mob.name} is missing metadata`);
    assert.ok(mob.choices.length >= 3, `${mob.name} needs multiple attacks`);
    assert.ok(mob.choices.some(c => c.damage >= 75), `${mob.name} lacks a strong attack`);
    assert.ok(mob.choices.every(c => typeof c.label === 'string' && typeof c.why === 'string' && Number.isFinite(c.damage)));
    assert.ok(Array.isArray(mob.defopts) && mob.defopts.length === 3);
    assert.ok(Number.isInteger(mob.defbest) && mob.defbest >= 0 && mob.defbest < mob.defopts.length);
  }
});
