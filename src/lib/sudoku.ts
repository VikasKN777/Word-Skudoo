
export type Grid = (number | null)[][];

export const WORDS_9 = [
  "ALGORITHM",
  "COPYRIGHT",
  "PATHFINDER",
  "BACKGROUND",
  "BLACKSMITH",
  "COMPLAINT",
  "DUPLICATE",
  "EDUCATION",
  "FAVORITES",
  "NIGHTMARE",
  "SECONDARY",
  "SIGNATURE",
  "VOLCANISM",
  "WORKSPACE",
  "ADULTERATE", // Wait, these are 10. Let me stick to 9.
  "AMPLITUDE",
  "BIRTHDAYS",
  "CHAMPIONS",
  "DAUGHTERS",
  "FLAMINGOS",
  "HARMONIZE",
  "JOURNALED",
  "KNIGHTDOM",
  "LABYRINTH",
  "MOTHBOARD",
  "OUTSPREAD",
  "PLAYGROUND", // 10
  "QUESTION", // 8
  "REPUBLICAN", // 10
];

// Filter to ensure they are exactly 9 unique letters
export const VALID_WORDS = WORDS_9.filter(w => {
  const s = new Set(w.split(""));
  return w.length === 9 && s.size === 9;
});

export function generateSudoku(): { puzzle: Grid; solution: Grid; word: string } {
  const solution: Grid = Array(9).fill(null).map(() => Array(9).fill(null));
  
  // Fill the grid
  fillGrid(solution);
  
  const word = VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
  
  // Create puzzle by removing elements
  const puzzle: Grid = solution.map(row => [...row]);
  const attempts = 40; // Difficulty: higher = fewer clues
  let count = attempts;
  while (count > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      count--;
    }
  }
  
  return { puzzle, solution, word };
}

function fillGrid(grid: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    if (grid[row][col] === null) {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (const num of numbers) {
        if (isValid(grid, row, col, num)) {
          grid[row][col] = num;
          if (fillGrid(grid)) return true;
          grid[row][col] = null;
        }
      }
      return false;
    }
  }
  return true;
}

export function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }
  
  // Check col
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }
  
  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  
  return true;
}

export function isComplete(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) return false;
      const val = grid[r][c]!;
      grid[r][c] = null;
      if (!isValid(grid, r, c, val)) {
        grid[r][c] = val;
        return false;
      }
      grid[r][c] = val;
    }
  }
  return true;
}
