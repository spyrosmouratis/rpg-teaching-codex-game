# Codex Quest — development guidance

## Game vision
- One mage travels through a side-scrolling 2D RPG campaign, from forest to mountain pass.
- Left/right movement scrolls the camera; creatures interrupt the trail and start a combat question.
- The nine creature encounters interleave prompt and code duels before a required final dragon fight.
- The enemy speaks from a question bubble; answer choices or a code editor sit in a separate mage-side bubble.
- Attacks and counterattacks animate in the scene; the force field flashes only when a correct defence meets the hit.
- Prompt, code-choice and written-code answers deal 10, 20 and 50 damage; wrong attacks are blocked and lead to a 10 HP counterattack unless defended.
- Creatures have 20, 40 or 60 HP by difficulty, draw from 100 distinct shuffled attack questions, and the mage auto-walks after a defeat.
- Seven normal encounters teach Codex task prompting through multiple-choice attacks.
- Defence is time-limited (12 seconds) and tests judgment about agent output.
- Two elite encounters use multiple-choice code examples.
- The final dragon encounter challenges the player to write TypeScript using the Codex SDK within 110 seconds.
- Each multiple-choice question has one authored correct answer; written-code questions use structural pattern checks, not code execution.

## Current project
- `index.html`: markup and canvas.
- `src/styles.css`: styling.
- `src/data/encounters.js`: encounter content and scoring.
- `src/game.js`: state, side-scrolling canvas rendering, scenery, combat and animation logic.
- `public/assets/`: generated panorama, mage sprite, monster atlas and final boss arena.
- `scripts/dev-server.mjs`: dependency-free local HTTP server.
- `tests/encounters.test.js`: basic data integrity tests.

## Working agreement
1. Read this file and README.md before changing code.
2. Preserve the existing game loop unless a requested feature needs an intentional change.
3. Keep content in `src/data/encounters.js`; avoid embedding new questions in UI logic.
4. Add or update tests for encounter changes; run `npm test` after edits.
5. Keep the app runnable locally with `npm run dev` and no required paid API access.
6. Do not execute player-submitted code in the browser. A real-code boss needs an isolated sandbox and safe test runner before activation.
7. Do not hardcode secrets or commit keys. Ask before adding network calls or third-party services.
8. When making a significant refactor, verify movement, attacks, 12-second defence and final boss still work.
9. Prefer small, reviewable changes; explain what changed and how you verified it.
10. For Codex, SDK, model, API or permission questions, check current official docs rather than assuming the current interface.

## Next good improvements
- Improve the hand-drawn canvas scenery and character animation.
- Modularise the game loop further (movement, battles, map renderer).
- Add saved progress using localStorage with reset control.
- Build deterministic tests for combat state, timer expiry and boss validation.
- Replace pattern-based final boss validation with sandboxed tests when ready.
