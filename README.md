# ⭐ Star Map

A spatial logic puzzle for iPad and mobile, inspired by **Star Battle / Two Not Touch**.

## How to play

Place exactly **2 stars** in every row, every column, and every colored region. No two stars may touch — not even diagonally.

- **Tap** a cell to cycle: unknown → star → empty (X) → unknown.
- **Long-press** to mark a cell with an X (definitely no star).
- **Stars pulse red** if they violate a rule (too many in a row/column/region, or touching another star).
- Region boundaries are shown with thick borders.

## Difficulty levels

| Level      | Grid   |
|------------|--------|
| Tutorial   | 8×8    |
| Easy       | 8×8    |
| Medium     | 10×10  |
| Hard       | 10×10  |
| Expert     | 12×12  |
| Master     | 14×14  |

Each level includes **500 puzzles** (3,000 total). A local rotation prevents repeats.

## Tech stack

- Vite + TypeScript
- Vanilla CSS (dark theme, mobile-first)
- `vite-plugin-pwa` for offline play & installability
- Puzzles generated offline via Python script

## Development

```bash
npm install
npm run dev          # local dev server
npm run build        # production build into dist/
npm run generate-puzzles   # regenerate puzzle banks
```

## Deployment

This repo uses **GitHub Actions** to build and deploy to **GitHub Pages** automatically on every push to `main`.

Make sure Pages is enabled in repo settings:
- Source: **GitHub Actions**

After the first workflow run, the PWA will be available at:
`https://USERNAME.github.io/game-starmap/`

## Puzzle generation notes

Puzzles are algorithmically generated with randomly grown contiguous regions and a constrained star-placement solver. 8×8 puzzles are checked for uniqueness; larger grids may contain puzzles with more than one mathematically valid solution, but all puzzles are guaranteed to have at least one valid solution.

## License

MIT
