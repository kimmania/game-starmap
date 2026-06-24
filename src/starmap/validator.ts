import type { GameState } from './types';

function neighbors(r: number, c: number, size: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

export function getViolationCells(
  grid: string[][],
  regions: number[][],
): { row: number; col: number }[] {
  const size = grid.length;
  const violations: { row: number; col: number }[] = [];
  const violationSet = new Set<string>();

  // Row / column counts
  for (let r = 0; r < size; r++) {
    const starsInRow: number[] = [];
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'star') starsInRow.push(c);
    }
    if (starsInRow.length > 2) {
      for (const c of starsInRow) violationSet.add(`${r},${c}`);
    }
  }
  for (let c = 0; c < size; c++) {
    const starsInCol: number[] = [];
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 'star') starsInCol.push(r);
    }
    if (starsInCol.length > 2) {
      for (const r of starsInCol) violationSet.add(`${r},${c}`);
    }
  }

  // Region counts
  const regionStars: Map<number, [number, number][]> = new Map();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'star') {
        const rid = regions[r][c];
        const arr = regionStars.get(rid) || [];
        arr.push([r, c]);
        regionStars.set(rid, arr);
      }
    }
  }
  for (const [, cells] of regionStars) {
    if (cells.length > 2) {
      for (const [r, c] of cells) violationSet.add(`${r},${c}`);
    }
  }

  // Touching (including diagonal)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 'star') continue;
      for (const [nr, nc] of neighbors(r, c, size)) {
        if (grid[nr][nc] === 'star') {
          violationSet.add(`${r},${c}`);
          violationSet.add(`${nr},${nc}`);
        }
      }
    }
  }

  for (const key of violationSet) {
    const [rs, cs] = key.split(',');
    violations.push({ row: parseInt(rs, 10), col: parseInt(cs, 10) });
  }
  return violations;
}

export function isComplete(state: GameState): boolean {
  const size = state.size;
  const grid = state.grid;
  // check row counts
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) if (grid[r][c] === 'star') count++;
    if (count !== 2) return false;
  }
  // check col counts
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) if (grid[r][c] === 'star') count++;
    if (count !== 2) return false;
  }
  // no touching
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 'star') continue;
      for (const [nr, nc] of neighbors(r, c, size)) {
        if (grid[nr][nc] === 'star') return false;
      }
    }
  }
  // region counts
  const regionCounts: Map<number, number> = new Map();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'star') {
        const rid = state.regions[r][c];
        regionCounts.set(rid, (regionCounts.get(rid) || 0) + 1);
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rid = state.regions[r][c];
      if ((regionCounts.get(rid) || 0) !== 2) return false;
    }
  }
  return true;
}
