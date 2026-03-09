import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Youtube, 
  Wand2, 
  Download, 
  PlayCircle, 
  CheckCircle2, 
  Loader2,
  Volume2,
  Video,
  FileText,
  Mic
} from 'lucide-react';

const SOURCE_LANGUAGES = [
  { code: 'auto', name: 'Auto-detect Language' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ko', name: 'Korean' }
];

const PROCESSING_STEPS = [
  { id: 'download', label: 'Fetching YouTube Video', icon: Youtube },
  { id: 'transcribe', label: 'Transcribing Audio (Whisper AI)', icon: FileText },
  { id: 'translate', label: 'Translating Text', icon: Languages },
  { id: 'tts', label: 'Synthesizing Voice (AI Dub)', icon: Mic },
  { id: 'merge', label: 'Merging Audio & Video', icon: Video }
];

export default function App() {
  const [url, setUrl] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [currentStep, setCurrentStep] = useState(0);
  const [videoId, setVideoId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null); // Added state to hold the downloaded video

  // Extract YouTube Video ID safely, even with playlist parameters
  const extractVideoId = (link) => {
    try {
      const urlObj = new URL(link);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      // Fallback regex
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = link.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }
    return null;
  };

  const handleStart = async (e) => {
    e.preventDefault();
    const extractedId = extractVideoId(url);
    
    if (!extractedId) {
      setErrorMsg('Please enter a valid YouTube URL');
      return;
    }

    setVideoId(extractedId);
    setErrorMsg('');
    setStatus('processing');
    setCurrentStep(0);

    // Visual progress simulation (stops at step 3 while waiting for the server)
    const progressInterval = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 4000);

    try {
      // ⚠️ IMPORTANT: Replace this URL with your actual Render/Railway URL
      const BACKEND_URL = 'https://dubbingapp.onrender.com/';
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      if (!response.ok) throw new Error('Server error');

      // Convert the server response into a playable/downloadable file
      const blob = await response.blob();
      const videoDownloadUrl = window.URL.createObjectURL(blob);
      
      setDownloadUrl(videoDownloadUrl);
      
      clearInterval(progressInterval);
      setCurrentStep(4); // Show final 'Merge' step
      setTimeout(() => setStatus('complete'), 1000);

    } catch (error) {
      clearInterval(progressInterval);
      setErrorMsg('Failed to connect to backend server. Check if your Python server is online!');
      setStatus('idle');
    }
  };

  const resetApp = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl); // Clean up memory when resetting
    }
    setUrl('');
    setStatus('idle');
    setCurrentStep(0);
    setVideoId(null);
    setIsPlaying(false);
    setDownloadUrl(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              LingoDub AI
            </span>
          </div>
          <div className="flex gap-4">
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Documentation</button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">API</button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Translate Videos to <span className="text-indigo-600">English</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Paste a foreign-language YouTube link and our AI will transcribe, translate, and generate a natural-sounding English voiceover.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {status === 'idle' && (
            <div className="p-8 sm:p-10">
              <form onSubmit={handleStart} className="space-y-6">
                <div>
                  <label htmlFor="youtube-url" className="block text-sm font-semibold text-slate-700 mb-2">
                    YouTube Video URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Youtube className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="youtube-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-2">
                    Video's Original Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GlobeIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      id="language"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none appearance-none bg-white"
                    >
                      {SOURCE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Target Language</span>
                  <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">English</span>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Dubbed Video
                </button>
              </form>
            </div>
          )}

          {status === 'processing' && (
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">AI is working its magic...</h3>
                <p className="text-slate-500 mt-2">This usually takes a few minutes depending on the video length.</p>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {PROCESSING_STEPS.map((step, index) => {
                  const isCompleted = currentStep > index;
                  const isCurrent = currentStep === index;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors duration-300
                        ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 
                          isCurrent ? 'bg-white border-indigo-600 text-indigo-600 animate-pulse' : 
                          'bg-white border-slate-200 text-slate-400'}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm ml-4 md:ml-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                          {isCurrent && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="p-8 sm:p-10 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Dubbing Complete!</h2>
              <p className="text-slate-600 mb-8">
                Your video has been successfully translated to English.
              </p>

              {/* Mock Video Player */}
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden mb-8 relative group shadow-lg flex flex-col">
                {/* Using thumbnail instead of iframe to bypass preview sandbox restrictions */}
                <div className="relative w-full h-full">
                  {videoId ? (
                    <img 
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
                      alt="Video Thumbnail"
                      className={`w-full h-full object-cover transition-all duration-500 ${isPlaying ? 'opacity-80 scale-105' : 'opacity-50'}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                      Video preview unavailable
                    </div>
                  )}
                  
                  {!isPlaying ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/30 transition-all transform hover:scale-105 shadow-xl"
                      >
                        <PlayCircle className="w-12 h-12 fill-white/10" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                       <div className="text-center">
                         <div className="flex items-center justify-center gap-1 mb-3 h-10">
                           <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                           <div className="w-1.5 h-10 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                           <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                           <div className="w-1.5 h-8 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
                           <div className="w-1.5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                         </div>
                         <p className="text-white font-bold tracking-wide drop-shadow-md">PLAYING DUBBED AUDIO...</p>
                       </div>
                    </div>
                  )}
                </div>

                <div className="absolute top-4 left-4 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none">
                   <Volume2 className="w-3.5 h-3.5" /> Dubbed: English
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {downloadUrl ? (
                  <a 
                    href={downloadUrl}
                    download={`dubbed_video_${videoId}.mp4`}
                    className="flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download MP4
                  </a>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-400 cursor-not-allowed">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </button>
                )}
                <button 
                  onClick={resetApp}
                  className="flex items-center justify-center gap-2 py-3 px-6 border border-slate-200 rounded-xl shadow-sm text-base font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Dub Another Video
                </button>
              </div>
            </div>
          )}

        </div>
        
        {/* Features footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm text-slate-500">
          <div>
            <div className="font-semibold text-slate-700 mb-1">High Accuracy</div>
            Powered by Whisper AI for precise transcription.
          </div>
          <div>
            <div className="font-semibold text-slate-700 mb-1">Natural Voices</div>
            Emotional, human-like voice synthesis.
          </div>
          <div>
            <div className="font-semibold text-slate-700 mb-1">Lip Sync (Beta)</div>
            Automatically adjusts timing to match video.
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Globe icon component since we mapped it manually above
function GlobeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}
