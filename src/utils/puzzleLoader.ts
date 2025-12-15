export interface PuzzleData {
  date: string;
  name: string;
  subtitle: string;
  image: string;
  amount: number;
  party?: 'D' | 'R';
  note?: string;
  source: string;
  sourceLabel: string;
  range?: {
    min: number;
    max: number;
  };
}

export interface PuzzleIndex {
  dates: string[];
}

/**
 * Get current date in America/New_York timezone
 */
export function getTodayDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Load puzzle data for a specific date
 */
export async function loadPuzzle(date: string): Promise<PuzzleData | null> {
  const baseUrl = import.meta.env.BASE_URL;
  const url = `${baseUrl}puzzles/${date}.json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as PuzzleData;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Failed to load puzzle for ${date}:`, error);
    }
    return null;
  }
}

/**
 * Load puzzle index
 */
export async function loadPuzzleIndex(): Promise<PuzzleIndex | null> {
  const baseUrl = import.meta.env.BASE_URL;
  const url = `${baseUrl}puzzles/index.json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as PuzzleIndex;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load puzzle index:', error);
    }
    return null;
  }
}

/**
 * Get the latest available puzzle date
 */
export async function getLatestPuzzleDate(): Promise<string | null> {
  const index = await loadPuzzleIndex();
  if (!index || !index.dates || index.dates.length === 0) {
    return null;
  }
  
  // Sort dates descending and return the latest
  const sortedDates = [...index.dates].sort((a, b) => b.localeCompare(a));
  return sortedDates[0];
}

/**
 * Load puzzle for today, or fallback to latest available
 */
export async function loadTodayPuzzle(): Promise<PuzzleData | null> {
  const today = getTodayDate();
  
  // Try today's puzzle first
  const todayPuzzle = await loadPuzzle(today);
  if (todayPuzzle) {
    return todayPuzzle;
  }
  
  // Fallback to latest available
  const latestDate = await getLatestPuzzleDate();
  if (latestDate) {
    return await loadPuzzle(latestDate);
  }
  
  return null;
}

