import { mobs } from "./data/encounters.js";

(() => {
  'use strict';

  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const panel = document.getElementById('panel');
  const panelDock = document.getElementById('panelDock');
  const gameStage = document.getElementById('gameStage');
  const width = canvas.width;
  const height = canvas.height;
  const groundY = 404;
  const worldLength = 5600;
  const encounterPositions = [680, 1160, 1650, 2200, 2700, 3200, 3750, 4300, 4900];
  const keys = new Set();
  const createImage = () => typeof Image === 'undefined' ? { complete: false, naturalWidth: 0 } : new Image();
  const art = { panorama: createImage(), mage: createImage(), monsters: createImage(), bossArena: createImage() };
  art.panorama.src = './public/assets/old-kingdom-panorama.png';
  art.mage.src = './public/assets/mage-adventurer.png';
  art.monsters.src = './public/assets/monster-atlas.png';
  art.bossArena.src = './public/assets/boss-arena.png';
  let lastFrame = 0;
  let state = createState();

  function createState() {
    return {
      hp: 100, xp: 0, killed: 0, worldX: 150, phase: 'intro', selected: null,
      active: -1, attackDamage: 0, enemyHp: 0, question: null, questionOrder: [], questionCursor: 0,
      defDeadline: 0, defTimer: null, combatTimer: null, autoWalk: false, damageFloat: null,
      bossDeadline: 0, bossTimer: null, bossCode: '', bossWon: false,
      ended: false, animation: 'idle', animationUntil: 0, facing: 1,
    };
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function updateHud() {
    document.getElementById('hp').textContent = `${state.hp} / 100`;
    document.getElementById('hpBar').style.width = `${state.hp}%`;
    document.getElementById('xp').textContent = `${state.xp} XP`;
    document.getElementById('xpBar').style.width = `${Math.min(100, state.xp / 650 * 100)}%`;
    document.getElementById('killed').textContent = `${state.killed} / 9`;
    document.getElementById('mobBar').style.width = `${state.killed / 9 * 100}%`;
    document.getElementById('skill').textContent = state.killed < 3 ? 'Apprentice Mage' : state.killed < 7 ? 'Arcane Adept' : 'Codex Archmage';
    document.getElementById('levelCaption').textContent = state.killed < 7 ? 'Promptcraft · Deflection · Inspection' : state.killed < 9 ? 'Async Code · Agent Threads' : 'Boss gate unlocked';
    document.getElementById('mapStatus').textContent = state.active >= 0 ? 'Encounter' : state.killed === 9 ? 'Mountain summit' : sceneFor(state.worldX).name;
  }

  function setPanel(html) {
    const canOverlay = typeof gameStage?.appendChild === 'function' && typeof panelDock?.appendChild === 'function';
    const overlay = canOverlay && ['attack', 'attackResult', 'enemyBlock', 'defend', 'defResult', 'mobDeath', 'boss'].includes(state.phase);
    const parent = overlay ? gameStage : panelDock;
    if (parent && panel.parentElement !== parent && typeof parent.appendChild === 'function') parent.appendChild(panel);
    panel.classList?.toggle('battle-overlay', overlay);
    panel.classList?.toggle('boss-overlay', overlay && state.phase === 'boss');
    panel.innerHTML = html;
    if (overlay) {
      panel.classList?.remove('overlay-enter');
      void panel.offsetWidth;
      panel.classList?.add('overlay-enter');
    }
  }
  function btn(label, action, primary = true) {
    return `<button class="${primary ? 'primary' : 'secondary'}" data-action="${action}">${label}</button>`;
  }

  function intro() {
    state.phase = 'intro';
    setPanel(`<div class="panelhead"><span class="tag">A new adventure</span><span class="minitag">Forest → mountain</span></div>
      <h2>The trail beyond the trees</h2>
      <p class="bodytext">Walk the old road from the deep forest to the mountain pass. Creatures will challenge your Codex skills along the way.</p>
      <div class="featurebox"><strong>How to play</strong><span>← → or A / D to walk. The camera follows you along the trail.</span><span>Choose an attack, then answer the creature's counterattack.</span><span>100 unique questions cover prompting, code selection, and writing code.</span></div>
      <div class="btnrow">${btn('Begin the journey →', 'start')}</div>`);
    updateHud();
  }

  function explorationPanel() {
    if (state.killed === mobs.length) { gate(); return; }
    state.phase = 'walk';
    const mob = mobs[state.killed];
    setPanel(`<div class="panelhead"><span class="tag">On the trail</span><span class="minitag">${state.killed}/9 encounters</span></div>
      <h2>${sceneFor(state.worldX).name}</h2>
      <p class="bodytext">Keep walking to meet the next creature. Watch the trail ahead.</p>
      <div class="featurebox"><strong>Next encounter</strong><span>${esc(mob.name)} · ${esc(mob.kind === 'elite' ? 'Code duel' : 'Prompt challenge')}</span><span>${esc(mob.topic)}</span></div>
      <p class="neutral">Move with <span class="kbd">←</span> <span class="kbd">→</span> or <span class="kbd">A</span> <span class="kbd">D</span>.</p>`);
    updateHud();
  }

  function triggerMob(index) {
    if (state.active >= 0 || index !== state.killed || index >= mobs.length) return;
    state.active = index;
    state.phase = 'attack';
    state.selected = null;
    state.attackDamage = 0;
    state.enemyHp = mobs[index].hp;
    state.questionOrder = mobs[index].attackQuestions.map((_, i) => i).sort(() => Math.random() - 0.5);
    state.questionCursor = 0;
    nextQuestion();
    state.animation = 'alert';
    state.animationUntil = performance.now() + 550;
    renderAttack();
    updateHud();
  }

  function enemyMeter(damage = 0) {
    const mob = mobs[state.active];
    const position = ['0%', '50%', '100%'];
    const column = mob.sprite % 3;
    const row = Math.floor(mob.sprite / 3);
    const spriteStyle = `background-image:url('./public/assets/monster-atlas.png');background-size:300% 300%;background-position:${position[column]} ${position[row]}`;
    const hp = state.enemyHp || mob.hp;
    return `<div class="enemy"><div class="enemyicon" role="img" aria-label="${esc(mob.name)}" style="${spriteStyle}"></div><div class="enemybar"><div class="enemyline"><strong>${esc(mob.name)}</strong><span>${Math.max(0, hp)} / ${mob.hp} HP</span></div><div class="track"><div class="fill hpfill" style="width:${Math.max(0, hp / mob.hp * 100)}%"></div></div></div></div>`;
  }

  function nextQuestion() {
    const mob = mobs[state.active];
    const i = state.questionOrder[state.questionCursor % state.questionOrder.length];
    state.question = mob.attackQuestions[i];
    state.questionCursor += 1;
    state.selected = null;
  }

  function answerDamage(question) {
    return question.type === 'write-code' ? 50 : question.type === 'choose-code' ? 20 : 10;
  }

  function isCorrectAnswer(question, value) {
    if (question.type === 'write-code') {
      return question.accepted.some(pattern => new RegExp(pattern, 'm').test(value.trim()));
    }
    return question.choices[Number(value)]?.correct === true;
  }

  function combatBubbleMarkup(question, choicesMarkup, title) {
    const mob = mobs[state.active];
    return `<div class="combat-dialogue">
      <section class="talk-bubble enemy-talk"><span class="bubble-speaker">${esc(mob.name)} · ${esc(mob.topic)}</span><div class="bubble-question">${esc(question.prompt)}</div></section>
      <section class="talk-bubble hero-talk"><span class="bubble-speaker">Your move · ${title}</span>${choicesMarkup}</section>
      <div class="combat-hp">${enemyMeter()}</div>
    </div>`;
  }

  function renderAttack() {
    const mob = mobs[state.active];
    const question = state.question;
    const choicesMarkup = question.type === 'write-code'
      ? `<textarea class="answer-code" id="answerCode" spellcheck="false" placeholder="Write your TypeScript answer here…"></textarea><div class="btnrow">${btn('Cast answer', 'attack')}</div><p class="bubble-hint">Correct spell: ${answerDamage(question)} damage</p>`
      : `<div class="choices">${question.choices.map((choice, i) => `<button class="choice ${state.selected === i ? 'selected' : ''}" data-choice="${i}"><span class="letter">${String.fromCharCode(65 + i)}</span>${question.type === 'choose-code' ? `<pre>${esc(choice.label)}</pre>` : `<span>${esc(choice.label)}</span>`}</button>`).join('')}</div><div class="bubble-footer"><span class="bubble-hint">${answerDamage(question)} damage on a correct answer</span>${btn('Cast answer', 'attack')}</div>`;
    setPanel(combatBubbleMarkup(question, choicesMarkup, question.type === 'write-code' ? 'Write code' : question.type === 'choose-code' ? 'Choose code' : 'Choose a prompt'));
    const attackButton = panel.querySelector('[data-action="attack"]');
    attackButton.disabled = question.type === 'write-code' ? !panel.querySelector('#answerCode').value.trim() : state.selected === null;
  }

  function animate(name, duration = 850) {
    state.animation = name;
    state.animationUntil = performance.now() + duration;
  }

  function attack() {
    if (state.phase !== 'attack') return;
    const mob = mobs[state.active];
    const question = state.question;
    const written = question.type === 'write-code' ? panel.querySelector('#answerCode')?.value || '' : '';
    if (question.type === 'write-code' ? !written.trim() : state.selected === null) return;
    const correct = isCorrectAnswer(question, question.type === 'write-code' ? written : state.selected);
    const answer = question.type === 'write-code' ? written : question.choices[Number(state.selected)].label;
    const note = correct ? (question.type === 'write-code' ? 'The written code matches the requested structure.' : 'Good call. Your answer shows the right Codex habit.') : 'That answer misses the safest or most reliable approach. The creature blocks the spell.';
    state.phase = correct ? 'attackResult' : 'enemyBlock';
    if (correct) {
      state.attackDamage = answerDamage(question);
      state.enemyHp = Math.max(0, state.enemyHp - state.attackDamage);
      state.xp += Math.round(state.attackDamage / 2);
      state.damageFloat = { amount: `−${state.attackDamage}`, until: performance.now() + 1200, target: 'enemy' };
      animate('beam', 1050);
    } else {
      animate('enemyBlock', 750);
    }
    const resultMarkup = `<div class="battle-result ${correct ? '' : 'bad'}"><span class="bubble-speaker">${correct ? `Spell hit · ${state.attackDamage} damage · ${state.enemyHp}/${mob.hp} HP` : 'Blocked · no damage'}</span><strong>${correct ? 'Direct hit!' : 'The enemy blocks your spell'}</strong><p>${esc(note)}</p><div class="result-answer">${esc(answer)}</div></div>`;
    setPanel(resultMarkup);
    updateHud();
    scheduleCombat(() => {
      if (state.enemyHp <= 0) defeatMob();
      else startCounterattack();
    }, correct ? 1100 : 750);
  }

  function scheduleCombat(callback, delay) {
    if (state.combatTimer) clearTimeout(state.combatTimer);
    state.combatTimer = setTimeout(() => { state.combatTimer = null; callback(); }, delay);
  }

  function startCounterattack() {
    if (state.active < 0 || state.phase === 'victory') return;
    state.phase = 'defend';
    state.selected = null;
    state.defDeadline = Date.now() + 12000;
    animate('enemyAttack', 1000);
    renderDefence();
    state.defTimer = setInterval(() => {
      if (state.phase !== 'defend') { clearDef(); return; }
      const ms = state.defDeadline - Date.now();
      const countdown = document.getElementById('countdown');
      const bar = document.getElementById('timeBar');
      if (countdown) countdown.textContent = `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
      if (bar) bar.style.width = `${Math.max(0, ms / 12000 * 100)}%`;
      if (ms <= 0) finishDefence(null);
    }, 85);
  }

  function defend() {
    startCounterattack();
  }

  function clearDef() {
    if (state.defTimer) { clearInterval(state.defTimer); state.defTimer = null; }
  }

  function renderDefence() {
    const mob = mobs[state.active];
    const choicesMarkup = `<div class="timer"><span>Choose before the strike lands</span><strong id="countdown">12.0s</strong></div><div class="timetrack"><div id="timeBar" class="fill" style="width:100%"></div></div><div class="choices">${mob.defopts.map((option, i) => `<button class="choice" data-guard="${i}"><span class="letter">${String.fromCharCode(65 + i)}</span><span>${esc(option)}</span></button>`).join('')}</div><p class="bubble-hint">A correct defence stops the hit. A wrong answer or timeout costs 10 HP.</p>`;
    setPanel(`<div class="combat-dialogue"><section class="talk-bubble enemy-talk"><span class="bubble-speaker">${esc(mob.name)} attacks!</span><div class="bubble-question">${esc(mob.defence)}</div></section><section class="talk-bubble hero-talk"><span class="bubble-speaker">Defend · choose your response</span>${choicesMarkup}</section><div class="combat-hp">${enemyMeter()}</div></div>`);
  }

  function finishDefence(choice) {
    if (state.phase !== 'defend') return;
    const mob = mobs[state.active];
    const good = choice === mob.defbest;
    const expired = choice === null;
    clearDef();
    state.phase = 'defResult';
    const damage = good ? 0 : mob.defenceDamage || 10;
    if (good) state.xp += 20;
    animate('enemyAttack', 520);
    const title = good ? 'Force field up!' : expired ? 'The hit lands!' : 'The hit lands!';
    setPanel(`<div class="battle-result ${good ? '' : 'bad'}"><span class="bubble-speaker">${esc(mob.name)} · counterattack</span><strong>${title}</strong><p>${good ? 'You timed the defence well. The force field flashes as the strike connects.' : `${expired ? 'You hesitated.' : 'Your defence missed.'} The force field failed to catch the strike.`}</p><div class="result-answer">${esc(mob.detail)}${good ? '' : `<br><br>Safer response: ${esc(mob.defopts[mob.defbest])}`}</div></div>`);
    scheduleCombat(() => {
      if (good) animate('shield', 520);
      else {
        state.hp = Math.max(0, state.hp - damage);
        state.damageFloat = { amount: `−${damage}`, until: performance.now() + 1200, target: 'hero' };
        animate('hit', 620);
      }
      updateHud();
      if (state.hp <= 0) {
        setPanel(`<div class="battle-result bad"><span class="bubble-speaker">Journey ended</span><strong>Your mage falls</strong><p>Restart and try a different approach.</p>${btn('Restart journey', 'restart')}</div>`);
      } else {
        scheduleCombat(() => { nextQuestion(); state.phase = 'attack'; renderAttack(); }, 650);
      }
    }, 400);
  }

  function defeatMob() {
    const mob = mobs[state.active];
    state.phase = 'mobDeath';
    state.damageFloat = { amount: 'Defeated!', until: performance.now() + 1000, target: 'enemy' };
    animate('death', 1000);
    setPanel(`<div class="battle-result"><span class="bubble-speaker">${esc(mob.name)} · defeated</span><strong>The path is clear!</strong><p>Your spell lands and the creature fades from the trail. Moving on…</p></div>`);
    scheduleCombat(() => {
    state.killed += 1;
    state.xp += 30;
    state.hp = Math.min(100, state.hp + 5);
    state.active = -1;
    state.selected = null;
    animate('victory', 700);
    if (state.killed === mobs.length) gate();
    else { state.autoWalk = true; explorationPanel(); }
    }, 950);
  }

  function gate() {
    state.phase = 'gate';
    state.active = -1;
    setPanel(`<div class="panelhead"><span class="tag boss">FINAL ENCOUNTER</span><span class="minitag">9/9 creatures defeated</span></div>
      <h2>The Agentic Dragon blocks the summit</h2><p class="bodytext">The dragon is waiting on the mountain bridge. This is the final challenge of the journey.</p>
      <div class="featurebox"><strong>Final spell challenge</strong><span>Write the Codex SDK flow before the 110-second timer ends.</span><span>Your code is checked for structure only. It is never executed.</span></div>
      <div class="btnrow">${btn('Face the dragon →', 'bossStart')}</div>`);
    updateHud();
  }

  function startBoss() {
    state.phase = 'boss';
    state.bossCode = '';
    state.bossDeadline = Date.now() + 110000;
    renderBoss('');
    state.bossTimer = setInterval(() => {
      if (state.phase !== 'boss') { clearBoss(); return; }
      const ms = state.bossDeadline - Date.now();
      const timer = document.getElementById('bossTime');
      const bar = document.getElementById('bossTimeBar');
      if (timer) timer.textContent = `${Math.max(0, Math.ceil(ms / 1000))}s`;
      if (bar) bar.style.width = `${Math.max(0, 100 * ms / 110000)}%`;
      if (ms <= 0) bossTimeout();
    }, 150);
  }

  function clearBoss() {
    if (state.bossTimer) { clearInterval(state.bossTimer); state.bossTimer = null; }
  }

  const starter = `import { Codex } from "@openai/codex-sdk";\n\n// Write an async function runFix(task: string)\n// that starts a Codex thread, runs task,\n// and returns the final response as a string.\n`;

  function renderBoss(feedback) {
    const show = state.bossCode || starter;
    setPanel(`<div class="panelhead"><span class="tag boss">FINAL BOSS · CODE ONLY</span><span class="minitag">Codex SDK</span></div>
      <h2>The Agentic Dragon</h2><p class="bodytext">Write an <strong>async TypeScript function</strong> named <code>runFix(task: string)</code>. Create a Codex instance, start a thread, run the supplied task, and return the final response.</p>
      <div class="timer"><span>Boss timer</span><strong id="bossTime">110s</strong></div><div class="timetrack"><div class="fill" id="bossTimeBar" style="width:100%"></div></div>
      <textarea class="code" id="codeInput" spellcheck="false" aria-label="TypeScript code challenge">${esc(show)}</textarea>
      <div class="btnrow">${btn('Cast typed code spell', 'checkBoss')}${btn('Review the spell', 'retreat', false)}</div>
      <p class="neutral">Hint: <code>new Codex()</code> → <code>startThread()</code> → <code>await thread.run(task)</code> → <code>result.finalResponse</code>.</p>${feedback}`);
  }

  function validateCode(code) {
    const clean = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    return [
      ['Import Codex from @openai/codex-sdk', /import\s*\{[^}]*\bCodex\b[^}]*\}\s*from\s*["']@openai\/codex-sdk["']/m.test(clean)],
      ['Declare an async function', /async\s+function\s+runFix\s*\(\s*task\s*:\s*string\s*\)/m.test(clean)],
      ['Create a Codex instance', /new\s+Codex\s*\(/m.test(clean)],
      ['Start a thread', /\.startThread\s*\(/m.test(clean)],
      ['Await a thread run using task', /await\s+[\w.]+\.run\s*\(\s*task\s*\)/m.test(clean)],
      ['Return the final response', /return\s+\w+\.finalResponse\b/m.test(clean)],
    ];
  }

  function checkBoss() {
    if (state.phase !== 'boss') return;
    const input = document.getElementById('codeInput');
    if (!input) return;
    state.bossCode = input.value;
    const checks = validateCode(state.bossCode);
    const score = checks.filter(([, ok]) => ok).length;
    if (score === checks.length) {
      clearBoss(); state.phase = 'bossWon'; state.bossWon = true; state.xp += 150; updateHud();
      setPanel(`<div class="panelhead"><span class="tag boss">FINAL BOSS DEFEATED</span><span class="minitag">6/6 checks</span></div><h2 class="victory">The dragon falls!</h2>
        <p class="bodytext">Your code includes the required Codex SDK flow. You earn <strong>+150 XP</strong>.</p>
        <div class="feedback"><strong>Prototype check</strong>This checks code structure only. It does not compile or execute your TypeScript.</div>
        <div class="btnrow">${btn('View campaign victory', 'retire')}${btn('Play again', 'restart', false)}</div>`);
      return;
    }
    const missing = checks.map(([label, ok]) => `<div class="check ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${esc(label)}</div>`).join('');
    const seconds = Math.max(0, Math.ceil((state.bossDeadline - Date.now()) / 1000));
    renderBoss(`<div class="feedback bad"><strong>Spell incomplete · ${score}/6 checks · ${seconds}s remaining</strong><div class="checks">${missing}</div></div>`);
    document.getElementById('codeInput').focus();
  }

  function bossTimeout() {
    if (state.phase !== 'boss') return;
    const input = document.getElementById('codeInput');
    if (input) state.bossCode = input.value;
    clearBoss(); state.phase = 'timeout'; state.hp = Math.max(1, state.hp - 20); updateHud();
    setPanel(`<div class="panelhead"><span class="tag elite">DRAGON COUNTERATTACK</span><span class="minitag">−20 HP</span></div><h2>Time's up!</h2>
      <p class="bodytext">The dragon's ward interrupts your spell. The journey can continue when you defeat it.</p>
      <div class="feedback bad"><strong>What to practise</strong>Import, instantiate, start a thread, await the run, and return <code>finalResponse</code>.</div>
      <div class="btnrow">${btn('Try the final spell again', 'bossStart')}</div>`);
  }

  function retire() {
    clearBoss(); state.phase = 'victory'; state.ended = true;
    setPanel(`<div class="panelhead"><span class="tag boss">JOURNEY COMPLETE</span><span class="minitag">Victory</span></div><h2 class="victory">✦ The trail is yours</h2>
      <p class="bodytext">You crossed the forest and mountain pass and defeated all nine creatures${state.bossWon ? ' and the Agentic Dragon' : ''}.</p>
      <div class="featurebox"><strong>Journey stats</strong><span>♥ Health: ${state.hp}/100</span><span>★ Mastery XP: ${state.xp}</span><span>⚔ Encounters: 9/9</span><span>🐲 Final dragon: ${state.bossWon ? 'defeated' : 'not challenged'}</span></div>
      <div class="btnrow">${btn('Play again ↺', 'restart')}</div>`);
  }

  function restart() {
    clearDef(); clearBoss(); if (state.combatTimer) clearTimeout(state.combatTimer); keys.clear(); state = createState();
    updateHud(); intro();
  }

  panel.addEventListener('click', event => {
    const choice = event.target.closest('[data-choice]');
    if (choice && state.phase === 'attack') { state.selected = Number(choice.dataset.choice); renderAttack(); return; }
    const guard = event.target.closest('[data-guard]');
    if (guard && state.phase === 'defend') { finishDefence(Number(guard.dataset.guard)); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    ({ start: explorationPanel, attack, defend, bossStart: startBoss, checkBoss, retreat: gate, retire, restart })[button.dataset.action]?.();
  });

  panel.addEventListener('input', event => {
    if (event.target.id === 'codeInput') state.bossCode = event.target.value;
    if (event.target.id === 'answerCode' && state.phase === 'attack') {
      const button = panel.querySelector('[data-action="attack"]');
      if (button) button.disabled = !event.target.value.trim();
    }
  });

  window.addEventListener('keydown', event => {
    if (['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
      event.preventDefault(); keys.add(event.key.toLowerCase());
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  for (const control of document.querySelectorAll?.('[data-move]') || []) {
    const direction = control.dataset.move;
    control.addEventListener('pointerdown', event => { event.preventDefault(); keys.add(direction); });
    for (const eventName of ['pointerup', 'pointerleave', 'pointercancel']) control.addEventListener(eventName, () => keys.delete(direction));
  }

  const palettes = [
    { name: 'Whispering Forest', sky: '#83b4bd', far: '#6a8991', near: '#42634e', ground: '#334d39', grass: '#789451', accent: '#d5c878' },
    { name: 'Highland Trail', sky: '#8bb1c6', far: '#667f9a', near: '#5a7059', ground: '#544f3d', grass: '#a09a61', accent: '#e0c779' },
    { name: 'Frostpeak Pass', sky: '#91a9c3', far: '#667e9d', near: '#43566a', ground: '#343d4a', grass: '#8795a0', accent: '#e9e3ce' },
  ];

  function sceneFor(worldX) {
    return worldX < 1900 ? palettes[0] : worldX < 3850 ? palettes[1] : palettes[2];
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
  }

  function drawMountains(cameraX, color, baseY, parallax, spacing, heightScale) {
    const offset = cameraX * parallax;
    const first = Math.floor(offset / spacing) - 1;
    for (let i = first; i < first + Math.ceil(width / spacing) + 3; i++) {
      const seed = Math.abs((i * 9301 + 49297) % 233);
      const peakHeight = heightScale * (0.55 + seed / 520);
      const x = i * spacing - offset;
      rect(x + spacing * 0.12, baseY - peakHeight * 0.54, spacing * 0.76, peakHeight * 0.54, color);
      rect(x + spacing * 0.27, baseY - peakHeight, spacing * 0.46, peakHeight * 0.48, color);
      rect(x + spacing * 0.4, baseY - peakHeight * 1.13, spacing * 0.2, peakHeight * 0.17, color);
    }
  }

  function drawTrees(cameraX, color, parallax, spacing, yBase, scale) {
    const offset = cameraX * parallax;
    const first = Math.floor(offset / spacing) - 1;
    for (let i = first; i < first + Math.ceil(width / spacing) + 3; i++) {
      const seed = Math.abs((i * 73 + 29) % 37);
      const x = i * spacing - offset;
      const trunkW = 8 * scale;
      const treeH = (70 + seed * 2.5) * scale;
      rect(x + spacing * 0.45, yBase - treeH * 0.48, trunkW, treeH * 0.48, '#594b3b');
      rect(x + spacing * 0.18, yBase - treeH * 0.84, spacing * 0.58, treeH * 0.38, color);
      rect(x + spacing * 0.28, yBase - treeH, spacing * 0.38, treeH * 0.31, color);
      rect(x + spacing * 0.37, yBase - treeH * 1.1, spacing * 0.2, treeH * 0.19, color);
    }
  }

  function drawScenery(cameraX, now) {
    const palette = sceneFor(state.worldX);
    const bossScene = state.killed === mobs.length && ['gate', 'boss', 'bossWon', 'timeout', 'victory'].includes(state.phase);
    if (bossScene && art.bossArena.complete && art.bossArena.naturalWidth) {
      drawCover(art.bossArena);
    } else if (art.panorama.complete && art.panorama.naturalWidth) {
      const sourceWidth = Math.min(art.panorama.naturalWidth, art.panorama.naturalHeight * width / height);
      const sourceRange = art.panorama.naturalWidth - sourceWidth;
      const cameraRange = worldLength - width;
      const sourceX = cameraRange ? sourceRange * cameraX / cameraRange : 0;
      ctx.drawImage(art.panorama, sourceX, 0, sourceWidth, art.panorama.naturalHeight, 0, 0, width, height);
      // A subtle ground haze lets characters read clearly over the painted trail.
      rect(0, groundY + 5, width, height - groundY - 5, '#17212c26');
    } else {
      rect(0, 0, width, height, palette.sky);
      rect(0, 70, width, 110, '#ffffff12');
      for (let i = 0; i < 6; i++) {
        const cloudX = ((i * 197 - cameraX * 0.08) % (width + 180) + width + 180) % (width + 180) - 90;
        const cloudY = 58 + (i % 3) * 33;
        rect(cloudX, cloudY, 88, 13, '#e8f0e8a8');
        rect(cloudX + 17, cloudY - 9, 47, 12, '#e8f0e8a8');
      }
      drawMountains(cameraX, palette.far, 344, 0.12, 250, 190);
      drawMountains(cameraX, palette.near, 380, 0.24, 210, 135);
      if (state.worldX < 2500) drawTrees(cameraX, '#50745b', 0.38, 138, 407, 0.84);
      else if (state.worldX < 4200) drawTrees(cameraX, '#6a7554', 0.38, 190, 411, 0.62);
      else drawMountains(cameraX, '#758393', 410, 0.46, 240, 102);
      rect(0, groundY, width, height - groundY, palette.ground);
      rect(0, groundY, width, 9, palette.grass);
      const spacing = 94;
      const first = Math.floor(cameraX / spacing) - 1;
      for (let i = first; i < first + Math.ceil(width / spacing) + 3; i++) {
        const x = i * spacing - cameraX;
        const seed = Math.abs((i * 31 + 11) % 53);
        if (seed % 3 === 0) {
          rect(x + seed, groundY - 12 - seed % 9, 12 + seed % 12, 7, palette.grass);
          rect(x + seed + 7, groundY - 19 - seed % 9, 5, 8, palette.grass);
        } else {
          rect(x + seed, groundY - 7, 18 + seed % 18, 7, '#766d5a');
          rect(x + seed + 5, groundY - 10, 9, 4, '#a39a83');
        }
      }
      rect(0, groundY + 28, width, 3, '#d0bc83');
      rect(0, groundY + 61, width, 2, '#26313a');
    }
    if (bossScene) drawSceneLabel(state.bossWon ? 'Dragon defeated' : 'The Agentic Dragon');
    else drawSceneLabel(palette.name);
    const heroX = bossScene ? width * 0.25 : state.active >= 0 ? width * 0.23 : width * 0.38;
    if (!bossScene) drawEncounterMarkers(cameraX);
    if (state.animation === 'beam' && state.active >= 0) drawBeam(cameraX, heroX, now);
    drawHero(heroX, groundY, now);
    if (state.animation === 'enemyAttack' && state.active >= 0) drawEnemyAttack(cameraX, heroX, now);
    if (state.animation === 'shield' && now < state.animationUntil) drawForceField(heroX, groundY, now);
    if (state.animation === 'enemyBlock' && state.active >= 0) drawMobBlock(cameraX, now);
    drawDamageFloat(cameraX, heroX, now);
    drawParticles(now);
  }

  function drawCover(image) {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = width / height;
    let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
    if (sourceAspect > targetAspect) {
      sw = sourceHeight * targetAspect;
      sx = (sourceWidth - sw) / 2;
    } else {
      sh = sourceWidth / targetAspect;
      sy = (sourceHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  }

  function mobScreenX(index, cameraX) {
    return index === state.active ? width * 0.47 : encounterPositions[index] - cameraX + width * 0.38;
  }

  function drawBeam(cameraX, heroX, now) {
    const enemyX = mobScreenX(state.active, cameraX);
    const startX = heroX + 54;
    const targetX = enemyX - 30;
    const fullLength = Math.max(0, targetX - startX);
    const elapsed = Math.max(0, 1 - (state.animationUntil - now) / 1250);
    const reveal = Math.min(1, elapsed * 3.4);
    const length = fullLength * reveal;
    const y = groundY - 88;
    const pulse = 0.7 + Math.sin(now / 35) * 0.18;
    rect(startX, y - 13, length, 27, `rgba(56,225,255,${0.22 * pulse})`);
    rect(startX, y - 6, length, 13, `rgba(49,242,255,${0.72 * pulse})`);
    rect(startX, y - 2, length, 5, '#fff0bd');
    if (reveal >= 0.9) {
      rect(targetX - 12, y - 20, 25, 39, '#f2fcff');
      rect(targetX - 22, y - 10, 45, 19, '#a5fbff');
      rect(targetX - 7, y - 27, 14, 52, '#ffffff');
    }
  }

  function drawEnemyAttack(cameraX, heroX, now) {
    const enemyX = mobScreenX(state.active, cameraX);
    const startX = enemyX - 42;
    const endX = heroX + 54;
    const duration = state.phase === 'defResult' ? 520 : 1000;
    const progress = 1 - Math.max(0, state.animationUntil - now) / duration;
    const x = startX + (endX - startX) * Math.max(0, Math.min(1, progress));
    const y = groundY - 91 + Math.sin(now / 34) * 4;
    ctx.save(); ctx.shadowColor = '#ff764d'; ctx.shadowBlur = 24;
    rect(x - 13, y - 13, 26, 26, '#ff714f');
    rect(x - 7, y - 7, 14, 14, '#ffe5a1');
    ctx.restore();
    rect(x - 25, y - 2, 16, 4, '#ffc07c');
  }

  function drawMobBlock(cameraX, now) {
    const x = mobScreenX(state.active, cameraX) - 47;
    const y = groundY - 123;
    const pulse = 0.7 + Math.sin(now / 40) * 0.2;
    ctx.save(); ctx.globalAlpha = pulse; ctx.shadowColor = '#9c78dc'; ctx.shadowBlur = 20;
    rect(x - 3, y, 9, 112, '#a993e9'); rect(x + 1, y - 7, 62, 8, '#dbc9ff');
    rect(x + 1, y + 109, 62, 8, '#8165bd'); rect(x + 56, y + 4, 9, 101, '#7058a4');
    rect(x + 17, y + 28, 6, 52, '#d7c9ff'); rect(x + 17, y + 28, 28, 6, '#d7c9ff');
    rect(x + 39, y + 28, 6, 52, '#d7c9ff'); rect(x + 17, y + 74, 28, 6, '#d7c9ff');
    ctx.restore();
  }

  function drawDamageFloat(cameraX, heroX, now) {
    if (!state.damageFloat || now >= state.damageFloat.until) return;
    const age = 1 - (state.damageFloat.until - now) / 1200;
    const x = state.damageFloat.target === 'hero' ? heroX : mobScreenX(state.active, cameraX);
    const y = groundY - 164 - age * 32;
    ctx.save(); ctx.textAlign = 'center'; ctx.font = '900 28px system-ui, sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = '#171a20'; ctx.fillStyle = state.damageFloat.target === 'hero' ? '#ff514d' : '#fff0a1';
    ctx.strokeText(state.damageFloat.amount, x, y); ctx.fillText(state.damageFloat.amount, x, y); ctx.restore();
  }

  function drawForceField(heroX, baseY, now) {
    const pulse = 0.75 + Math.sin(now / 80) * 0.18;
    if (typeof ctx.beginPath === 'function' && typeof ctx.ellipse === 'function') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(heroX + 3, baseY - 81, 67, 91, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(39,226,255,${0.12 * pulse})`;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = `rgba(104,245,255,${0.86 * pulse})`;
      ctx.shadowColor = '#39eaff';
      ctx.shadowBlur = 22;
      ctx.stroke();
      ctx.restore();
    } else {
      rect(heroX - 61, baseY - 167, 5, 158, '#64ecf0');
      rect(heroX + 58, baseY - 167, 5, 158, '#64ecf0');
      rect(heroX - 50, baseY - 174, 102, 4, '#64ecf0');
      rect(heroX - 50, baseY - 6, 102, 4, '#64ecf0');
    }
  }

  function drawSceneLabel(name) {
    rect(24, 22, 238, 43, '#111a24aa');
    ctx.fillStyle = '#f6f0dd';
    ctx.font = '700 19px system-ui, sans-serif';
    ctx.fillText(name, 40, 50);
    ctx.fillStyle = '#ffffffbd';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(name === 'The Agentic Dragon' || name === 'Dragon defeated' ? 'FINAL BOSS · THE SUMMIT' : 'THE OLD KINGDOM ROAD', 40, 68);
  }

  function drawEncounterMarkers(cameraX) {
    for (let i = state.killed; i < encounterPositions.length; i++) {
      let screenX = mobScreenX(i, cameraX);
      if (screenX < -70 || screenX > width + 70) continue;
      if (i === state.active && state.phase === 'defend') screenX -= 16 + Math.sin(performance.now() / 55) * 8;
      if (i === state.active && state.phase === 'attackResult') screenX += 13;
      const bob = i === state.active && state.phase === 'defend' ? Math.sin(performance.now() / 55) * 5 : 0;
      rect(screenX - 35, groundY - 6, 70, 9, '#17212c99');
      const atlas = art.monsters;
      if (atlas.complete && atlas.naturalWidth) {
        const cellWidth = atlas.naturalWidth / 3;
        const cellHeight = atlas.naturalHeight / 3;
        const column = mobs[i].sprite % 3;
        const row = Math.floor(mobs[i].sprite / 3);
        ctx.save();
        if (i === state.active && state.animation === 'death') ctx.globalAlpha = Math.max(0.05, (state.animationUntil - performance.now()) / 1000);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(atlas, column * cellWidth, row * cellHeight, cellWidth, cellHeight, screenX - 75, groundY - 143 + bob, 150, 150);
        ctx.restore();
      } else {
        ctx.font = '39px serif';
        ctx.textAlign = 'center';
        ctx.fillText(mobs[i].icon, screenX, groundY - 7 + bob);
        ctx.textAlign = 'start';
      }
      if (i === state.active && state.phase === 'defend') {
        rect(screenX - 32, groundY - 27, 12, 5, '#f09a71');
        rect(screenX - 40, groundY - 34, 8, 4, '#ffd28c');
      }
      if (i === state.killed && state.phase === 'walk') {
        rect(screenX - 2, groundY - 39, 4, 23, '#f3d38b');
        rect(screenX - 11, groundY - 35, 22, 4, '#f3d38b');
      }
    }
  }

  function drawHero(x, groundY, now) {
    const moving = state.phase === 'walk' && keys.size > 0;
    const bob = moving ? Math.sin(now / 65) * 3 : Math.sin(now / 280) * 1.2;
    const y = groundY - 69 + bob;
    const facing = state.facing;
    const dodgeOffset = state.animation === 'dodge' && now < state.animationUntil ? -facing * 14 : 0;
    const heroX = x + dodgeOffset;
    const mageLoaded = art.mage.complete && art.mage.naturalWidth;
    if (mageLoaded) {
      const spriteWidth = 154;
      const spriteHeight = 162;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (facing < 0) {
        ctx.translate(heroX, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(art.mage, -spriteWidth / 2, groundY - spriteHeight + bob, spriteWidth, spriteHeight);
      } else {
        ctx.drawImage(art.mage, heroX - spriteWidth / 2, groundY - spriteHeight + bob, spriteWidth, spriteHeight);
      }
      ctx.restore();
    } else {
      // Simple canvas-drawn fallback while the player sprite loads.
      rect(heroX - 14, y + 33, 28, 25, '#3e5277');
      rect(heroX - 18, y + 32, 10, 21, '#7280a8');
      rect(heroX + 8, y + 32, 10, 21, '#7280a8');
      rect(heroX - 10, y + 9, 20, 25, '#d5ae78');
      rect(heroX - 13, y + 3, 26, 14, '#4d648e');
      rect(heroX - 12, y - 2, 24, 6, '#e0c27f');
      rect(heroX + facing * 5, y + 11, 4, 4, '#202c3f');
      rect(heroX - 11, y + 56, 9, 11, '#282d3e');
      rect(heroX + 2, y + 56, 9, 11, '#282d3e');
    }
    // Combat effects play over the detailed sprite.
    if (state.animation === 'shield' && now < state.animationUntil) {
      rect(heroX + facing * 35, y + 15, 18, 36, '#64c3c2');
      rect(heroX + facing * 38, y + 20, 12, 25, '#b9e8d7');
    } else if (state.animation === 'slash' && now < state.animationUntil) {
      const phase = (state.animationUntil - now) / 900;
      const reach = 16 + (1 - phase) * 28;
      rect(heroX + facing * 34, y + 35, facing * reach, 8, '#f9e39b');
      rect(heroX + facing * 48, y + 17, 7, 43, '#d9eaff');
      rect(heroX + facing * 61, y + 23, 8, 28, '#9dddeb');
    } else if (state.animation === 'hit' && now < state.animationUntil) {
      rect(heroX - 38, groundY - 152, 76, 154, '#ff786b33');
    } else if (!mageLoaded) {
      rect(heroX + facing * 13, y + 18, 5, 39, '#705039');
      rect(heroX + facing * 11, y + 14, 9, 7, '#b9e7e2');
    }
  }

  function drawParticles(now) {
    if (!['beam', 'shield', 'dodge', 'victory'].includes(state.animation) || now >= state.animationUntil) return;
    const colors = state.animation === 'shield' ? ['#b6f0e1', '#7bcaca'] : state.animation === 'dodge' ? ['#ffffff', '#d7e4f0'] : state.animation === 'beam' ? ['#a5fbff', '#fff0bd'] : ['#ffe8a1', '#f5a86c'];
    const count = state.animation === 'beam' ? 7 : 4;
    for (let i = 0; i < count; i++) {
      const heroX = state.active >= 0 ? width * 0.23 : width * 0.38;
      const x = heroX + Math.sin(now / 90 + i * 2) * (22 + i * 4);
      const y = 352 - ((now / 25 + i * 19) % 62);
      rect(x, y, 4 + i % 3, 4 + i % 3, colors[i % colors.length]);
    }
  }

  function render(now) {
    const cameraX = Math.max(0, Math.min(worldLength - width, state.worldX - width * 0.38));
    ctx.clearRect(0, 0, width, height);
    drawScenery(cameraX, now);
  }

  function frame(now) {
    const delta = Math.min(0.05, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    if (state.phase === 'walk') {
      const left = keys.has('arrowleft') || keys.has('a');
      const right = keys.has('arrowright') || keys.has('d');
      const direction = Number(right || (state.autoWalk && !left)) - Number(left);
      if (direction) {
        state.facing = direction;
        const previousX = state.worldX;
        state.worldX = Math.max(50, Math.min(worldLength - 120, state.worldX + direction * 235 * delta));
        if (direction > 0 && state.killed < mobs.length && previousX < encounterPositions[state.killed] && state.worldX >= encounterPositions[state.killed]) {
          state.worldX = encounterPositions[state.killed];
          triggerMob(state.killed);
          updateHud();
        }
        if (direction > 0 && state.killed === mobs.length && state.worldX >= worldLength - 180) gate();
      }
    }
    if (now > state.animationUntil && state.animation !== 'idle') state.animation = 'idle';
    render(now);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(frame);
  }

  restart();
  render(performance.now());
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(frame);
})();
