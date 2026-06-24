# Star Map v1.1 Plan — Tutorial, Givens, Hints & Counters

## Objective
Make the game approachable for new players while preserving challenge on higher difficulties.

## Changes

### 1. Tutorial puzzle count
- Reduce `tutorial` bank from 500 → **2 puzzles**.
- Re-run generator and commit new `tutorial.json`.

### 2. Pre-revealed stars (“givens”)
Add a `givens: {row:number; col:number}[]` list to `GameState`, computed when a puzzle is started.
-** Tutorial **: 6 givens
- ** Easy **: 2 givens
- ** Medium **: 2 givens
- ** Hard / Expert / Master **: 0 givens

Givens are chosen randomly from the puzzle solution. They are rendered with a subtle golden ring and are **non-interactive** (tap/long-press ignored). On reset, givens are restored.

### 3. Hint button
- New control **“Hint”** next to Undo.
- Clicking it reveals **one** unrevealed correct star from the solution.
- No limit on hints (keeps it casual). Could be capped later if desired.
- Hints respect givens (won’t re-reveal a given).

### 4. Row & column star counters
- Small `n/2` text at the **right edge** of every row and **bottom edge** of every column.
- Color: green when `2/2`, amber when `1/2`, subtle gray when `0/2`.
- Updates live after every move.

### 5. First-time tutorial experience
- On the very first tutorial game, show a brief inline toast: _“Stars you didn’t place are ‘givens’ — they can’t be moved. Tap other cells to start solving.”_

## Implementation path
1. `scripts/generate_puzzles.py` — change tutorial count.
2. `src/starmap/types.ts` — add `givens` to `GameState`, add `DIFFICULTY_GIVENS` map.
3. `src/starmap/puzzle.ts` — randomly select givens from solution in `startNewGame`.
4. `src/starmap/storage.ts` — persist `givens` in save/load.
5. `src/ui/board.ts` — render given style; inject row/col counter nodes.
6. `src/ui/controls.ts` — bind hint button, update counters.
7. `src/app.ts` — skip tap/long-press on givens; wire hint handler; handle reset correctly.
8. `index.html` — add Hint button, counter placeholder.
9. `src/style.css` — style givens, counters, hint button.
10. Regenerate puzzle banks, rebuild, commit.

## Files touched
- `scripts/generate_puzzles.py`
- `src/starmap/types.ts`
- `src/starmap/puzzle.ts`
- `src/starmap/storage.ts`
- `src/ui/board.ts`
- `src/ui/controls.ts`
- `src/app.ts`
- `index.html`
- `src/style.css`
- `public/puzzles/tutorial.json`
