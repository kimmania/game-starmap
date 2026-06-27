import type { CellState, Difficulty, GameState, Puzzle } from './types';
import { DIFFICULTY_GIVENS, RECENT_KEY } from './types';

const banks: Record<Difficulty, Puzzle[] | null> = {
  tutorial: null,
  easy: null,
  hard: null,
};

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecent(id: string, max = 20): void {
  try {
    const recent = [id, ...getRecent().filter((x: string) => x !== id)].slice(0, max);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

export async function fetchBank(difficulty: Difficulty): Promise<Puzzle[]> {
  if (banks[difficulty]) return banks[difficulty]!;
  const stamp = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : Date.now();
  const base = import.meta.env.BASE_URL;
  const url = `${base}puzzles/${difficulty}.json?v=${stamp}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${difficulty} puzzles: ${res.status}`);
  const data = (await res.json()) as Puzzle[];
  banks[difficulty] = data;
  return data;
}

export function createGameState(puzzle: Puzzle, difficulty: Difficulty): GameState {
  const size = puzzle.size;
  const grid: CellState[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'unknown'),
  );
  const deduced: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
  return {
    size,
    grid,
    regions: puzzle.regions,
    solution: puzzle.solution,
    puzzleId: puzzle.id,
    difficulty,
    mistakes: 0,
    won: false,
    givens: [],
    deduced,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startNewGame(difficulty: Difficulty): Promise<GameState> {
  const bank = await fetchBank(difficulty);
  const recent = getRecent();
  const candidates = bank.filter((p) => !recent.includes(p.id));
  const pool = candidates.length > 0 ? candidates : bank;
  const puzzle = pool[Math.floor(Math.random() * pool.length)];
  addRecent(puzzle.id);
  const state = createGameState(puzzle, difficulty);

  const givenCount = DIFFICULTY_GIVENS[difficulty];
  if (givenCount > 0) {
    const stars: [number, number][] = [];
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (state.solution[r * state.size + c] === '1') {
          stars.push([r, c]);
        }
      }
    }
    if (stars.length >= givenCount) {
      shuffleArray(stars);
      state.givens = stars.slice(0, givenCount).map(([r, c]) => ({ row: r, col: c }));
      for (const g of state.givens) {
        state.grid[g.row][g.col] = 'star';
      }
    }
  }

  return state;
}

export function resetGameState(state: GameState): void {
  const size = state.size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      state.grid[r][c] = 'unknown';
      state.deduced[r][c] = false;
    }
  }
  // Restore givens
  for (const g of state.givens || []) {
    state.grid[g.row][g.col] = 'star';
  }
  state.won = false;
  state.mistakes = 0;
}
