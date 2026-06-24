import type { Difficulty } from '../starmap/types';

export function bindControlHandlers(options: {
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onHint: () => void;
  onHelp: () => void;
  onDifficultyChange: () => void;
  onModeToggle: () => void;
  onAutoAssistChange: (enabled: boolean) => void;
}): void {
  document.getElementById('new-game')?.addEventListener('click', options.onNewGame);
  document.getElementById('reset')?.addEventListener('click', options.onReset);
  document.getElementById('undo')?.addEventListener('click', options.onUndo);
  document.getElementById('hint')?.addEventListener('click', options.onHint);
  document.getElementById('help')?.addEventListener('click', options.onHelp);
  document.getElementById('difficulty')?.addEventListener('change', options.onDifficultyChange);
  document.getElementById('mode-toggle')?.addEventListener('click', options.onModeToggle);
  const aa = document.getElementById('auto-assist') as HTMLInputElement | null;
  aa?.addEventListener('change', () => options.onAutoAssistChange(aa.checked));
}

export function getSelectedDifficulty(): Difficulty {
  const el = document.getElementById('difficulty') as HTMLSelectElement | null;
  return (el?.value ?? 'easy') as Difficulty;
}

export function setDifficulty(value: Difficulty): void {
  const el = document.getElementById('difficulty') as HTMLSelectElement | null;
  if (el) el.value = value;
}

export function updateDifficultyLabel(label: string): void {
  const el = document.getElementById('difficulty-label');
  if (el) el.textContent = label;
}

export function updateMistakes(count: number): void {
  const el = document.getElementById('mistakes');
  if (el) {
    el.textContent = `Mistakes: ${count}`;
    el.setAttribute('data-count', String(count));
  }
}

export function showWinBanner(show: boolean): void {
  const el = document.getElementById('win-banner');
  if (el) el.classList.toggle('hidden', !show);
}

export function updatePuzzleId(id: string): void {
  const el = document.getElementById('puzzle-id');
  if (el) el.textContent = id;
}

export function setUndoEnabled(enabled: boolean): void {
  const el = document.getElementById('undo') as HTMLButtonElement | null;
  if (el) el.disabled = !enabled;
}

export function setHintVisible(visible: boolean): void {
  const el = document.getElementById('hint') as HTMLButtonElement | null;
  if (el) el.classList.toggle('hidden', !visible);
}

export function setHintEnabled(enabled: boolean): void {
  const el = document.getElementById('hint') as HTMLButtonElement | null;
  if (el) el.disabled = !enabled;
}

export function setModeButton(mode: 'star' | 'empty'): void {
  const el = document.getElementById('mode-toggle') as HTMLButtonElement | null;
  if (!el) return;
  el.dataset.mode = mode;
  el.textContent = mode === 'star' ? '⭐' : '✕';
  el.classList.toggle('x-mode', mode === 'empty');
}

export function setAutoAssistChecked(checked: boolean): void {
  const el = document.getElementById('auto-assist') as HTMLInputElement | null;
  if (el) el.checked = checked;
}
