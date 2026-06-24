export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export type CellState = 'unknown' | 'star' | 'empty'; // empty = X mark

export interface Puzzle {
  id: string;
  size: number;
  regions: number[][]; // row-major region IDs
  solution: string; // row-major bit string, '1' = star
}

export interface GameState {
  size: number;
  grid: CellState[][];
  regions: number[][];
  solution: string;
  puzzleId: string;
  difficulty: Difficulty;
  mistakes: number;
  won: boolean;
  history: string[]; // previous grid snapshots
  givens: { row: number; col: number }[];
}

export const DIFFICULTIES: Difficulty[] = ['tutorial', 'easy', 'medium', 'hard', 'expert', 'master'];

export const DIFFICULTY_GIVENS: Record<Difficulty, number> = {
  tutorial: 6,
  easy: 2,
  medium: 1,
  hard: 0,
  expert: 0,
  master: 0,
};

export const STORAGE_KEY = 'starmap-save';
export const RECENT_KEY = 'starmap-recent';
