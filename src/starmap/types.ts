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
}

export const DIFFICULTIES: Difficulty[] = ['tutorial', 'easy', 'medium', 'hard', 'expert', 'master'];

export const STORAGE_KEY = 'starmap-save';
export const RECENT_KEY = 'starmap-recent';
