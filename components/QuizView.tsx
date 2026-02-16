
import React, { useState } from 'react';
import { QuizQuestion, Topic } from '../types';
import { generateQuiz } from '../services/geminiService';

interface QuizViewProps {
  questions: QuizQuestion[];
  topic: Topic;
  onRetake: (newQuestions: QuizQuestion[]) => void;
  onFinish: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, topic, onRetake, onFinish }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correct_answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinishing(true);
    }
  };

  const handleAdaptiveRetake = async () => {
    setIsAdapting(true);
    try {
      const resp = await generateQuiz(topic, { score, total: questions.length });
      onRetake(resp.quiz);
      // Reset local state
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setIsFinishing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdapting(false);
    }
  };

  if (isFinishing) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 text-4xl mb-4">
            <i className={`fas ${percentage >= 80 ? 'fa-award' : 'fa-graduation-cap'}`}></i>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
          <p className="text-slate-500">You mastered {score} out of {questions.length} concepts.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="text-5xl font-bold text-indigo-600 mb-2">{percentage}%</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Mastery Level</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAdaptiveRetake}
            disabled={isAdapting}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isAdapting ? (
              <><i className="fas fa-circle-notch fa-spin"></i> Generating Adaptive Quiz...</>
            ) : (
              <><i className="fas fa-redo"></i> Try Adaptive Mode</>
            )}
          </button>
          <button
            onClick={onFinish}
            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
          <span className="text-sm font-medium text-slate-400">Score: {score}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-500" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
        <h3 className="text-xl font-semibold text-slate-800 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            let colorClass = "border-slate-200 hover:border-indigo-300 bg-white";
            let icon = null;

            if (isAnswered) {
              if (option === currentQuestion.correct_answer) {
                colorClass = "border-emerald-500 bg-emerald-50 text-emerald-800";
                icon = <i className="fas fa-check-circle ml-auto"></i>;
              } else if (option === selectedOption) {
                colorClass = "border-rose-500 bg-rose-50 text-rose-800";
                icon = <i className="fas fa-times-circle ml-auto"></i>;
              } else {
                colorClass = "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
              }
            } else if (selectedOption === option) {
              colorClass = "border-indigo-500 bg-indigo-50 text-indigo-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 flex items-center ${colorClass}`}
              >
                <span className="mr-4 w-8 h-8 flex items-center justify-center rounded-full border border-current text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
                {icon}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <i className="fas fa-info-circle text-indigo-500"></i>
              Explanation
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-10 py-3 rounded-xl font-bold transition-all ${
              selectedOption 
                ? "bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {currentIdx < questions.length - 1 ? "Next Question" : "View Results"}
            <i className="fas fa-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView;
