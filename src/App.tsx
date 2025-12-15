import { useState, useEffect } from 'react';
import { PuzzleData, loadTodayPuzzle } from './utils/puzzleLoader';
import { saveGuesses, getGuesses, isRevealed, saveReveal, clearPuzzleData } from './utils/storage';
import { GuessScreen } from './components/GuessScreen';
import { RevealScreen } from './components/RevealScreen';
import { AboutScreen } from './components/AboutScreen';
import { ResourcesScreen } from './components/ResourcesScreen';
import { calculatePercentageError, RATING_CONFIG, getRatingGrade } from './utils/formatters';
import { ArrowLeft, Sun, Moon, HelpCircle } from 'lucide-react';

type AppState = 'loading' | 'error' | 'guess' | 'reveal' | 'about' | 'resources';

function App() {
  const [state, setState] = useState<AppState>('loading');
  const [previousState, setPreviousState] = useState<AppState | null>(null);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [guesses, setGuesses] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isForfeit, setIsForfeit] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aipac.cash:theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aipac.cash:theme', theme);
  }, [theme]);

  useEffect(() => {
    loadPuzzle();
  }, []);

  const loadPuzzle = async () => {
    try {
      const data = await loadTodayPuzzle();
      if (!data) {
        setState('error');
        setErrorMessage('Unable to load today\'s puzzle. Please check your connection and try again.');
        return;
      }

      setPuzzle(data);
      
      // Check if already revealed
      const revealed = isRevealed(data.date);
      const savedGuesses = getGuesses(data.date);
      
      if (revealed && savedGuesses.length > 0) {
        setGuesses(savedGuesses);
        setState('reveal');
      } else {
        setGuesses(savedGuesses);
        setState('guess');
      }
    } catch (error) {
      setState('error');
      setErrorMessage('Unable to load puzzle. Please check your connection and refresh the page.');
      if (import.meta.env.DEV) {
        console.error(error);
      }
    }
  };

  const handleGuess = (guess: number) => {
    if (!puzzle) return;
    
    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    saveGuesses(puzzle.date, newGuesses);
    
    // Check if within bullseye threshold
    const percentageError = calculatePercentageError(guess, puzzle.amount);
    const isBullseye = percentageError <= RATING_CONFIG.bullseyeThreshold;
    
    // If 5 guesses, exact match, or bullseye, reveal
    if (newGuesses.length >= 5 || guess === puzzle.amount || isBullseye) {
      saveReveal(puzzle.date);
      setState('reveal');
    }
  };

  const handleRevealEarly = () => {
    if (!puzzle) return;
    saveReveal(puzzle.date);
    setIsForfeit(true);
    setState('reveal');
  };

  const handleShare = async (): Promise<boolean> => {
    if (!puzzle || guesses.length === 0) return false;

    const actual = puzzle.amount;
    const lastGuess = guesses[guesses.length - 1];
    const percentageError = calculatePercentageError(lastGuess, actual);
    const rating = getRatingGrade(guesses, percentageError, isForfeit);

    const shareText = `I just got a ${rating} on today's AIPAC.cash`;

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        return true;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to copy to clipboard:', error);
        }
        // Fall through to fallback method
      }
    }

    // Fallback: use legacy method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to copy using fallback method:', error);
      }
      return false;
    }
  };

  if (state === 'loading') {
    return (
      <div className="app-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="app-error">
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="app-error">
        <p>No puzzle available</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    // Parse date string (YYYY-MM-DD) without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleBack = () => {
    if (previousState) {
      // Go back to previous state
      setState(previousState);
      setPreviousState(null);
    } else {
      // No previous state, go home and reset
      handleHome();
    }
  };

  const handleHome = () => {
    if (puzzle) {
      // Clear puzzle data and reset everything
      clearPuzzleData(puzzle.date);
      setGuesses([]);
      setIsForfeit(false);
    }
    setPreviousState(null);
    setState('loading');
    loadPuzzle();
  };

  const handleResources = () => {
    setPreviousState(state);
    setState('resources');
  };

  const handleAbout = () => {
    setPreviousState(state);
    setState('about');
  };


  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app">
        <header className="app-header">
          <div className="app-header-left">
            {state === 'guess' && (
              <button className="help-button" onClick={handleAbout} aria-label="About">
                <HelpCircle size={20} />
              </button>
            )}
            {(state === 'about' || state === 'reveal' || state === 'resources') && (
              <button className="back-button" onClick={handleBack} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
            )}
          </div>
        <div className="app-header-center">
          <h1 className="app-title">
            AIPAC.cash
          </h1>
          {puzzle && (state === 'guess' || state === 'reveal' || state === 'about' || state === 'resources') && <div className="app-date">{formatDate(puzzle.date)}</div>}
        </div>
        <div className="app-header-right">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>
      {state === 'guess' && (
        <GuessScreen
          puzzle={puzzle}
          onGuess={handleGuess}
          onRevealEarly={handleRevealEarly}
          guesses={guesses}
        />
      )}
      {state === 'reveal' && guesses.length > 0 && (
        <RevealScreen
          puzzle={puzzle}
          guesses={guesses}
          onShare={handleShare}
          onResources={handleResources}
          isForfeit={isForfeit}
        />
      )}
      {state === 'about' && (
        <AboutScreen />
      )}
      {state === 'resources' && (
        <ResourcesScreen />
      )}
    </div>
  );
}

export default App;

