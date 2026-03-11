import React, { useState } from 'react';
import { Play, Hand, MousePointerClick, AlertTriangle, Zap, X } from 'lucide-react';

interface TutorialOverlayProps {
    onComplete: () => void;
    onSkip: () => void;
    isSwipeControl: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, onSkip, isSwipeControl }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "WELCOME RUNNER",
            icon: <Play size={32} className="text-cyan-400 mb-2 md:mb-4" />,
            content: "Your objective is simple: navigate the neon tunnel and avoid all obstacles. The further you go, the higher your score.",
            color: "text-cyan-400",
            border: "border-cyan-500",
            bg: "bg-cyan-950/30"
        },
        {
            title: "CONTROLS",
            icon: isSwipeControl ? <Hand size={32} className="text-yellow-400 mb-2 md:mb-4" /> : <MousePointerClick size={32} className="text-yellow-400 mb-2 md:mb-4" />,
            content: isSwipeControl 
                ? "You are currently in SWIPE mode. \nSwipe left or right anywhere on the screen to rotate your sphere around the tunnel."
                : "You are currently in TAP mode. \nTap the left or right side of your screen to steer the sphere.",
            color: "text-yellow-400",
            border: "border-yellow-500",
            bg: "bg-yellow-950/30"
        },
        {
            title: "HAZARDS",
            icon: <AlertTriangle size={32} className="text-pink-500 mb-2 md:mb-4" />,
            content: "Watch out for red blocks and purple spinners. Hitting them will result in instant critical failure. Pass through the teal ring gates safely.",
            color: "text-pink-500",
            border: "border-pink-500",
            bg: "bg-pink-950/30"
        },
        {
            title: "VELOCITY",
            icon: <Zap size={32} className="text-blue-400 mb-2 md:mb-4" />,
            content: "The system continually accelerates. Your reaction time must adapt as speed increases. Good luck.",
            color: "text-blue-400",
            border: "border-blue-500",
            bg: "bg-blue-950/30"
        }
    ];

    const current = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto p-4">
            
            {/* Skip Button (Top Right) */}
            <button 
                onClick={onSkip}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-400 md:hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-xs md:text-sm font-bold z-[1010]"
            >
                SKIP TUTORIAL <X size={16} />
            </button>

            <div className={`relative p-5 md:p-8 border rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm md:max-w-xl w-full flex flex-col items-center text-center transition-all duration-300 max-h-[90vh] overflow-y-auto ${current.bg} ${current.border}`}>
                
                {/* Background Glow */}
                <div className={`absolute inset-0 blur-3xl opacity-20 ${current.bg}`}></div>

                <div className="relative z-10 flex flex-col items-center w-full">
                    {current.icon}
                    <h2 className={`text-xl md:text-3xl lg:text-4xl font-black italic tracking-widest mb-3 md:mb-6 ${current.color}`}>
                        {current.title}
                    </h2>
                    
                    <p className="text-gray-200 text-sm md:text-lg leading-relaxed mb-4 md:mb-8 min-h-[5rem] md:min-h-[5rem]">
                        {current.content.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i !== current.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>

                    <div className="w-full flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-2 rounded-full transition-all duration-300 ${i === step ? `w-8 ${current.bg.replace('/30', '')}` : 'w-2 bg-gray-600'}`} 
                                    style={{ backgroundColor: i === step ? 'currentColor' : '' }}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className={`px-5 py-2 md:px-8 md:py-3 outline-none border ${current.border} ${current.color} text-xs md:text-sm font-bold tracking-widest uppercase md:hover:bg-white/10 active:bg-white/20 transition-all flex items-center gap-2`}
                        >
                            {step < steps.length - 1 ? 'NEXT' : 'INITIALIZE'} 
                            {step < steps.length - 1 && <Play size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
