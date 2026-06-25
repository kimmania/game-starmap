import type { GameState } from '../starmap/types';
import { getViolationCells } from '../starmap/validator';

interface BoardElements {
  container: HTMLElement;
  cells: HTMLElement[][];
}

export function createBoard(container: HTMLElement): BoardElements {
  return { container, cells: [] };
}

function ensureSize(board: BoardElements, size: number): void {
  if (board.cells.length === size && board.cells[0]?.length === size) return;

  board.container.innerHTML = '';
  board.container.style.setProperty('--board-n', String(size));
  board.container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  board.container.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  const cells: HTMLElement[][] = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.setAttribute('role', 'gridcell');
      board.container.appendChild(cell);
      cells[r][c] = cell;
    }
  }
  board.cells = cells;
}

export function renderBoard(board: BoardElements, state: GameState): void {
  ensureSize(board, state.size);

  const violations = getViolationCells(state.grid, state.regions);
  const violationSet = new Set(violations.map((v) => `${v.row},${v.col}`));

  // Build given lookup
  const givenSet = new Set(
    (state.givens || []).map((g) => `${g.row},${g.col}`),
  );

  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      const cell = board.cells[r][c];
      const st = state.grid[r][c];
      const myRegion = state.regions[r][c];

      cell.className = 'cell';

      if (st === 'star') cell.classList.add('star');
      else if (st === 'empty') cell.classList.add('empty');
      else cell.classList.add('unknown');

      const shades = ['shade-a', 'shade-b', 'shade-c', 'shade-d'];
      cell.classList.add(shades[myRegion % shades.length]);

      if (givenSet.has(`${r},${c}`)) {
        cell.classList.add('given');
      }

      if (violationSet.has(`${r},${c}`)) {
        cell.classList.add('violation');
      }

      if (r === 0 || state.regions[r - 1][c] !== myRegion) {
        cell.classList.add('border-top');
      }
      if (c === state.size - 1 || state.regions[r][c + 1] !== myRegion) {
        cell.classList.add('border-right');
      }
      if (r === state.size - 1 || state.regions[r + 1][c] !== myRegion) {
        cell.classList.add('border-bottom');
      }
      if (c === 0 || state.regions[r][c - 1] !== myRegion) {
        cell.classList.add('border-left');
      }
    }
  }

  // Clear old counters
  board.container.querySelectorAll('.row-counter, .col-counter').forEach((el) => el.remove());

  // Row counters (right edge of each row)
  for (let r = 0; r < state.size; r++) {
    const rowStars = state.grid[r].filter((s) => s === 'star').length;
    const counter = document.createElement('span');
    counter.className = 'row-counter';
    counter.textContent = `${rowStars}/2`;
    if (rowStars === 2) counter.classList.add('complete');
    else if (rowStars === 1) counter.classList.add('partial');
    board.cells[r][state.size - 1].appendChild(counter);
  }

  // Column counters (bottom edge of each column)
  for (let c = 0; c < state.size; c++) {
    let colStars = 0;
    for (let r = 0; r < state.size; r++) {
      if (state.grid[r][c] === 'star') colStars++;
    }
    const counter = document.createElement('span');
    counter.className = 'col-counter';
    counter.textContent = `${colStars}/2`;
    if (colStars === 2) counter.classList.add('complete');
    else if (colStars === 1) counter.classList.add('partial');
    board.cells[state.size - 1][c].appendChild(counter);
  }
}

export function bindBoardInteractions(
  board: BoardElements,
  onTap: (row: number, col: number) => void,
): void {
  board.container.addEventListener('pointerup', (e) => {
    const target = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (!target) return;
    const row = parseInt(target.dataset.row ?? '', 10);
    const col = parseInt(target.dataset.col ?? '', 10);
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    onTap(row, col);
  });

  board.container.addEventListener('contextmenu', (e) => e.preventDefault());
}
