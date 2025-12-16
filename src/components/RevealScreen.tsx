import { useState, useEffect, Fragment, useRef } from 'react';
import { Share2 } from 'lucide-react';
import { PuzzleData } from '../utils/puzzleLoader';
import { 
  formatUSD, 
  calculatePercentageError, 
  getRatingGrade,
  getStarRating,
  calculateFeedingTime,
  RATING_CONFIG
} from '../utils/formatters';

interface RevealScreenProps {
  puzzle: PuzzleData;
  guesses: number[];
  onShare: () => Promise<boolean>;
  onResources?: () => void;
  isForfeit?: boolean;
}

export function RevealScreen({ puzzle, guesses, onShare, onResources, isForfeit = false }: RevealScreenProps) {
  const [revealStep, setRevealStep] = useState(0);
  const [showBullseye, setShowBullseye] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasStartedBullseyeRef = useRef(false);
  const actual = puzzle.amount;
  const lastGuess = guesses[guesses.length - 1] || 0;
  const percentageError = calculatePercentageError(lastGuess, actual);
  const isBullseye = !isForfeit && percentageError <= RATING_CONFIG.bullseyeThreshold;
  const rating = getRatingGrade(guesses, percentageError, isForfeit);

  // Bullseye animation effect - runs once when isBullseye is true
  useEffect(() => {
    if (isBullseye && !hasStartedBullseyeRef.current) {
      hasStartedBullseyeRef.current = true;
      setShowBullseye(true);
      
      // Start counting animation after bullseye animation completes (2.5s)
      setTimeout(() => {
        setShowBullseye(false);
        setRevealStep(3);
        animateCount(actual);
      }, 2500);
    }
    // Only depend on isBullseye - actual won't change
  }, [isBullseye]);

  // Normal reveal animation - start counting if not bullseye
  useEffect(() => {
    if (!isBullseye && !hasStartedBullseyeRef.current) {
      const startAnimation = setTimeout(() => {
        setRevealStep(3);
        animateCount(actual);
      }, 300);

      return () => {
        clearTimeout(startAnimation);
      };
    }
    // Only depend on isBullseye - actual won't change
  }, [isBullseye]);

  const animateCount = (target: number) => {
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      setAnimatedAmount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedAmount(target);
        setIsComplete(true);
        // Reset animation state after bloom completes
        setTimeout(() => setIsComplete(false), 600);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const getRevealedAmount = (): string => {
    if (revealStep === 0) return '';
    if (revealStep === 3) {
      return formatUSD(animatedAmount);
    }
    return '';
  };

  const baseUrl = import.meta.env.BASE_URL;
  const imageUrl = puzzle.image.startsWith('/') 
    ? `${baseUrl}${puzzle.image.slice(1)}`
    : `${baseUrl}${puzzle.image}`;

  const showContextualization = actual > 10000;
  const feedingTime = showContextualization ? calculateFeedingTime(actual) : null;

  // Helper function to determine guess feedback type
  const getGuessFeedback = (guess: number): 'too-high' | 'too-low' | 'correct' | 'bullseye' => {
    if (guess === actual) return 'correct';
    const percentageError = calculatePercentageError(guess, actual);
    if (percentageError <= RATING_CONFIG.bullseyeThreshold) {
      return 'bullseye';
    }
    return guess > actual ? 'too-high' : 'too-low';
  };

  return (
    <div className="reveal-screen">
      {showBullseye && (
        <div className="bullseye-overlay">
          <div className="bullseye-container">
            <div className="bullseye-emoji">🎯</div>
          </div>
        </div>
      )}
      
      <div className="reveal-subject-section">
        <h1 className="reveal-subject-name">{puzzle.name}</h1>
        <div className="reveal-subject-name-divider"></div>
        <p className="reveal-subject-subtitle">{puzzle.subtitle}</p>
        <img 
          src={imageUrl} 
          alt={puzzle.name}
          className={`reveal-subject-image ${puzzle.party ? `reveal-subject-image-${puzzle.party.toLowerCase()}` : 'reveal-subject-image-default'}`}
        />
        {puzzle.caption && (
          <p className="reveal-subject-image-caption">{puzzle.caption}</p>
        )}
      </div>

      <div className="reveal-amount-section">
        <div className={`reveal-amount ${isComplete ? 'reveal-amount-complete' : ''}`} aria-live="polite" key={revealStep} data-step={revealStep}>
          {getRevealedAmount()}
          {showContextualization && <sup className="reveal-amount-superscript">*</sup>}
        </div>
        {showContextualization && feedingTime && (
          <div className="reveal-contextualization">
            That could feed a family of four for <strong>{feedingTime}</strong>†
          </div>
        )}
      </div>

      <div className="guesses-history-wrapper">
        <div className="report-card-heading">Report Card</div>
        <div className="grade-chip">
          <span className={`grade-chip-rating rating rating-${rating.toLowerCase()}`}>
            {rating}
          </span>
          <span className="grade-chip-stars">
            {Array.from({ length: 5 }, (_, i) => {
              const starValue = i + 1;
              const starRating = getStarRating(rating);
              const isFull = starValue <= starRating;
              
              return (
                <span key={i} className={`star ${isFull ? 'full' : 'empty'}`}>
                  ★
                </span>
              );
            })}
          </span>
        </div>
        <div className="guesses-history">
          {guesses.map((g, i) => {
          const gPercentageError = calculatePercentageError(g, actual);
          const feedback = getGuessFeedback(g);
          
          return (
            <Fragment key={i}>
              <div className="guess-item-wrapper guess-row-amount">
                <span className="guess-number-badge">{i + 1}</span>
                <div className="guess-item-container">
                  <div className={`guess-item guess-item-${feedback}`}>
                    <span className="guess-amount">{formatUSD(g)}</span>
                  </div>
                </div>
              </div>
              <div className="guess-item-wrapper guess-row-feedback">
                <span className="guess-number-badge"></span>
                <div className="guess-item-container">
                  <div className="guess-item guess-item-feedback-row">
                    <span className={`guess-feedback-text guess-feedback-text-${feedback}`}>
                    {feedback === 'correct' ? (
                      'Correct!'
                    ) : feedback === 'bullseye' ? (
                      `within ${gPercentageError.toFixed(1)}%`
                    ) : feedback === 'too-high' ? (
                      `${gPercentageError.toFixed(1)}% too high`
                    ) : (
                      `${gPercentageError.toFixed(1)}% too low`
                    )}
                    </span>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
        </div>
      </div>

      <div className="actions-section">
        <div className="actions-buttons">
          <div className="share-button-wrapper">
            <button 
              className="btn btn-primary"
              onClick={async () => {
                const success = await onShare();
                setShareError(!success);
                setShowCopiedTooltip(true);
                setTimeout(() => {
                  setShowCopiedTooltip(false);
                  setShareError(false);
                }, 2000);
              }}
            >
              <Share2 size={20} />
            </button>
            {showCopiedTooltip && (
              <div className={`copied-tooltip ${shareError ? 'copied-tooltip-error' : ''}`}>
                {shareError ? 'Failed to copy. Please try again.' : 'Copied to clipboard!'}
              </div>
            )}
          </div>
          {onResources && (
            <button 
              className="btn btn-flag palestine-flag-button"
              onClick={onResources}
              aria-label="Resources"
              title="Resources"
            >
              <div className="palestine-flag palestine-flag-button-size">
                <div className="flag-stripe flag-black"></div>
                <div className="flag-stripe flag-white"></div>
                <div className="flag-stripe flag-green"></div>
                <div className="flag-triangle flag-triangle-button"></div>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="source-section">
        <p className="source-text">
          <a href={puzzle.source} target="_blank" rel="noopener noreferrer">
            {puzzle.note || puzzle.sourceLabel}
          </a>
          {showContextualization && <sup className="source-link-superscript">*</sup>}
        </p>
        {showContextualization && (
          <p className="source-footnote">
            <sup>†</sup> Based on <a href="https://www.fns.usda.gov/research/cnpp/usda-food-plans/cost-food-monthly-reports" target="_blank" rel="noopener noreferrer">USDA</a> average monthly food cost for a family of four (~$1,000/month)
          </p>
        )}
      </div>
    </div>
  );
}

