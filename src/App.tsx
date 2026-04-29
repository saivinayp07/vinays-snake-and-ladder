/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2, Gamepad2, Trophy, RotateCcw } from 'lucide-react';

const TRACKS = [
  { title: 'Neon Dreams (AI Gen)', artist: 'CyberCoreSynth', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { title: 'Cyberpunk Synth (AI Gen)', artist: 'Digital Horizon', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { title: 'Vaporwave Nights (AI Gen)', artist: 'Echo Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{x: 10, y: 15}, {x: 10, y: 16}, {x: 10, y: 17}];
const INITIAL_DIRECTION = {x: 0, y: -1};

const generateFood = (snake: {x: number, y: number}[]) => {
  const available = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!snake.some(s => s.x === x && s.y === y)) {
         available.push({x, y});
      }
    }
  }
  if (available.length === 0) return {x: 0, y: 0};
  return available[Math.floor(Math.random() * available.length)];
};

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, _setFood] = useState({x: 5, y: 5}); // Dummy initial
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const directionRef = useRef(direction);
  const lastProcessedDirRef = useRef(direction);
  const foodRef = useRef(food);

  const setFood = (newFood: typeof food) => {
      foodRef.current = newFood;
      _setFood(newFood);
  };

  useEffect(() => {
    setFood(generateFood(INITIAL_SNAKE));
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const dir = directionRef.current;
        lastProcessedDirRef.current = dir;

        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          setScore(s => {
             const ns = s + 10;
             if (ns > highScore) setHighScore(ns);
             return ns;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 100);
    return () => clearInterval(interval);
  }, [gameOver, gameStarted, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const isDirectionalKey = e.key.startsWith('Arrow') || ['w', 'a', 's', 'd'].includes(e.key.toLowerCase());
      
      if (!gameStarted && (e.key === ' ' || isDirectionalKey)) {
         setGameStarted(true);
         if (!isPlaying) setIsPlaying(true);
      }

      const currentDir = lastProcessedDirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          if (gameOver) resetGame();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted, isPlaying]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirRef.current = INITIAL_DIRECTION;
    setGameOver(false);
    setScore(0);
    setFood(generateFood(INITIAL_SNAKE));
    setGameStarted(true);
  };

  return (
    <div className="h-screen w-full bg-gray-950 text-cyan-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-gray-950/80 to-black z-0 pointer-events-none"></div>

      { gameOver && <div className="absolute inset-0 bg-red-500/10 z-0 animate-pulse pointer-events-none" /> }

      {/* Header */}
      <header className="z-10 flex flex-col items-center gap-2 mb-4 md:mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] tracking-widest uppercase text-center">
          Neon Snake
        </h1>
        <div className="flex items-center gap-6 text-sm md:text-base font-semibold tracking-widest text-cyan-200">
          <div className="flex items-center gap-2">
             <Trophy size={18} className="text-fuchsia-500 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" /> 
             SCORE: <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{score}</span>
          </div>
          <div className="flex items-center gap-2">
             <Trophy size={18} className="text-cyan-500 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> 
             HIGH: <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Game Viewport */}
      <div className="relative z-10 p-[2px] rounded-sm bg-gradient-to-br from-cyan-500/50 to-fuchsia-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div
          id="game-board"
          className="bg-black/95 w-[300px] h-[300px] md:w-[400px] md:h-[400px] relative overflow-hidden"
        >
            {/* Render Snake */}
            {snake.map((segment, i) => {
               const isHead = i === 0;
               return (
                 <div
                   key={i}
                   className={`absolute rounded-sm ${isHead ? 'bg-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,1)] z-20' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] z-10 border border-cyan-300/30'}`}
                   style={{
                     left: `${(segment.x / GRID_SIZE) * 100}%`,
                     top: `${(segment.y / GRID_SIZE) * 100}%`,
                     width: `${100 / GRID_SIZE}%`,
                     height: `${100 / GRID_SIZE}%`,
                   }}
                 />
               )
            })}
            
            {/* Render Food */}
            <div
                className="absolute z-0 bg-green-400 rounded-full shadow-[0_0_20px_rgba(74,222,128,1)] animate-ping mix-blend-screen"
                style={{
                    left: `${(food.x / GRID_SIZE) * 100}%`,
                    top: `${(food.y / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    animationDuration: '2s'
                }}
            />
            <div
                className="absolute z-10 bg-green-300 rounded-full shadow-[0_0_10px_rgba(74,222,128,1)]"
                style={{
                    left: `${(food.x / GRID_SIZE) * 100}%`,
                    top: `${(food.y / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                }}
            />

            {/* Overlays */}
            {!gameStarted && !gameOver && (
               <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-6 text-cyan-100 z-30 backdrop-blur-sm">
                   <Gamepad2 size={56} className="text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-bounce" />
                   <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">READY PLAYER 1</h2>
                   <p className="text-sm md:text-base bg-cyan-950/50 px-4 py-2 rounded border border-cyan-900 text-cyan-300">Press any Arrow Key to Start</p>
               </div>
            )}

            {gameOver && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 text-fuchsia-100 z-30 backdrop-blur-sm">
                   <h2 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-fuchsia-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAME OVER</h2>
                   <p className="mb-8 font-semibold text-xl text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">FINAL SCORE: {score}</p>
                   <button
                     onClick={resetGame}
                     className="flex items-center gap-3 px-6 py-3 bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold tracking-widest hover:bg-cyan-900 hover:text-cyan-100 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] focus:outline-none transition-all rounded"
                   >
                     <RotateCcw size={20} /> RESTART (SPACE)
                   </button>
               </div>
            )}
        </div>
      </div>

      {/* Music Player */}
      <div className="z-10 mt-8 w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-fuchsia-900/60 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] lg:absolute lg:bottom-8 lg:right-8 lg:max-w-xs transition-all duration-300">
         <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="relative flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-950 border border-fuchsia-500/50 rounded-full shadow-[0_0_15px_rgba(232,121,249,0.2)]">
                  {isPlaying ? (
                    <Music2 size={20} className="text-fuchsia-400 animate-pulse drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
                  ) : (
                    <Music2 size={20} className="text-fuchsia-900 opacity-80" />
                  )}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-fuchsia-500 tracking-widest mb-0.5" style={{fontFamily: 'sans-serif'}}>NOW PLAYING</p>
                  <h3 className="text-sm font-semibold text-gray-100 truncate w-full" style={{fontFamily: 'sans-serif'}}>{TRACKS[currentTrackIndex].title}</h3>
                  <p className="text-xs text-cyan-400/70 truncate" style={{fontFamily: 'sans-serif'}}>{TRACKS[currentTrackIndex].artist}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
               <button onClick={prevTrack} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none rounded-full hover:bg-gray-800/50">
                 <SkipBack size={18} fill="currentColor" />
               </button>
               <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center bg-cyan-950 border border-cyan-500/80 rounded-full text-cyan-300 hover:bg-cyan-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all focus:outline-none">
                 {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
               </button>
               <button onClick={nextTrack} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none rounded-full hover:bg-gray-800/50">
                 <SkipForward size={18} fill="currentColor" />
               </button>
            </div>
         </div>
      </div>

      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={nextTrack}
        crossOrigin="anonymous"
      />
    </div>
  );
}
