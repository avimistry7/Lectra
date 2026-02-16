
import React, { useState, useRef } from 'react';
import { 
  extractTopics, 
  generateQuiz, 
  extractKnowledgeGraph,
  generateGeneralSummary
} from './services/geminiService';
import { extractTextFromFile } from './services/fileService';
import { 
  Topic, 
  QuizQuestion, 
  AppState, 
  KnowledgeGraphResponse,
  SummaryResponse
} from './types';
import KnowledgeGraph from './components/KnowledgeGraph';
import QuizView from './components/QuizView';

const App: React.FC = () => {
  const [lectureText, setLectureText] = useState('');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [kgData, setKgData] = useState<KnowledgeGraphResponse | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runPipeline = async (text: string) => {
    if (!text.trim()) return;
    setAppState('ANALYZING');
    
    try {
      // Step 1: Summary (Sequential)
      setLoadingMsg('Distilling Core Intelligence...');
      const summaryResp = await generateGeneralSummary(text);
      setSummaryData(summaryResp);

      // Step 2: Knowledge Graph (Sequential)
      setLoadingMsg('Mapping Semantic Relationships...');
      const kgResp = await extractKnowledgeGraph(text);
      setKgData(kgResp);

      // Step 3: Topics (Sequential)
      setLoadingMsg('Deconstructing Lecture Architecture...');
      const topicResp = await extractTopics(text);
      setTopics(topicResp.topics);

      setAppState('SUMMARY_VIEW');
    } catch (err: any) {
      console.error(err);
      const isQuota = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED");
      alert(isQuota 
        ? 'API Quota Exceeded. Please wait a minute and try again. Switch to a paid key for higher limits.' 
        : 'Analysis failed. Please try again with different content.');
      setAppState('IDLE');
    }
  };

  const handleAnalyze = () => {
    runPipeline(lectureText);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadedFileName(file.name);
    
    try {
      const text = await extractTextFromFile(file);
      setLectureText(text);
      await runPipeline(text);
    } catch (err: any) {
      console.error(err);
      alert(`Error reading file: ${err.message}`);
      setUploadedFileName(null);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleStartQuiz = async (topic: Topic) => {
    setAppState('ANALYZING');
    setLoadingMsg(`Generating Mastery Assessment for "${topic.title}"...`);
    setSelectedTopic(topic);
    try {
      const resp = await generateQuiz(topic);
      setCurrentQuiz(resp.quiz);
      setAppState('QUIZ_VIEW');
    } catch (err) {
      console.error(err);
      setAppState('TOPICS_VIEW');
    }
  };

  const renderSidebar = () => (
    <aside className="w-full lg:w-72 flex-shrink-0 border-r border-slate-200 bg-white/50 h-full p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
          <i className="fas fa-brain"></i>
        </div>
        <div>
          <h1 className="font-bold text-slate-900 leading-tight">Academic Genius</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Lecture Suite</p>
        </div>
      </div>

      <nav className="space-y-1">
        {[
          { id: 'SUMMARY_VIEW', label: 'Executive Summary', icon: 'fa-file-lines' },
          { id: 'TOPICS_VIEW', label: 'Knowledge Base', icon: 'fa-book-open' },
          { id: 'KG_VIEW', label: 'Semantic Map', icon: 'fa-project-diagram' },
          { id: 'IDLE', label: 'New Analysis', icon: 'fa-plus-circle' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'IDLE') {
                setLectureText('');
                setUploadedFileName(null);
              }
              setAppState(item.id as AppState);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              appState === item.id 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-10 p-4 bg-slate-900 rounded-2xl text-white">
        <p className="text-xs text-indigo-300 font-bold uppercase mb-2">Current Session</p>
        <p className="text-sm font-medium opacity-80 mb-4">{topics.length} Topics Analyzed</p>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: topics.length > 0 ? '100%' : '0%' }}></div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {appState !== 'IDLE' && appState !== 'ANALYZING' && renderSidebar()}

      <main className="flex-grow overflow-auto">
        {appState === 'IDLE' && (
          <div className="max-w-4xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
                Unlock Your <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Lectures</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-xl mx-auto">
                Paste your lecture text or upload documents (PDF, PPTX, TXT). Our AI transforms them into structured insights.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6">
              <div className="relative">
                <textarea
                  value={lectureText}
                  onChange={(e) => setLectureText(e.target.value)}
                  placeholder="Paste lecture transcript or text content here..."
                  className={`w-full h-80 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-slate-700 leading-relaxed font-medium ${isProcessingFile ? 'opacity-50' : ''}`}
                />
                
                {isProcessingFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <i className="fas fa-circle-notch fa-spin text-indigo-600 text-3xl"></i>
                      <p className="font-bold text-slate-900">Extracting Text content...</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                  {uploadedFileName && (
                    <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md mb-1 animate-in fade-in slide-in-from-right-2">
                      <i className="fas fa-file-alt mr-1"></i> {uploadedFileName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/80 backdrop-blur px-2 py-1 rounded-md">
                    <i className="fas fa-keyboard"></i>
                    {lectureText.split(/\s+/).filter(x => x).length} words
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.pptx,.txt,.md,.text"
                />
                <button
                  onClick={triggerFileUpload}
                  disabled={isProcessingFile}
                  className="px-8 py-5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 border-2 border-slate-200"
                >
                  <i className="fas fa-file-import"></i>
                  Upload File
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!lectureText.trim() || isProcessingFile}
                  className={`flex-grow py-5 px-8 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${
                    lectureText.trim() && !isProcessingFile
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <i className="fas fa-bolt"></i>
                  Analyze Materials
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'ANALYZING' && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{loadingMsg}</h2>
            <p className="text-slate-500 animate-pulse">Running Optimized Pipeline (sequential processing)...</p>
          </div>
        )}

        {appState === 'SUMMARY_VIEW' && summaryData && (
          <div className="p-10 max-w-4xl mx-auto animate-in fade-in duration-700">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Executive Summary</h2>
              <p className="text-slate-500 font-medium">Core intelligence distilled from the provided lecture.</p>
            </header>

            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm space-y-10">
              <section>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Lecture Overview</h3>
                <p className="text-2xl font-semibold text-slate-800 leading-tight">
                  {summaryData.overview}
                </p>
              </section>

              <hr className="border-slate-100" />

              <section>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Key Takeaways</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaryData.key_takeaways.map((point, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-1">
                        {i + 1}
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-slate-100" />

              <section>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Comprehensive Deep-Dive</h3>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-8 text-lg whitespace-pre-wrap">
                    {summaryData.detailed_summary}
                  </p>
                </div>
              </section>

              <div className="pt-6 flex justify-center">
                 <button 
                  onClick={() => setAppState('TOPICS_VIEW')}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  Explore Topic Breakdown
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'TOPICS_VIEW' && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-700">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">Lecture Insights</h2>
                <p className="text-slate-500 font-medium">Extracted {topics.length} core topics from your material.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100">
                  <i className="fas fa-chart-line mr-2"></i> Importance Scores Enabled
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topics.map((topic) => (
                <div 
                  key={topic.topic_id} 
                  className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        topic.difficulty_level >= 4 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        Difficulty: {topic.difficulty_level}/5
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Weight: {topic.importance_score}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                    {topic.summary}
                  </p>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Subtopics & Concepts</h4>
                    {topic.subtopics.map((sub, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-sm font-bold text-slate-800 mb-2">{sub.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {sub.key_concepts.map((concept, cIdx) => (
                            <span key={cIdx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleStartQuiz(topic)}
                    className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <i className="fas fa-play-circle"></i>
                    Start Assessment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'KG_VIEW' && kgData && (
          <div className="p-10 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-700">
            <header className="mb-6">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Semantic Knowledge Map</h2>
              <p className="text-slate-500">Visualizing relationships between entities, theories, and concepts found in the text.</p>
            </header>
            <div className="flex-grow min-h-0">
              <KnowledgeGraph data={kgData} />
            </div>
          </div>
        )}

        {appState === 'QUIZ_VIEW' && selectedTopic && (
          <QuizView 
            questions={currentQuiz} 
            topic={selectedTopic} 
            onRetake={(newQ) => setCurrentQuiz(newQ)}
            onFinish={() => setAppState('TOPICS_VIEW')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
