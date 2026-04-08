import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Plus, 
  Lightbulb, 
  Eraser, 
  ChevronLeft, 
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateSudoku, isComplete, isValid, type Grid } from './lib/sudoku';
import { cn } from './lib/utils';

export default function App() {
  const [grid, setGrid] = useState<Grid>([]);
  const [initialGrid, setInitialGrid] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [word, setWord] = useState('');
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [timer, setTimer] = useState(0);
  const [history, setHistory] = useState<Grid[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const startNewGame = useCallback(() => {
    const { puzzle, solution: sol, word: w } = generateSudoku();
    setGrid(puzzle.map(row => [...row]));
    setInitialGrid(puzzle.map(row => [...row]));
    setSolution(sol);
    setWord(w);
    setMistakes(0);
    setGameStatus('playing');
    setTimer(0);
    setHistory([]);
    setSelectedCell(null);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;
    setSelectedCell([row, col]);
  };

  const handleInput = (value: number | null) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const [row, col] = selectedCell;

    // Don't allow changing initial cells
    if (initialGrid[row][col] !== null) return;

    const newGrid = grid.map(r => [...r]);
    
    if (value === null) {
      newGrid[row][col] = null;
      setGrid(newGrid);
      return;
    }

    // Check if correct
    if (solution[row][col] === value) {
      newGrid[row][col] = value;
      setGrid(newGrid);
      
      if (isComplete(newGrid)) {
        setGameStatus('won');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FF00', '#FFFFFF', '#000000']
        });
      }
    } else {
      setMistakes(m => {
        const next = m + 1;
        if (next >= 3) setGameStatus('lost');
        return next;
      });
      // Optional: show error briefly
    }
  };

  const getHint = () => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const [row, col] = selectedCell;
    if (grid[row][col] !== null) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = solution[row][col];
    setGrid(newGrid);
    
    if (isComplete(newGrid)) {
      setGameStatus('won');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const letters = word.split('');

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(null);
      } else if (e.key === 'ArrowUp' && selectedCell) {
        setSelectedCell(([r, c]) => [Math.max(0, r - 1), c]);
      } else if (e.key === 'ArrowDown' && selectedCell) {
        setSelectedCell(([r, c]) => [Math.min(8, r + 1), c]);
      } else if (e.key === 'ArrowLeft' && selectedCell) {
        setSelectedCell(([r, c]) => [r, Math.max(0, c - 1)]);
      } else if (e.key === 'ArrowRight' && selectedCell) {
        setSelectedCell(([r, c]) => [r, Math.min(8, c + 1)]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameStatus, solution, initialGrid, grid]);

  if (grid.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#1A1A1A] font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Header */}
      <header className="border-b-2 border-black p-4 md:p-6 flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rotate-[-4deg] font-display font-bold text-xl tracking-tighter">
            SKUDOO
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight hidden sm:block">WORD SKUDOO</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Timer</span>
            <span className="font-mono font-bold text-lg">{formatTime(timer)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Mistakes</span>
            <span className={cn(
              "font-mono font-bold text-lg",
              mistakes > 0 ? "text-red-500" : ""
            )}>{mistakes}/3</span>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black rounded-full"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        
        {/* Game Area */}
        <div className="flex flex-col gap-6">
          {/* Word Display */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Current Word</span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#00FF00] px-2 py-0.5">9 Unique Letters</span>
            </div>
            <div className="flex gap-1 sm:gap-2 justify-center">
              {letters.map((l, i) => (
                <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-black flex items-center justify-center font-bold text-lg bg-[#F8F8F8]">
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Sudoku Grid */}
          <div className="relative aspect-square w-full max-w-[500px] mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="grid grid-cols-9 h-full w-full">
              {grid.map((row, rIndex) => (
                row.map((cell, cIndex) => {
                  const isSelected = selectedCell?.[0] === rIndex && selectedCell?.[1] === cIndex;
                  const isInitial = initialGrid[rIndex][cIndex] !== null;
                  const isInSameRowOrCol = selectedCell && (selectedCell[0] === rIndex || selectedCell[1] === cIndex);
                  const isSameValue = selectedCell && cell !== null && grid[selectedCell[0]][selectedCell[1]] === cell;
                  
                  return (
                    <button
                      key={`${rIndex}-${cIndex}`}
                      onClick={() => handleCellClick(rIndex, cIndex)}
                      className={cn(
                        "relative flex items-center justify-center text-xl sm:text-2xl font-bold border-[0.5px] border-black/20 transition-all duration-100",
                        (rIndex + 1) % 3 === 0 && rIndex !== 8 && "border-b-2 border-b-black",
                        (cIndex + 1) % 3 === 0 && cIndex !== 8 && "border-r-2 border-r-black",
                        isSelected ? "bg-[#00FF00] text-black z-10 scale-[1.02] shadow-lg" : 
                        isSameValue ? "bg-[#00FF00]/30" :
                        isInSameRowOrCol ? "bg-black/5" : "bg-white",
                        isInitial ? "text-black" : "text-blue-600 font-medium"
                      )}
                    >
                      {cell !== null ? letters[cell - 1] : ""}
                    </button>
                  );
                })
              ))}
            </div>

            {/* Game Over Overlays */}
            <AnimatePresence>
              {gameStatus !== 'playing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,255,0,1)] max-w-sm w-full"
                  >
                    {gameStatus === 'won' ? (
                      <>
                        <div className="w-20 h-20 bg-[#00FF00] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
                          <Trophy size={40} />
                        </div>
                        <h2 className="text-3xl font-display font-black mb-2">VICTORY!</h2>
                        <p className="text-gray-600 mb-6">You solved the puzzle in {formatTime(timer)} with {mistakes} mistakes.</p>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
                          <X size={40} />
                        </div>
                        <h2 className="text-3xl font-display font-black mb-2">GAME OVER</h2>
                        <p className="text-gray-600 mb-6">Too many mistakes! Better luck next time.</p>
                      </>
                    )}
                    <button
                      onClick={startNewGame}
                      className="w-full bg-black text-white font-bold py-4 px-6 flex items-center justify-center gap-2 hover:bg-[#00FF00] hover:text-black transition-colors border-2 border-black"
                    >
                      <Plus size={20} /> NEW GAME
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="flex flex-col gap-4 sticky top-24">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleInput(num)}
                className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center hover:bg-black hover:text-white transition-all active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                <span className="text-2xl font-black">{letters[num - 1]}</span>
                <span className="text-[10px] font-bold opacity-40">{num}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => handleInput(null)}
              className="flex items-center justify-center gap-2 bg-white border-2 border-black py-3 font-bold hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              <Eraser size={18} /> ERASE
            </button>
            <button
              onClick={getHint}
              className="flex items-center justify-center gap-2 bg-white border-2 border-black py-3 font-bold hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              <Lightbulb size={18} /> HINT
            </button>
          </div>

          <button
            onClick={startNewGame}
            className="w-full bg-black text-white font-bold py-4 px-6 flex items-center justify-center gap-2 hover:bg-[#00FF00] hover:text-black transition-colors border-2 border-black mt-4"
          >
            <RotateCcw size={20} /> RESTART
          </button>

          <div className="mt-8 p-4 bg-white border-2 border-black border-dashed">
            <h3 className="font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
              <Settings size={14} /> How to play
            </h3>
            <p className="text-xs leading-relaxed text-gray-600">
              Fill the grid so that every row, column, and 3x3 box contains all 9 letters of the word <span className="font-bold text-black">"{word}"</span> exactly once.
            </p>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full relative"
            >
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-display font-black mb-6 underline decoration-[#00FF00] decoration-4 underline-offset-4">HOW TO PLAY</h2>
              
              <div className="space-y-4 text-gray-700">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-black text-white flex-shrink-0 flex items-center justify-center font-bold">1</div>
                  <p>Each puzzle uses a unique 9-letter word where all letters are different.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-black text-white flex-shrink-0 flex items-center justify-center font-bold">2</div>
                  <p>Fill the 9x9 grid so that every row, column, and 3x3 subgrid contains all 9 letters of that word.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-black text-white flex-shrink-0 flex items-center justify-center font-bold">3</div>
                  <p>You can use the number keys (1-9) or click the letter buttons to enter values.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-black text-white flex-shrink-0 flex items-center justify-center font-bold">4</div>
                  <p>Be careful! 3 mistakes and it's game over.</p>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-8 bg-black text-white font-bold py-4 hover:bg-[#00FF00] hover:text-black transition-colors border-2 border-black"
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto p-8 text-center border-t-2 border-black bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
          Built with Precision & Chaos • Word Skudoo v1.0
        </p>
      </footer>
    </div>
  );
}
