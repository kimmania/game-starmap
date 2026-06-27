import type { GameState } from './types';
import { STORAGE_KEY } from './types';

export function saveGame(state: GameState): void {
  try {
    const snapshot = {
      puzzleId: state.puzzleId,
      difficulty: state.difficulty,
      size: state.size,
      grid: state.grid,
      regions: state.regions,
      solution: state.solution,
      mistakes: state.mistakes,
      won: state.won,
      givens: state.givens,
      deduced: state.deduced,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage may be full or unavailable
  }
}

export function loadSavedGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
