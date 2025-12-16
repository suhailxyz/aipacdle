import { useState, useEffect, useRef, Fragment } from 'react';
import { PuzzleData } from '../utils/puzzleLoader';
import { formatUSD } from '../utils/formatters';
import { LogSlider } from './LogSlider';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface GuessScreenProps {
  puzzle: PuzzleData;
  onGuess: (guess: number) => void;
  onRevealEarly: () => void;
  guesses: number[];
}

export function GuessScreen({ puzzle, onGuess, onRevealEarly, guesses }: GuessScreenProps) {
  const MAX_GUESSES = 5;
  const guessNumber = guesses.length + 1;
  const canGuess = guessNumber <= MAX_GUESSES;
  
  // Default range if not specified
  const defaultRange = { min: 0, max: 10000000 };
  const range = puzzle.range || defaultRange;
  
  // Helper to get feedback for a guess
  const getFeedback = (guessValue: number): 'too-high' | 'too-low' | 'correct' => {
    if (guessValue > puzzle.amount) return 'too-high';
    if (guessValue < puzzle.amount) return 'too-low';
    return 'correct';
  };
  
  // Calculate effective range based on previous guesses
  const getEffectiveRange = () => {
    let minBound = range.min;
    let maxBound = range.max;
    
    // Narrow bounds based on previous guesses
    for (const g of guesses) {
      const feedback = getFeedback(g);
      if (feedback === 'too-high') {
        maxBound = Math.min(maxBound, g - 1);
      } else if (feedback === 'too-low') {
        minBound = Math.max(minBound, g + 1);
      }
    }
    
    return { min: minBound, max: maxBound };
  };
  
  // Get initial guess - start at minimum, or keep last submitted value
  const getInitialGuess = (): number => {
    if (guesses.length === 0) {
      return range.min;
    }
    // Keep the last submitted guess value
    return guesses[guesses.length - 1];
  };
  
  const [guess, setGuess] = useState<number>(getInitialGuess());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const [activeButton, setActiveButton] = useState<'up' | 'down' | null>(null);
  const useSlider = true; // Always use slider mode (toggle is disabled)
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [showFeedbackEffect, setShowFeedbackEffect] = useState<'too-high' | 'too-low' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const previousGuessRef = useRef<number>(getInitialGuess());

  // Update guess when a new guess is submitted, then auto-adjust based on feedback
  useEffect(() => {
    if (guesses.length > 0) {
      const lastSubmittedGuess = guesses[guesses.length - 1];
      const feedback = getFeedback(lastSubmittedGuess);
      const effectiveRange = getEffectiveRange();
      
      // Show feedback effect for too-high or too-low
      if (feedback === 'too-high') {
        setShowFeedbackEffect('too-high');
        setTimeout(() => setShowFeedbackEffect(null), 1500);
      } else if (feedback === 'too-low') {
        setShowFeedbackEffect('too-low');
        setTimeout(() => setShowFeedbackEffect(null), 1500);
      }
      
      // Auto-adjust: if too low, increase by 1; if too high, decrease by 1
      let adjustedGuess = lastSubmittedGuess;
      if (feedback === 'too-low') {
        adjustedGuess = lastSubmittedGuess + 1;
      } else if (feedback === 'too-high') {
        adjustedGuess = lastSubmittedGuess - 1;
      }
      
      // Clamp to effective range
      adjustedGuess = Math.max(effectiveRange.min, Math.min(effectiveRange.max, adjustedGuess));
      setGuess(adjustedGuess);
    }
  }, [guesses.length]);
  
  // Get feedback for last submitted guess to determine arrow constraints
  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;
  const lastFeedback = lastGuess !== null ? getFeedback(lastGuess) : null;
  
  const effectiveRange = getEffectiveRange();
  
  // Check if current guess is within valid bounds
  // If editing, check the editValue instead of guess
  const currentValueToCheck = isEditing 
    ? (parseInt(editValue.replace(/,/g, ''), 10) || 0)
    : guess;
  const isValidGuess = !isNaN(currentValueToCheck) && currentValueToCheck >= effectiveRange.min && currentValueToCheck <= effectiveRange.max;
  
  // Disable arrows when at boundaries based on last guess feedback
  // If last guess was too low (e.g., $4,433), disable down arrow when current guess <= $4,433 (can't go below last guess)
  // If last guess was too high (e.g., $10,000), disable up arrow when current guess >= $10,000 (can't go above last guess)
  // But if current guess is way above/below the boundary, arrows should be enabled
  const canGoUp = lastFeedback === 'too-high' && lastGuess !== null ? guess < lastGuess : true;
  const canGoDown = lastFeedback === 'too-low' && lastGuess !== null ? guess > lastGuess : true;
  
  // Also check against effective range bounds
  const finalCanGoUp = canGoUp && guess < effectiveRange.max;
  const finalCanGoDown = canGoDown && guess > effectiveRange.min;

  // Calculate increment based on current value and hold duration
  const getIncrement = (currentValue: number, holdDuration: number): number => {
    // Base increment scales with value magnitude, but cap at $10,000
    const magnitude = Math.floor(Math.log10(Math.max(1, currentValue)));
    const baseIncrement = Math.min(10000, Math.pow(10, Math.max(0, magnitude - 1)));
    
    // Accelerate after 500ms of holding
    const acceleration = holdDuration > 500 ? Math.min(10, 1 + (holdDuration - 500) / 200) : 1;
    
    return Math.round(baseIncrement * acceleration);
  };

  const startIncrement = (direction: 'up' | 'down') => {
    holdStartTimeRef.current = Date.now();
    if (direction === 'up') {
      setIsUpdating(true);
    } else {
      setIsDecreasing(true);
    }
    setActiveButton(direction);
    
    const updateValue = () => {
      setGuess((prev) => {
        const holdDuration = Date.now() - holdStartTimeRef.current;
        const increment = getIncrement(prev, holdDuration);
        const change = direction === 'up' ? increment : -increment;
        const newValue = prev + change;
        
        // Set animation state on each update
        if (direction === 'up') {
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 100);
        } else {
          setIsDecreasing(true);
          setTimeout(() => setIsDecreasing(false), 100);
        }
        
        // Clamp to effective range
        return Math.max(effectiveRange.min, Math.min(effectiveRange.max, newValue));
      });
    };

    // First update immediately
    updateValue();
    
    // Then set up interval (starts slow, speeds up)
    intervalRef.current = setInterval(updateValue, 50);
  };

  const stopIncrement = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsUpdating(false);
    setIsDecreasing(false);
    setActiveButton(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (canGuess && isValidGuess) {
      onGuess(guess);
    }
  };

  const handleConfirmForfeit = () => {
    setShowForfeitModal(false);
    onRevealEarly();
  };


  const baseUrl = import.meta.env.BASE_URL;
  const imageUrl = puzzle.image.startsWith('/') 
    ? `${baseUrl}${puzzle.image.slice(1)}`
    : `${baseUrl}${puzzle.image}`;

  return (
    <div className="guess-screen">
      {showFeedbackEffect && (
        <div className="feedback-overlay">
          <div className="feedback-container">
            <div className={`feedback-emoji feedback-${showFeedbackEffect}`}>
              {showFeedbackEffect === 'too-high' ? <ArrowUp size={48} /> : <ArrowDown size={48} />}
            </div>
            <div className="feedback-text">
              {showFeedbackEffect === 'too-high' ? 'Too high' : 'Too low'}
            </div>
          </div>
        </div>
      )}
      <div className="question-section">
        <p className="question-text">How much money did this politician receive from AIPAC-aligned PACs?</p>
      </div>

      <div className="subject-guesses-container">
        <div className="subject-section">
          <h1 className="subject-name">{puzzle.name}</h1>
          <div className="subject-name-divider"></div>
          <p className="subject-subtitle">{puzzle.subtitle}</p>
          <img 
            src={imageUrl} 
            alt={puzzle.name}
            className={`subject-image ${puzzle.party ? `subject-image-${puzzle.party.toLowerCase()}` : 'subject-image-default'}`}
          />
          {puzzle.caption && (
            <p className="subject-image-caption">{puzzle.caption}</p>
          )}
        </div>

        {guesses.length > 0 && (
          <div className="guesses-history-wrapper">
            <div className="guesses-heading">Guesses</div>
            <div className="guesses-history">
              {Array.from({ length: 4 }, (_, i) => {
              const guess = guesses[i];
              const hasGuess = guess !== undefined;
              
              if (hasGuess) {
                const feedback = getFeedback(guess);
                
                return (
                  <Fragment key={i}>
                    <div className="guess-item-wrapper guess-row-amount">
                      <span className="guess-number-badge">{i + 1}</span>
                      <div className="guess-item-container">
                        <div className={`guess-item guess-item-${feedback}`}>
                          <span className="guess-amount">{formatUSD(guess)}</span>
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
                            ) : feedback === 'too-high' ? (
                              'Too high'
                            ) : (
                              'Too low'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              } else {
                return (
                  <Fragment key={i}>
                    <div className="guess-item-wrapper guess-row-amount">
                      <span className="guess-number-badge guess-number-badge-placeholder">{i + 1}</span>
                      <div className="guess-item-container">
                        <div className="guess-item guess-item-placeholder">
                          <span className="guess-amount-placeholder"></span>
                        </div>
                      </div>
                    </div>
                    <div className="guess-item-wrapper guess-row-feedback">
                      <span className="guess-number-badge"></span>
                      <div className="guess-item-container">
                        <div className="guess-item guess-item-placeholder guess-item-feedback-row">
                          <span className="guess-feedback-text-placeholder"></span>
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              }
              })}
            </div>
          </div>
        )}
      </div>

      {canGuess && (
        <div className="guess-section">
          <div className="guess-display">
            <span className={`guess-label ${guessNumber === 5 ? 'guess-label-final' : ''}`}>
              {guessNumber === 5 ? 'FINAL GUESS' : `GUESS ${guessNumber}`}
            </span>
            <div className={`guess-value-container ${useSlider ? 'slider-mode' : 'arrow-mode'}`}>
              {!useSlider && (
                <button
                  className={`arrow-btn arrow-down ${activeButton === 'down' ? 'holding' : ''} ${!finalCanGoDown ? 'disabled' : ''}`}
                  onMouseDown={() => finalCanGoDown && startIncrement('down')}
                  onMouseUp={stopIncrement}
                  onMouseLeave={stopIncrement}
                  onTouchStart={() => finalCanGoDown && startIncrement('down')}
                  onTouchEnd={stopIncrement}
                  aria-label="Decrease"
                  disabled={!finalCanGoDown}
                >
                  <ArrowDown size={20} />
                </button>
              )}
              {isEditing ? (
                <input
                  type="text"
                  className="guess-value-input"
                  value={editValue}
                  onChange={(e) => {
                    // Only allow numbers and commas
                    const value = e.target.value.replace(/[^0-9,]/g, '');
                    setEditValue(value);
                  }}
                  onBlur={() => {
                    // Parse the value and clamp to valid range
                    const numericValue = parseInt(editValue.replace(/,/g, ''), 10);
                    if (!isNaN(numericValue)) {
                      // Clamp to valid range
                      const clampedValue = Math.max(effectiveRange.min, Math.min(effectiveRange.max, numericValue));
                      setGuess(clampedValue);
                      setEditValue(clampedValue.toLocaleString('en-US'));
                    } else {
                      // If invalid, reset to current guess
                      setEditValue(guess.toLocaleString('en-US'));
                    }
                    setIsEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const numericValue = parseInt(editValue.replace(/,/g, ''), 10);
                      if (!isNaN(numericValue) && isValidGuess) {
                        // Only submit if valid
                        setGuess(numericValue);
                        setIsEditing(false);
                      } else if (!isNaN(numericValue)) {
                        // If invalid, clamp it
                        const clampedValue = Math.max(effectiveRange.min, Math.min(effectiveRange.max, numericValue));
                        setGuess(clampedValue);
                        setEditValue(clampedValue.toLocaleString('en-US'));
                        setIsEditing(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditValue(guess.toLocaleString('en-US'));
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span 
                  className={`guess-value ${isUpdating ? 'updating' : ''} ${isDecreasing ? 'decreasing' : ''}`}
                  onClick={() => {
                    setIsEditing(true);
                    setEditValue(guess.toLocaleString('en-US'));
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {formatUSD(guess)}
                </span>
              )}
              {!useSlider && (
                <button
                  className={`arrow-btn arrow-up ${activeButton === 'up' ? 'holding' : ''} ${!finalCanGoUp ? 'disabled' : ''}`}
                  onMouseDown={() => finalCanGoUp && startIncrement('up')}
                  onMouseUp={stopIncrement}
                  onMouseLeave={stopIncrement}
                  onTouchStart={() => finalCanGoUp && startIncrement('up')}
                  onTouchEnd={stopIncrement}
                  aria-label="Increase"
                  disabled={!finalCanGoUp}
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </div>

          {useSlider && (
            <LogSlider
              min={effectiveRange.min}
              max={effectiveRange.max}
              value={guess}
              onChange={(newValue) => {
                const prevValue = previousGuessRef.current;
                if (newValue > prevValue) {
                  setIsUpdating(true);
                  setTimeout(() => setIsUpdating(false), 100);
                } else if (newValue < prevValue) {
                  setIsDecreasing(true);
                  setTimeout(() => setIsDecreasing(false), 100);
                }
                previousGuessRef.current = newValue;
                setGuess(newValue);
              }}
            />
          )}

          <div className="actions-section">
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!isValidGuess}
            >
              Guess
            </button>
          </div>
        </div>
      )}

      {/* {canGuess && (
        <button 
          className="no-idea-link"
          onClick={handleNoIdea}
        >
          I give up!
        </button>
      )} */}

      {showForfeitModal && (
        <div className="modal-overlay" onClick={() => setShowForfeitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Give up?</h3>
            <p className="modal-message">Are you sure you want to see the answer now?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowForfeitModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmForfeit}
              >
                Yes, show answer
              </button>
            </div>
          </div>
        </div>
      )}

      {!canGuess && (
        <div className="actions-section">
          <button 
            className="btn btn-primary"
            onClick={onRevealEarly}
          >
            Reveal Answer
          </button>
        </div>
      )}
    </div>
  );
}

