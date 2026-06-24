import type { CellState, GameState } from './starmap/types';
import { fetchBank, resetGameState, startNewGame } from './starmap/puzzle';
import { clearSavedGame, loadSavedGame, saveGame } from './starmap/storage';
import { getViolationCells, isComplete } from './starmap/validator';
import { bindBoardInteractions, createBoard, renderBoard } from './ui/board';
import {
  bindControlHandlers,
  getSelectedDifficulty,
  setDifficulty,
  setUndoEnabled,
  showWinBanner,
  updateDifficultyLabel,
  updateMistakes,
  updatePuzzleId,
} from './ui/controls';
import { closeHelp, openHelp } from './ui/help';

class StarMapApp {
  private state: GameState | null = null;
  private board = createBoard(document.getElementById('board')!);
  private loading = false;
  private previousGrid: CellState[][] | null = null;

  async init(): Promise<void> {
    fetchBank('easy').catch(() => {});

    bindBoardInteractions(
      this.board,
      (row, col) => this.handleTap(row, col),
      (row, col) => this.handleLongPress(row, col),
    );

    bindControlHandlers({
      onNewGame: () => void this.newGame(),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
      onHelp: () => openHelp(),
      onDifficultyChange: () => void this.newGame(),
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    const saved = loadSavedGame();
    if (saved && saved.grid && saved.regions && saved.difficulty && !saved.won) {
      this.state = saved as GameState;
      setDifficulty(saved.difficulty);
      this.refresh();
    } else {
      await this.newGame();
    }

    if (!localStorage.getItem('starmap-has-seen-help')) {
      openHelp();
      localStorage.setItem('starmap-has-seen-help', '1');
    }
  }

  private async newGame(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    clearSavedGame();
    this.previousGrid = null;
    closeHelp();

    try {
      const difficulty = getSelectedDifficulty();
      this.state = await startNewGame(difficulty);
      this.refresh();
    } catch (err) {
      console.error(err);
      alert('Could not load a puzzle. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private handleReset(): void {
    if (!this.state) return;
    resetGameState(this.state);
    this.previousGrid = null;
    this.refresh();
  }

  private stashUndo(): void {
    if (!this.state || this.state.won) return;
    this.previousGrid = this.state.grid.map((row) => [...row]);
  }

  private handleTap(row: number, col: number): void {
    if (!this.state || this.state.won) return;
    this.stashUndo();
    const current = this.state.grid[row][col];
    const next: CellState =
      current === 'unknown' ? 'star' : current === 'star' ? 'empty' : 'unknown';
    this.state.grid[row][col] = next;
    this.refresh();
  }

  private handleLongPress(row: number, col: number): void {
    if (!this.state || this.state.won) return;
    this.stashUndo();
    // Long-press always forces empty (X)
    this.state.grid[row][col] = 'empty';
    this.refresh();
  }

  private handleUndo(): void {
    if (!this.state || !this.previousGrid) return;
    this.state.grid = this.previousGrid;
    this.previousGrid = null;
    this.refresh();
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (document.querySelector('#help-dialog')) {
      if (e.key === 'Escape') closeHelp();
      return;
    }
    if (!this.state || this.state.won) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      this.handleUndo();
    }
  }

  private computeMistakes(): number {
    if (!this.state) return 0;
    const violations = getViolationCells(this.state.grid, this.state.regions);
    return violations.length;
  }

  private refresh(): void {
    if (!this.state) return;

    renderBoard(this.board, this.state);

    const mistakes = this.computeMistakes();
    this.state.mistakes = mistakes;
    updateMistakes(mistakes);
    updatePuzzleId(this.state.puzzleId);
    setUndoEnabled(this.previousGrid !== null);
    updateDifficultyLabel(
      this.state.difficulty.charAt(0).toUpperCase() + this.state.difficulty.slice(1),
    );

    if (!this.state.won && isComplete(this.state)) {
      this.state.won = true;
      showWinBanner(true);
      clearSavedGame();
      renderBoard(this.board, this.state);
    } else if (!this.state.won) {
      showWinBanner(false);
      saveGame(this.state);
    }
  }
}

export async function bootstrap(): Promise<void> {
  const app = new StarMapApp();
  await app.init();
}
