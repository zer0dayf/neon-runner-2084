import React from 'react';
import { Volume2, VolumeX, Lock, Play, RotateCcw, Menu, CheckCircle, Infinity, Pause, LogOut, ArrowLeft, Hand, MousePointerClick, Music } from 'lucide-react';
import { TutorialOverlay } from './TutorialOverlay';

interface UIOverlayProps {
    showTitleScreen: boolean;
    started: boolean;
    gameOver: boolean;
    levelComplete: boolean;
    level: number;
    maxUnlockedLevel: number;
    isInfinite: boolean;
    score: number;
    highScore: number;
    progress: number;
    bestProgress: number;
    isSwipeControl: boolean;
    musicEnabled: boolean;
    sfxEnabled: boolean;
    showTutorial: boolean;
    paused: boolean;
    speedRatio?: number;
    onToggleMusic: () => void;
    onToggleSfx: () => void;
    onStartSystem: () => void;
    onBackToTitle: () => void;
    onSelectLevel: (level: number) => void;
    onSelectInfinite: () => void;
    onRestart: () => void;
    onReturnToMenu: () => void;
    onTogglePause: () => void;
    onQuit: () => void;
    onToggleControl: () => void;
    onCompleteTutorial: () => void;
    onSkipTutorial: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
    showTitleScreen, started, gameOver, levelComplete, level, maxUnlockedLevel, isInfinite, score, highScore, progress, bestProgress, isSwipeControl,
    musicEnabled, sfxEnabled, showTutorial, paused, speedRatio = 0,
    onToggleMusic, onToggleSfx, onStartSystem, onBackToTitle, onSelectLevel, onSelectInfinite, onRestart, onReturnToMenu, onTogglePause, onQuit, onToggleControl, onCompleteTutorial, onSkipTutorial
}) => {

    const STAGES = [
        { id: 1, name: "INITIATION", desc: "Basic Obstacles" },
        { id: 2, name: "PRECISION", desc: "Ring Gates" },
        { id: 3, name: "TURBULENCE", desc: "Spinners" },
        { id: 4, name: "CHAOS", desc: "Double Spinners" },
        { id: 5, name: "EVENT HORIZON", desc: "The Gauntlet" },
    ];

    // Multiplier: 1.0x (idle) → 3.0x (full speed)
    const multiplier = 1.0 + speedRatio * 2.0;
    const multiplierText = multiplier.toFixed(1) + 'x';
    // Color: cyan(1.0x) → lime(1.5x) → orange(2.2x) → magenta(3.0x)
    const multiplierColor = speedRatio < 0.5
        ? `hsl(${180 - speedRatio * 2 * 90}, 100%, 55%)`
        : speedRatio < 0.85
            ? `hsl(${90 - (speedRatio - 0.5) * 2 * 60}, 100%, 55%)`
            : `hsl(310, 100%, 60%)`;

    return (
        <div className="absolute inset-0 pointer-events-none z-[10] select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">

            {/* Visual Overlay Effects */}
            <div className="absolute inset-0 pointer-events-none z-[5] bg-[linear-gradient(rgba(18,16,20,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-50"></div>

            {/* --- PROGRESS BAR --- */}
            {started && !gameOver && !levelComplete && !isInfinite && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-48 md:w-96 h-3 bg-gray-900/60 border border-white/20 rounded-full z-[25] backdrop-blur-sm pointer-events-none">
                    {/* Background track (now inside for clipping control) */}
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                        {/* Current Progress bar */}
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(0,255,255,0.6)]"
                            style={{ 
                                width: '100%', 
                                transform: `scaleX(${progress / 100})`, 
                                transformOrigin: 'left',
                                transition: 'transform 0.1s linear' 
                            }}
                        />
                    </div>

                    {/* Best Progress Marker (Vertical Line) */}
                    {bestProgress > 0 && (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[140%] bg-pink-500 shadow-[0_0_8px_#ff007f] z-[30] transition-all duration-300"
                            style={{ left: `${bestProgress}%` }}
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-pink-400 tracking-tighter uppercase whitespace-nowrap">BEST</div>
                        </div>
                    )}
                </div>
            )}

            {/* --- VELOCITY MULTIPLIER BADGE --- */}
            {started && !gameOver && !levelComplete && (
                <div
                    className="absolute right-3 top-[6.5rem] md:top-[7.5rem] z-[25] pointer-events-none flex flex-col items-center gap-0.5"
                >
                    <div
                        className="text-[9px] font-bold tracking-widest uppercase font-mono"
                        style={{ color: multiplierColor, opacity: 0.7 }}
                    >
                        SPEED
                    </div>
                    <div
                        className="text-base font-black font-mono tracking-tight px-1.5 py-0.5 rounded border"
                        style={{
                            color: multiplierColor,
                            borderColor: `${multiplierColor}60`,
                            backgroundColor: `${multiplierColor}12`,
                            boxShadow: speedRatio > 0.5 ? `0 0 8px ${multiplierColor}50` : 'none',
                            textShadow: speedRatio > 0.7 ? `0 0 6px ${multiplierColor}` : 'none',
                            transition: 'color 0.4s ease, box-shadow 0.4s ease',
                        }}
                    >
                        {multiplierText}
                    </div>
                </div>
            )}

            {/* TOP HEADER */}
            {!showTitleScreen && (
                <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start pointer-events-none z-[20]">
                    <div className={`text-cyan-400 pointer-events-auto transition-opacity duration-300 ${started && !paused && !gameOver && !levelComplete ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
                        {!started && (
                            <>
                                <h1 className="text-2xl md:text-4xl font-bold tracking-widest uppercase" style={{ fontFamily: "'Rajdhani', sans-serif", textShadow: "0 0 10px #00ffff" }}>
                                    Neon Runner
                                </h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-pink-500 text-xs md:text-sm tracking-[0.3em] font-bold">SYSTEM ONLINE // 2084</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* HUD */}
                    {started && (
                        <div className="flex gap-4 md:gap-8 text-right pointer-events-auto w-full justify-end">
                            {isInfinite ? (
                                <>
                                    <div>
                                        <div className="text-xs text-yellow-400 tracking-widest">HI-SCORE</div>
                                        <div className="text-lg md:text-xl font-bold text-yellow-200 font-mono">{highScore}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-cyan-400 tracking-widest">SCORE</div>
                                        <div className="text-2xl md:text-3xl font-bold text-white font-mono">{score}</div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div className="text-xs text-pink-400 tracking-widest">STAGE</div>
                                    <div className="text-2xl md:text-3xl font-bold text-white font-mono">{level}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TITLE SCREEN */}
            {showTitleScreen && (
                <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-auto bg-black/90 p-4">
                    <div className="text-center relative px-8 max-h-screen overflow-y-auto py-8">
                        <h1 className="text-5xl md:text-9xl landscape:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 mb-2 landscape:mb-0 pr-4"
                            style={{ filter: "drop-shadow(0 0 20px rgba(0,255,255,0.4))", fontFamily: "'Rajdhani', sans-serif" }}>
                            NEON RUNNER
                        </h1>
                        <p className="text-pink-500 tracking-[0.5em] md:tracking-[0.8em] text-sm md:text-xl font-bold mb-12 landscape:mb-4">PROJECT 2084</p>

                        <div className="flex flex-col gap-6 landscape:gap-3 items-center">
                            <button
                                onClick={onStartSystem}
                                className="group relative w-64 py-4 landscape:py-2 bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold tracking-widest uppercase text-xl hover:bg-cyan-500 hover:text-black transition-all duration-300 flex items-center justify-center"
                            >
                                <span className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-20 blur-lg transition-opacity"></span>
                                <Play className="inline mb-1 mr-2" size={24} fill="currentColor" />
                                INITIALIZE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAUSE MENU MODAL */}
            {!showTitleScreen && paused && (
                <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-auto bg-black/70 backdrop-blur-md p-4">
                    <div className="text-center relative p-6 md:p-10 bg-black/80 border border-cyan-500 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.2)] flex flex-col landscape:flex-row gap-8 items-center max-h-[90vh] overflow-y-auto">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2 landscape:mb-0 tracking-widest font-mono">PAUSED</h2>
                        </div>

                        <div className="flex flex-col gap-4 w-64 landscape:w-48">
                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onTogglePause(); }}
                                className="cursor-pointer pointer-events-auto px-6 py-3 landscape:py-2 bg-cyan-600/20 border border-cyan-500 text-cyan-300 font-bold tracking-wider active:bg-cyan-500 active:text-black md:hover:bg-cyan-500 md:hover:text-black transition-all flex items-center justify-center select-none"
                            >
                                <Play className="inline mr-2" size={20} /> RESUME
                            </button>

                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onToggleControl(); }}
                                className="cursor-pointer pointer-events-auto px-6 py-3 landscape:py-2 bg-transparent border border-yellow-500 text-yellow-400 font-bold tracking-wider active:bg-yellow-500/20 md:hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2 select-none"
                            >
                                {isSwipeControl ? <Hand size={20} /> : <MousePointerClick size={20} />}
                                {isSwipeControl ? "MODE: SWIPE" : "MODE: TAP"}
                            </button>

                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onRestart(); }}
                                className="cursor-pointer pointer-events-auto px-6 py-3 landscape:py-2 bg-transparent border border-white/50 text-white font-bold tracking-wider active:bg-white active:text-black md:hover:bg-white md:hover:text-black transition-all flex items-center justify-center select-none"
                            >
                                <RotateCcw className="inline mr-2" size={20} /> RESTART
                            </button>
                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onQuit(); }}
                                className="cursor-pointer pointer-events-auto px-6 py-3 landscape:py-2 bg-transparent border border-red-800 text-red-500 font-bold tracking-wider active:bg-red-950 md:hover:bg-red-950 transition-all flex items-center justify-center select-none"
                            >
                                <LogOut className="inline mr-2" size={20} /> QUIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEVEL COMPLETE & MISSION SELECT (Bu kısımlar değişmedi, uzun olmasın diye sadece yapı olarak bırakıyorum ama sen tam kopyalarsan çalışır) */}
            {!showTitleScreen && levelComplete && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-auto bg-green-900/60 backdrop-blur-md">
                    <div className="text-center relative p-6 md:p-10 bg-black/80 border border-green-500 rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.3)] mx-4">
                        <h2 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-cyan-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] mb-4">
                            STAGE {level} CLEAR
                        </h2>
                        <div className="mb-8 text-white font-mono tracking-widest text-sm md:text-base">
                            SECTOR SECURE. DATA UPLOADED.
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onReturnToMenu(); }}
                                className="cursor-pointer pointer-events-auto px-8 py-3 bg-transparent border-2 border-white text-white font-bold tracking-wider uppercase hover:bg-white hover:text-black transition-all duration-300 relative"
                            >
                                <Menu className="inline mr-2" size={20} />
                                MISSION SELECT
                            </button>
                            {level < 5 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelectLevel(level + 1); }}
                                    className="cursor-pointer pointer-events-auto px-8 py-3 bg-green-500 border-2 border-green-500 text-black font-bold tracking-wider uppercase hover:bg-green-400 hover:scale-105 transition-all duration-300 relative"
                                >
                                    NEXT MISSION
                                    <Play className="inline ml-2" size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!showTitleScreen && !started && !gameOver && !levelComplete && (
                <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-auto bg-black/80 backdrop-blur-lg">
                    <div className="w-full h-full max-w-7xl p-4 md:p-8 relative flex flex-col landscape:flex-row gap-4 landscape:gap-8 overflow-y-auto pt-12 landscape:pt-4">

                        {/* LEFT COLUMN (Landscape) / TOP (Portrait) */}
                        <div className="flex flex-col landscape:w-1/3 gap-4 landscape:gap-2 landscape:justify-center shrink-0">
                            <h2 className="text-center landscape:text-left text-4xl md:text-6xl landscape:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 mt-0" style={{ filter: "drop-shadow(0px 0px 10px rgba(0,255,255,0.3))" }}>
                                MISSION<br className="hidden landscape:block" /> SELECT
                            </h2>

                            <button onClick={(e) => { e.stopPropagation(); onSelectInfinite(); }} className="w-full relative p-4 border-2 border-yellow-500/50 bg-yellow-950/20 hover:bg-yellow-900/40 hover:border-yellow-400 transition-all duration-300 group overflow-hidden cursor-pointer pointer-events-auto flex flex-col justify-center">
                                <div className="flex items-center justify-between relative z-10 w-full">
                                    <div className="text-left">
                                        <h3 className="text-xl font-bold text-yellow-400 mb-1 flex items-center gap-2"><Infinity size={24} /> INFINITE</h3>
                                        <p className="text-xs font-mono text-yellow-600 uppercase">Endless Run</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-yellow-600 uppercase tracking-widest">HI-SCORE</div>
                                        <div className="text-xl font-bold text-white font-mono">{highScore}</div>
                                    </div>
                                </div>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); onBackToTitle(); }} className="cursor-pointer pointer-events-auto px-6 py-3 bg-transparent border border-red-800 text-red-500 font-bold tracking-wider uppercase hover:bg-red-950/50 transition-all flex items-center justify-center gap-2 mt-auto landscape:mt-0">
                                <ArrowLeft size={20} /> BACK
                            </button>
                        </div>

                        {/* RIGHT COLUMN (Landscape) / BOTTOM (Portrait) */}
                        <div className="flex-1 overflow-y-auto pr-2 landscape:h-full landscape:overflow-visible flex flex-col justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-3 gap-3">
                                {STAGES.map((stage) => {
                                    const isLocked = stage.id > maxUnlockedLevel;
                                    const isCompleted = stage.id < maxUnlockedLevel;
                                    return (
                                        <button key={stage.id} disabled={isLocked} onClick={(e) => { e.stopPropagation(); onSelectLevel(stage.id); }} className={`relative p-3 border-2 transition-all duration-300 text-left group overflow-hidden cursor-pointer pointer-events-auto flex-shrink-0 flex flex-col justify-center min-h-[90px] ${isLocked ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed' : 'border-cyan-500/30 bg-cyan-950/30 hover:border-cyan-400 hover:bg-cyan-900/50'}`}>
                                            {!isLocked && (<div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />)}
                                            <div className="flex justify-between items-start mb-1 relative z-10 w-full">
                                                <span className={`text-xs font-mono tracking-widest ${isLocked ? 'text-gray-600' : 'text-cyan-400'}`}>STAGE 0{stage.id}</span>
                                                {isLocked && <Lock size={14} />}
                                                {isCompleted && <CheckCircle size={14} className="text-green-400" />}
                                            </div>
                                            <h3 className={`text-lg font-bold mb-0.5 leading-tight ${isLocked ? 'text-gray-500' : 'text-white group-hover:text-cyan-300'}`}>{stage.name}</h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase leading-tight truncate">{isLocked ? 'LOCKED' : stage.desc}</p>
                                            {!isLocked && (<div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 w-0 group-hover:w-full transition-all duration-700 ease-out" /></div>)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {!showTitleScreen && gameOver && (
                <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-auto bg-red-950/70 backdrop-blur-md p-4">
                    <div className="text-center relative p-4 md:p-8 bg-black/90 border-2 border-red-500 rounded-lg shadow-[0_0_40px_rgba(255,0,0,0.4)] max-w-lg w-full overflow-hidden">
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-5 rounded-full pointer-events-none"></div>

                        <h2 className="text-3xl md:text-6xl landscape:text-3xl font-black text-red-500 mb-1 lg:mb-2 glitch-effect" style={{ textShadow: "3px 3px 0px #000" }}>CRITICAL FAILURE</h2>
                        <p className="text-red-300 tracking-[0.4em] mb-3 landscape:mb-1 font-mono text-xs md:text-sm">SIGNAL LOST</p>

                        {isInfinite && (
                            <div className="mb-4 landscape:mb-2 p-3 landscape:p-1.5 bg-red-950/50 border border-red-900/50">
                                <div className="text-[10px] text-red-400 tracking-widest uppercase">Score</div>
                                <div className="text-2xl md:text-4xl landscape:text-xl font-bold text-white font-mono">{score}</div>
                                {score >= highScore && score > 0 && (<div className="text-yellow-400 text-[10px] font-bold mt-1">NEW HIGH SCORE!</div>)}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-3 landscape:gap-4 justify-center relative z-50">
                            <button onClick={(e) => { e.stopPropagation(); onReturnToMenu(); }} className="cursor-pointer pointer-events-auto px-6 py-2.5 landscape:py-1.5 bg-transparent border border-red-800 text-red-500 font-bold tracking-wider uppercase hover:bg-red-950 transition-all flex items-center justify-center whitespace-nowrap">
                                <Menu className="inline mr-2" size={18} /> ABORT
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onRestart(); }} className="cursor-pointer pointer-events-auto px-6 py-2.5 landscape:py-1.5 bg-red-600 border border-red-600 text-black font-bold tracking-wider uppercase hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(255,0,0,0.5)] flex items-center justify-center whitespace-nowrap">
                                <RotateCcw className="inline mr-2" size={18} /> RETRY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM HUD CONTROLS */}
            {!showTitleScreen && started && !gameOver && !levelComplete && (
                <div className="absolute top-8 left-4 md:left-8 p-0 flex flex-col gap-4 pointer-events-none z-[30]">
                    <div className="flex gap-4">
                        <button onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onTogglePause(); }} className="p-3 border border-cyan-500 text-cyan-500 active:bg-cyan-500 active:text-black md:hover:bg-cyan-500 md:hover:text-black transition-all rounded-sm backdrop-blur-sm cursor-pointer pointer-events-auto select-none">{paused ? <Play size={24} /> : <Pause size={24} />}</button>
                        <button onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} className="p-3 border border-pink-500 text-pink-500 active:bg-pink-500 active:text-white md:hover:bg-pink-500 md:hover:text-white transition-all rounded-sm backdrop-blur-sm cursor-pointer pointer-events-auto select-none">
                            {musicEnabled ? <Music size={24} /> : (
                                <div className="relative">
                                    <Music size={24} className="opacity-50" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[124%] h-0.5 bg-current rotate-45 transform origin-center"></div>
                                    </div>
                                </div>
                            )}
                        </button>
                        <button onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onToggleSfx(); }} className="p-3 border border-pink-500 text-pink-500 active:bg-pink-500 active:text-white md:hover:bg-pink-500 md:hover:text-white transition-all rounded-sm backdrop-blur-sm cursor-pointer pointer-events-auto select-none">{sfxEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}</button>
                    </div>
                </div>
            )}

            {/* LANDSCAPE WARNING (Only shows in portrait mode) */}
            <div className="hidden portrait:flex fixed inset-0 z-[1000] bg-black/95 flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                <div className="animate-spin mb-4 text-cyan-500"><RotateCcw size={48} /></div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">PLEASE ROTATE DEVICE</h2>
                <p className="text-gray-400 text-sm">Neon Runner requires landscape mode for optimal performance.</p>
            </div>

            {showTutorial && (
                <TutorialOverlay
                    onComplete={onCompleteTutorial}
                    onSkip={onSkipTutorial}
                    isSwipeControl={isSwipeControl}
                />
            )}

        </div>
    );
};
