# Codex Quest roadmap

## MVP (current)
- [x] Side-scrolling forest-to-mountain trail with left/right movement and a following camera.
- [x] Original pixel-art panorama and mage sprite.
- [x] Nine distinct mob sprites with interleaved prompt and code encounters.
- [x] Full-screen dragon arena for the final required boss.
- [x] Long-range beam attack and force-field defence effects.
- [x] Animated in-scene question, answer and defence overlay.
- [x] Seven normal mobs: multiple-choice Codex prompting.
- [x] Timed defensive decisions (12 seconds).
- [x] Two elite mobs: choose TypeScript/Codex SDK code.
- [x] Final typed-code boss (110 seconds, structural checks only).
- [x] Separate encounter content, game script and CSS for ongoing development.

## Next iteration
- [ ] Add state-machine tests for combat, timeouts and progress.
- [ ] Add mage run, slash and shield sprite frames for more expressive animation.
- [ ] Improve combat pacing and make attack/defence animations more expressive.
- [ ] Save progress locally; add restart and difficulty options.
- [ ] Improve encounter scoring explanations and hints.
- [ ] Cleanly separate rendering, exploration and battle state.
- [ ] Create a second dungeon with fresh Codex concepts.

## Later
- [ ] Add Monaco/CodeMirror editor for code battles.
- [ ] Build isolated, resource-limited code execution for boss tests.
- [ ] Introduce real Codex SDK integration behind a backend, with no API keys in browser code.
- [ ] Use evaluation rubrics rather than brittle string matching for typed solutions.
- [ ] Add richer art/audio only after the learning loop feels good.
