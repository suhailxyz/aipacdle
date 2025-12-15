/**
 * Save guesses array for a specific date
 */
export function saveGuesses(date: string, guesses: number[]): void {
  localStorage.setItem(`aipac.cash:${date}:guesses`, JSON.stringify(guesses));
}

/**
 * Get saved guesses for a specific date
 */
export function getGuesses(date: string): number[] {
  const stored = localStorage.getItem(`aipac.cash:${date}:guesses`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save guess for a specific date (legacy - for backwards compatibility)
 */
export function saveGuess(date: string, guess: number): void {
  const guesses = getGuesses(date);
  guesses.push(guess);
  saveGuesses(date, guesses);
}

/**
 * Get saved guess for a specific date (legacy - returns last guess)
 */
export function getGuess(date: string): number | null {
  const guesses = getGuesses(date);
  return guesses.length > 0 ? guesses[guesses.length - 1] : null;
}

/**
 * Check if puzzle has been revealed for a specific date
 */
export function isRevealed(date: string): boolean {
  return localStorage.getItem(`aipac.cash:${date}:revealed`) === 'true';
}

/**
 * Mark puzzle as revealed for a specific date
 */
export function saveReveal(date: string): void {
  localStorage.setItem(`aipac.cash:${date}:revealed`, 'true');
}

/**
 * Clear all data for a specific date (reset puzzle)
 */
export function clearPuzzleData(date: string): void {
  localStorage.removeItem(`aipac.cash:${date}:guesses`);
  localStorage.removeItem(`aipac.cash:${date}:guess`);
  localStorage.removeItem(`aipac.cash:${date}:revealed`);
  localStorage.removeItem(`aipac.cash:${date}:bullseye-shown`);
}


