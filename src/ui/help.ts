const TUTORIAL_SIZE = 6;

const TUTORIAL_STATES = [
  {
    label:
      'Board at start — cells are gray (unknown). Your goal: place two stars in every row, column, and region. No two stars may touch, even diagonally.',
    grid: [
      '??????',
      '??????',
      '??????',
      '??????',
      '??????',
      '??????',
    ],
  },
  {
    label:
      'Placing a star in the top-left corner immediately forces all 8 surrounding cells to be empty (X). Region borders help you see which cells belong together.',
    grid: [
      'SXXXXX',
      'XXXXXX',
      '??????',
      '??????',
      '??????',
      '??????',
    ],
  },
  {
    label:
      'When a row already has two stars (⭐ ⭐), the rest of that row is automatically eliminated.',
    grid: [
      'SXXSXX',
      'XXXXXX',
      '??????',
      '??????',
      '??????',
      '??????',
    ],
  },
  {
    label:
      'Finished — every row, column, and region has exactly two stars, and no two stars are adjacent. Every empty cell is marked with an X.',
    grid: [
      'SXSXSX',
      'XSXXSX',
      'SXSXXX',
      'XSXXSX',
      'SXSXXX',
      'XXSXSX',
    ],
  },
];

function makeMiniBoard(state: (typeof TUTORIAL_STATES)[number]): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'tutorial-board-wrapper';

  const grid = document.createElement('div');
  grid.className = 'mini-board';
  grid.style.gridTemplateColumns = `repeat(${TUTORIAL_SIZE}, 1fr)`;

  for (let r = 0; r < TUTORIAL_SIZE; r++) {
    for (let c = 0; c < TUTORIAL_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'mini-cell';
      const code = state.grid[r][c];
      if (code === 'S') cell.classList.add('star');
      else if (code === 'X') cell.classList.add('empty');
      if (r === 0 || r === TUTORIAL_SIZE - 1 || c === 0 || c === TUTORIAL_SIZE - 1 || (r + c) % 3 === 0) {
        cell.classList.add('shaded');
      }
      grid.appendChild(cell);
    }
  }

  const caption = document.createElement('p');
  caption.className = 'tutorial-caption';
  caption.textContent = state.label;

  wrapper.appendChild(grid);
  wrapper.appendChild(caption);
  return wrapper;
}

export function openHelp(): void {
  if (document.getElementById('help-dialog')) return;

  const dialog = document.createElement('div');
  dialog.id = 'help-dialog';

  const inner = document.createElement('div');
  inner.className = 'help-inner';
  inner.innerHTML = `
    <h2>How to play Star Map</h2>
    <p><strong>Goal:</strong> Place exactly two stars in every row, every column, and every colored region. No two stars may touch — not even diagonally.</p>
    <ul style="padding-left:18px;margin:8px 0;">
      <li>Tap a cell to cycle: unknown → star → empty (X) → unknown.</li>
      <li>Long-press a cell to mark it with an X (definitely no star).</li>
      <li>Stars will pulse red if they violate a rule: too many in a row/column/region, or touching another star.</li>
      <li>Region boundaries are shown with thick borders.</li>
      <li>You must place exactly 2 stars per row, 2 per column, and 2 per region.</li>
    </ul>
    <p><strong>Tips:</strong> If a region only has a few cells left and already has one star, the second star is constrained. When a row reaches two stars, mark the rest of the row as empty.</p>
    <h3 style="margin-top:12px;font-size:1.1rem;">Visual walkthrough</h3>
  `;

  const walkthrough = document.createElement('div');
  walkthrough.className = 'tutorial-walkthrough';

  TUTORIAL_STATES.forEach((state) => {
    walkthrough.appendChild(makeMiniBoard(state));
  });

  inner.appendChild(walkthrough);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-help';
  closeBtn.className = 'btn btn-primary';
  closeBtn.style.cssText = 'margin-top:10px;width:100%';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => dialog.remove());
  inner.appendChild(closeBtn);

  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.appendChild(inner);
  dialog.appendChild(overlay);

  dialog.addEventListener('click', (e) => {
    if (e.target === overlay) dialog.remove();
  });

  document.body.appendChild(dialog);
}

export function closeHelp(): void {
  document.getElementById('help-dialog')?.remove();
}
