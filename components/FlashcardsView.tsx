
import React, { useState } from 'react';
import { Flashcard, Topic } from '../types';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  topic: Topic;
  onFinish: () => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards, topic, onFinish }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col items-center min-h-[600px]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">{topic.title} Flashcards</h2>
        <p className="text-slate-500 font-medium">Card {currentIdx + 1} of {flashcards.length}</p>
      </div>

      <div className="w-full max-w-lg perspective-1000 group cursor-pointer h-96 mb-12" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Concept</span>
            <h3 className="text-2xl font-bold text-slate-800 leading-tight">
              {flashcards[currentIdx].front}
            </h3>
            <p className="absolute bottom-6 text-slate-400 text-sm font-medium animate-pulse">
              Click to reveal definition
            </p>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center rotate-y-180 text-white">
            <span className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Explanation</span>
            <p className="text-xl font-medium leading-relaxed">
              {flashcards[currentIdx].back}
            </p>
            <p className="absolute bottom-6 text-white/40 text-sm font-medium">
              Click to flip back
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onFinish(); }}
          className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
        >
          End Session
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardsView;
