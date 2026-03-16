import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, ImageUp, Wrench, ChevronLeft, Link as LinkIcon, Loader2, Info } from 'lucide-react';
import { analyzeImage, type PartAnalysis } from './gemini';

function App() {
  const apiKey = 'AIzaSyCJ7UaOOVEgYauzpX9yXEAe2nSGmnWm5X8';
  
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PartAnalysis | null>(null);

  const startCamera = async () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Kan geen toegang krijgen tot de camera. Gebruik in plaats daarvan de uploadfunctie.");
      setIsCapturing(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return stopCamera;
  }, [stopCamera]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        setImage(base64Data);
        setMimeType('image/jpeg');
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setImage(base64Data);
        setMimeType(file.type || 'image/jpeg');
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeImage(apiKey, image, mimeType);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Er is een onbekende fout opgetreden.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  const getSearchUrl = (keyword: string, store: string) => {
    const query = encodeURIComponent(keyword);
    switch (store) {
      case 'Amazon': return `https://www.amazon.nl/s?k=${query}`;
      case 'Hornbach': return `https://www.hornbach.nl/zoeken/?q=${query}`;
      case 'Gamma': return `https://www.gamma.nl/assortiment/zoeken?text=${query}`;
      default: return `https://www.google.com/search?q=${query}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-20 selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1e1e1e]/90 backdrop-blur-md border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Wrench size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PartID AI
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 flex flex-col items-center">
        
        {error && (
          <div className="w-full bg-red-900/40 border border-red-700/50 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Home / Capture View */}
        {!image && !isCapturing && (
          <div className="w-full flex flex-col items-center gap-6 mt-8">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-bold text-white">Identificeer elk hardware onderdeel</h2>
              <p className="text-gray-400 text-sm px-4">Maak een foto van een schroef, bout of plug en krijg direct specificaties en aankoopadvies.</p>
            </div>

            <button
              onClick={startCamera}
              className="w-full aspect-square max-w-[280px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex flex-col items-center justify-center gap-4 text-white shadow-2xl shadow-blue-900/50 hover:scale-105 active:scale-95 transition-all"
            >
              <Camera size={64} className="opacity-90" />
              <span className="text-xl font-semibold opacity-90 tracking-wide">Camera Openen</span>
            </button>

            {/* Fotografie Tips */}
            <div className="w-full max-w-[320px] bg-[#1e1e1e] border border-gray-800 rounded-2xl p-4 mt-2">
              <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <Info size={16} className="text-blue-400" /> Tips voor het beste AI resultaat:
              </h3>
              <ul className="text-xs text-gray-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong>Meetlatje erbij:</strong> Leg een liniaal of muntje naast het onderdeel voor precieze afmetingen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong>Goed licht:</strong> Zorg voor een egale, heldere belichting. Vermijd harde schaduwen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong>Effen achtergrond:</strong> Fotografeer het op een rustige achtergrond (zoals een wit vel papier).</span>
                </li>
              </ul>
            </div>

            <div className="relative w-full flex items-center py-4">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-medium">OF</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <label className="w-full max-w-[280px] flex items-center justify-center gap-3 bg-[#1e1e1e] border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-2xl p-6 cursor-pointer transition-colors group">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <ImageUp className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              <span className="font-medium text-gray-300 group-hover:text-white transition-colors">Upload een bestand</span>
            </label>
          </div>
        )}

        {/* Live Camera View */}
        {isCapturing && (
          <div className="w-full flex flex-col items-center relative rounded-3xl overflow-hidden bg-black shadow-2xl mt-4">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full aspect-[3/4] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Overlay */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-3xl pointer-events-none">
              <div className="absolute inset-x-8 top-1/4 bottom-1/3 border-2 border-green-500/50 border-dashed rounded-xl flex items-center justify-center">
                <span className="bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-sm -mt-12">
                  Plaats het onderdeel hierin
                </span>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center px-8 gap-8">
              <button 
                onClick={stopCamera}
                className="p-3 bg-gray-800/80 backdrop-blur rounded-full text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={captureImage}
                className="w-20 h-20 bg-white/30 rounded-full p-2 backdrop-blur-sm shadow-xl"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
              <div className="w-[48px]"></div> {/* Spacer */}
            </div>
          </div>
        )}

        {/* Image Preview & Analyze Button */}
        {image && !loading && !result && (
          <div className="w-full flex flex-col items-center gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
              <img 
                src={`data:${mimeType};base64,${image}`} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
              <button 
                onClick={resetAll}
                className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <button 
              onClick={handleAnalyze}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/30 active:scale-95 transition-all text-lg flex justify-center items-center gap-2"
            >
              🚀 Identificeer Onderdeel
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="w-full flex flex-col items-center justify-center py-20 animate-pulse">
             <div className="relative">
               <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full"></div>
               <Loader2 size={64} className="text-blue-500 animate-spin relative z-10" />
             </div>
             <p className="mt-8 text-xl font-medium text-gray-200">Onderdeel identificeren...</p>
             <p className="text-gray-500 text-sm mt-2">AI analyseert afmetingen en materiaal</p>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="w-full flex flex-col gap-6 mt-4 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <button 
              onClick={resetAll}
              className="self-start flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Nieuwe scan</span>
            </button>

            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-lg">
                <img 
                  src={`data:${mimeType};base64,${image}`} 
                  className="w-full h-full object-cover"
                  alt="Thumbnail"
                />
              </div>
              <div className="flex flex-col justify-center min-h-[6rem]">
                <h2 className="text-2xl font-bold text-white leading-tight">{result.name}</h2>
                <span className="text-blue-400 text-sm font-medium mt-1">Identificatie Succesvol</span>
              </div>
            </div>

            <p className="text-gray-300 text-[15px] leading-relaxed">
              {result.description}
            </p>

            <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Specificaties</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#121212] p-3 rounded-xl border border-gray-800/50">
                  <span className="block text-xs text-gray-500 mb-1">Maat / Afmeting</span>
                  <span className="font-semibold text-gray-200">{result.specifications.measurements || 'Onbekend'}</span>
                </div>
                <div className="bg-[#121212] p-3 rounded-xl border border-gray-800/50">
                  <span className="block text-xs text-gray-500 mb-1">Materiaal</span>
                  <span className="font-semibold text-gray-200">{result.specifications.material || 'Onbekend'}</span>
                </div>
                {(result.specifications.headType || result.specifications.threadType) && (
                  <div className="col-span-2 bg-[#121212] p-3 rounded-xl border border-gray-800/50 grid grid-cols-2">
                    {result.specifications.headType && (
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Kop type</span>
                        <span className="font-semibold text-gray-200">{result.specifications.headType}</span>
                      </div>
                    )}
                    {result.specifications.threadType && (
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Draad type</span>
                        <span className="font-semibold text-gray-200">{result.specifications.threadType}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-900/50 rounded-2xl p-5 shadow-inner">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                <Info size={14} /> Advies
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                {result.replacementAdvice}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Meteen Kopen</h3>
              {result.searchKeywords.map((keyword, index) => (
                <div key={index} className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="font-medium text-gray-300">"{keyword}"</div>
                  <div className="flex gap-2 w-full">
                    {['Amazon', 'Hornbach', 'Gamma'].map(store => (
                      <a 
                        key={store}
                        href={getSearchUrl(keyword, store)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 bg-[#121212] hover:bg-gray-800 border border-gray-700/50 rounded-xl text-xs font-medium transition-colors"
                      >
                       <LinkIcon size={12} className="text-blue-400" />
                       {store}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

export default App;
