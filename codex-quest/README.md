# Codex Quest: The Mage’s Trial

Codex Quest is a small, offline browser game about using Codex well. Guide a mage along an illustrated road from an enchanted forest to a mountain pass. Creatures interrupt the journey with short questions about prompting, code, and safe software work. Defeat them to reach the final dragon challenge.

## Run the game

You need Node.js 20 or newer. The project has no third-party dependencies, so there is no install step.

1. Open a terminal in the `codex-quest` folder.
2. Start the local server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.
4. Stop the server with **Ctrl+C** in the terminal.

## How to play

Start the journey, then walk right along the road. The camera follows the mage as the scenery changes from forest to highlands and mountains. When a creature appears, the game pauses movement and starts a question encounter.

Use **Left/Right Arrow** or **A/D** to move. On touch screens, use the on-screen arrow buttons. After each creature is defeated, the mage automatically continues to the next encounter.

## Combat

The creature asks a question in its speech bubble. Choose an answer in the mage’s bubble, or type a short code response when the question asks you to write code.

There are **100 distinct attack questions** across the nine creature encounters. The questions are shuffled within each creature’s pool and do not repeat until that pool has been used. They cover prompt writing, choosing code, and writing small TypeScript or JavaScript snippets.

| Answer type | Damage on a correct answer |
| --- | ---: |
| Prompt question | 10 |
| Choose the best code | 20 |
| Write a code response | 50 |

Creature health depends on its difficulty: easy creatures have 20 HP, medium creatures have 40 HP, and elite creatures have 60 HP. A wrong attack is blocked and deals no damage. The creature then counterattacks with its own question.

Answer the defence question correctly to raise a force field as the strike lands and avoid damage. A wrong answer or timeout costs 10 HP. If the mage’s health reaches zero, restart the journey. Defeating a creature restores up to 5 HP.

## The final challenge

After the nine road encounters, face the Agentic Dragon. The timed challenge asks you to write a TypeScript function using the Codex SDK flow shown in the game. It checks the submitted text for expected code patterns.

The challenge is a learning prototype: it does not compile or execute the submitted code, connect to Codex, or send data over the network.

## Project contents

- `index.html` — game page, status display, and canvas.
- `src/styles.css` — layout, speech bubbles, and visual effects.
- `src/game.js` — movement, camera, rendering, combat state, animations, and final challenge.
- `src/data/encounters.js` — creatures, the 100 attack questions, defence questions, and difficulty values.
- `public/assets/` — background panorama, mage art, creature atlas, and dragon arena.
- `scripts/dev-server.mjs` — dependency-free local development server.
- `tests/` — Node test files; some assertions still describe an earlier dungeon version of the game.
- `AGENTS.md` — project context and development guidance.
- `ROADMAP.md` — possible future improvements.

## Run the checks

The project includes an initial test suite that uses Node’s built-in test runner:

```bash
npm test
```

No `npm install` is required.

Some existing test assertions refer to the earlier dungeon prototype, so update them before relying on the suite for the current side-scrolling game.
