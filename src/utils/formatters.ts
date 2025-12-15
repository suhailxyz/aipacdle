/**
 * Format a number as USD currency
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate percentage error between guess and actual
 */
export function calculatePercentageError(guess: number, actual: number): number {
  if (actual === 0) return 100;
  return Math.abs((actual - guess) / actual) * 100;
}

/**
 * Rating system configuration
 * Easily tweakable thresholds and criteria
 */
export const RATING_CONFIG = {
  // Bullseye threshold (within 5%)
  bullseyeThreshold: 5,
  
  // Grade thresholds based on guess count for bullseye
  sGrade: { maxGuesses: 1, requiresBullseye: true }, // S = bullseye within 1 guess
  aGrade: { maxGuesses: 3, requiresBullseye: true },   // A = bullseye within 3 guesses
  bGrade: { maxGuesses: 5, requiresBullseye: true },  // B = bullseye within 5 guesses
  
  // Grade thresholds based on percentage error
  cGrade: { maxPercentageError: 10 },  // C = final guess within 10%
  dGrade: { maxPercentageError: 15 },  // D = final guess within 15%
  
  // F = none of the above or forfeit
} as const;

export type RatingGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Get star rating for a grade
 * 5-star system: D=1, C=2, B=3, A=4, S=5, F=0
 */
export function getStarRating(grade: RatingGrade): number {
  const starRatings: Record<RatingGrade, number> = {
    'S': 5,
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1,
    'F': 0,
  };
  return starRatings[grade];
}

/**
 * Get rating grade based on guesses, percentage error, and forfeit status
 */
export function getRatingGrade(
  guesses: number[],
  percentageError: number,
  isForfeit: boolean = false
): RatingGrade {
  // F for forfeit
  if (isForfeit) return 'F';
  
  const isBullseye = percentageError <= RATING_CONFIG.bullseyeThreshold;
  const guessCount = guesses.length;
  
  // Check bullseye-based grades (S, A, B)
  if (isBullseye) {
    if (guessCount <= RATING_CONFIG.sGrade.maxGuesses) return 'S';
    if (guessCount <= RATING_CONFIG.aGrade.maxGuesses) return 'A';
    if (guessCount <= RATING_CONFIG.bGrade.maxGuesses) return 'B';
  }
  
  // Check percentage-based grades (C, D)
  if (percentageError <= RATING_CONFIG.cGrade.maxPercentageError) return 'C';
  if (percentageError <= RATING_CONFIG.dGrade.maxPercentageError) return 'D';
  
  // F for none of the above
  return 'F';
}

/**
 * Calculate how long an amount could feed a family of four
 * Based on average monthly food cost for family of 4 (~$1,000/month according to USDA)
 */
export function calculateFeedingTime(amount: number): string {
  const MONTHLY_FOOD_COST = 1000; // Average monthly food cost for family of 4
  const months = amount / MONTHLY_FOOD_COST;
  
  if (months < 1) {
    // Less than a month, show in weeks
    const weeks = Math.round(months * 4.33); // Average weeks per month
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  } else if (months < 12) {
    // Less than a year, show months
    const roundedMonths = Math.round(months * 10) / 10; // Round to 1 decimal
    if (roundedMonths === Math.floor(roundedMonths)) {
      return `${Math.floor(roundedMonths)} ${Math.floor(roundedMonths) === 1 ? 'month' : 'months'}`;
    }
    return `${roundedMonths} months`;
  } else {
    // A year or more
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round((months % 12) * 10) / 10;
    
    // If more than 2 years, just show "over X years"
    if (years > 2) {
      return `over ${years} years`;
    }
    
    // For 1-2 years, show years and months if there are significant months
    if (remainingMonths < 0.5) {
      // Less than half a month, just show years
      return years === 1 ? '1 year' : `${years} years`;
    } else if (remainingMonths < 1) {
      // Less than a month, just show years
      return years === 1 ? '1 year' : `${years} years`;
    } else {
      // Show years and months for 1-2 years
      const monthsRounded = Math.round(remainingMonths);
      if (years === 0) {
        return monthsRounded === 1 ? '1 month' : `${monthsRounded} months`;
      }
      const yearText = years === 1 ? '1 year' : `${years} years`;
      const monthText = monthsRounded === 1 ? '1 month' : `${monthsRounded} months`;
      return `${yearText} and ${monthText}`;
    }
  }
}

