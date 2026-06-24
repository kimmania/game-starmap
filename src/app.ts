import type { CellState, GameState } from './starmap/types';
import { fetchBank, resetGameState, startNewGame } from './starmap/puzzle';
import { clearSavedGame, loadSavedGame, saveGame } from './starmap/storage';
import { getViolationCells, isComplete } from './starmap/validator';
import { bindBoardInteractions, createBoard, renderBoard } from './ui/board';
import {
  bindControlHandlers,
  getSelectedDifficulty,
  setAutoAssistChecked,
  setDifficulty,
  setHintEnabled,
  setModeButton,
  setUndoEnabled,
  showWinBanner,
  updateDifficultyLabel,
  updateMistakes,
  updatePuzzleId,
} from './ui/controls';
import { closeHelp, openHelp } from './ui/help';

const AUTO_ASSIST_KEY = 'starmap-auto-assist';

class StarMapApp {
  private state: GameState | null = null;
  private board = createBoard(document.getElementById('board')!);
  private loading = false;
  private previousGrid: CellState[][] | null = null;
  private placeMode: 'star' | 'empty' = 'star';
  private autoAssist = false;

  async init(): Promise<void> {
    fetchBank('easy').catch(() => {});

    this.autoAssist = localStorage.getItem(AUTO_ASSIST_KEY) === '1';
    setAutoAssistChecked(this.autoAssist);
    setModeButton(this.placeMode);

    bindBoardInteractions(
      this.board,
      (row, col) => this.handleTap(row, col),
      (row, col) => this.handleLongPress(row, col),
    );

    bindControlHandlers({
      onNewGame: () => void this.newGame(),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
      onHint: () => this.handleHint(),
      onHelp: () => openHelp(),
      onDifficultyChange: () => void this.newGame(),
      onModeToggle: () => this.handleModeToggle(),
      onAutoAssistChange: (enabled) => this.handleAutoAssistChange(enabled),
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    const saved = loadSavedGame();
    if (saved && saved.grid && saved.regions && saved.difficulty && !saved.won) {
      this.state = {
        ...saved,
        givens: saved.givens || [],
      } as GameState;
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

  private isGiven(row: number, col: number): boolean {
    return (
      this.state?.givens?.some((g) => g.row === row && g.col === col) ?? false
    );
  }

  private handleModeToggle(): void {
    this.placeMode = this.placeMode === 'star' ? 'empty' : 'star';
    setModeButton(this.placeMode);
  }

  private handleAutoAssistChange(enabled: boolean): void {
    this.autoAssist = enabled;
    localStorage.setItem(AUTO_ASSIST_KEY, enabled ? '1' : '0');
  }

  private applyDeductions(): void {
    if (!this.state || !this.autoAssist) return;
    const { size, grid, regions } = this.state;
    let changed = false;

    do {
      changed = false;

      // Neighbors of every star → empty
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] !== 'star') continue;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (grid[nr][nc] === 'unknown' && !this.isGiven(nr, nc)) {
                  grid[nr][nc] = 'empty';
                  changed = true;
                }
              }
            }
          }
        }
      }

      // Rows with exactly 2 stars → rest empty
      for (let r = 0; r < size; r++) {
        if (grid[r].filter((s) => s === 'star').length !== 2) continue;
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 'unknown' && !this.isGiven(r, c)) {
            grid[r][c] = 'empty';
            changed = true;
          }
        }
      }

      // Columns with exactly 2 stars → rest empty
      for (let c = 0; c < size; c++) {
        let colStars = 0;
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === 'star') colStars++;
        }
        if (colStars !== 2) continue;
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === 'unknown' && !this.isGiven(r, c)) {
            grid[r][c] = 'empty';
            changed = true;
          }
        }
      }

      // Regions with exactly 2 stars → rest empty
      const regionStars = new Map<number, number>();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 'star') {
            const rid = regions[r][c];
            regionStars.set(rid, (regionStars.get(rid) || 0) + 1);
          }
        }
      }
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const rid = regions[r][c];
          if ((regionStars.get(rid) || 0) === 2 && grid[r][c] === 'unknown' && !this.isGiven(r, c)) {
            grid[r][c] = 'empty';
            changed = true;
          }
        }
      }
    } while (changed);
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
    if (!this.state || this.state.won || this.isGiven(row, col)) return;
    this.stashUndo();
    const current = this.state.grid[row][col];
    const target = this.placeMode;
    let next: CellState;
    if (current === target) {
      next = 'unknown';
    } else if (current === 'unknown') {
      next = target;
    } else {
      next = 'unknown';
    }
    this.state.grid[row][col] = next;
    if (this.autoAssist && next === 'star') {
      this.applyDeductions();
    }
    this.refresh();
  }

  private handleLongPress(row: number, col: number): void {
    if (!this.state || this.state.won || this.isGiven(row, col)) return;
    this.stashUndo();
    const opposite = this.placeMode === 'star' ? 'empty' : 'star';
    this.state.grid[row][col] = opposite;
    if (this.autoAssist && opposite === 'star') {
      this.applyDeductions();
    }
    this.refresh();
  }

  private handleUndo(): void {
    if (!this.state || !this.previousGrid) return;
    this.state.grid = this.previousGrid;
    this.previousGrid = null;
    this.refresh();
  }

  private handleHint(): void {
    if (!this.state || this.state.won) return;
    this.stashUndo();
    const unrevealed: [number, number][] = [];
    for (let r = 0; r < this.state.size; r++) {
      for (let c = 0; c < this.state.size; c++) {
        if (
          this.state.solution[r * this.state.size + c] === '1' &&
          this.state.grid[r][c] !== 'star'
        ) {
          unrevealed.push([r, c]);
        }
      }
    }
    if (unrevealed.length === 0) return;
    const [r, c] = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.state.grid[r][c] = 'star';
    if (this.autoAssist) {
      this.applyDeductions();
    }
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
    setHintEnabled(true);
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
