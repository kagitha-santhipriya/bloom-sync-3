import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Sprout, 
  AlertTriangle, 
  Map as MapIcon, 
  ChevronRight, 
  Globe,
  Thermometer,
  Wind,
  Droplets,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from './translations';
import { ClimateData, FarmerInput, Language } from './types';
import { getPollinationAnalysis } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const CircleAny = Circle as any;

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState(0);
  const [climateHistory, setClimateHistory] = useState<ClimateData[]>([]);
  const [farmerInputs, setFarmerInputs] = useState<FarmerInput[]>([]);
  const [currentInput, setCurrentInput] = useState<Partial<FarmerInput>>({
    crop_name: '',
    location_name: '',
    latitude: 17.3850,
    longitude: 78.4867,
    sowing_date: '',
    crop_category: 'pollinator-dependent'
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastSubmittedInput, setLastSubmittedInput] = useState<Partial<FarmerInput> | null>(null);

  const t = translations[lang];

  useEffect(() => {
    fetch('/api/climate-history')
      .then(res => res.json())
      .then(setClimateHistory);
    
    fetch('/api/farmer-inputs')
      .then(res => res.json())
      .then(setFarmerInputs);
  }, []);

  useEffect(() => {
    if (lastSubmittedInput && climateHistory.length > 0) {
      setLoading(true);
      getPollinationAnalysis(lastSubmittedInput, climateHistory, lang)
        .then(setAnalysis)
        .finally(() => setLoading(false));
    }
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastSubmittedInput(currentInput);
    try {
      const res = await fetch('/api/farmer-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInput)
      });
      const data = await res.json();
      
      // Get AI Analysis
      const aiResult = await getPollinationAnalysis(currentInput, climateHistory, lang);
      setAnalysis(aiResult);
      
      // Refresh inputs
      const inputsRes = await fetch('/api/farmer-inputs');
      const inputsData = await inputsRes.json();
      setFarmerInputs(inputsData);
      
      setActiveTab(1); // Move to analysis
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverlap = (bloom: number, pollinator: number) => {
    const windowSize = 15; // 15 days window
    const bloomStart = bloom - windowSize / 2;
    const bloomEnd = bloom + windowSize / 2;
    const pollStart = pollinator - windowSize / 2;
    const pollEnd = pollinator + windowSize / 2;

    const overlapStart = Math.max(bloomStart, pollStart);
    const overlapEnd = Math.min(bloomEnd, pollEnd);
    
    const overlap = Math.max(0, overlapEnd - overlapStart);
    return Math.round((overlap / windowSize) * 100);
  };

  const latestClimate = climateHistory[climateHistory.length - 1];
  const overlapIndex = latestClimate ? calculateOverlap(latestClimate.peak_bloom_day, latestClimate.pollinator_peak_day) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Sprout size={24} />
            </div>
            <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">
              {t.title}
            </h1>
          </div>
          
          <button 
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors text-sm font-medium"
          >
            <Globe size={16} />
            {t.languageToggle}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[t.farmerPortal, t.analysisPortal, t.riskPortal, t.mapPortal].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                activeTab === idx 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. Farmer Input Portal */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8">
                  <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                    <Sprout className="text-emerald-600" />
                    {t.farmerPortal}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">{t.cropName}</label>
                      <input 
                        required
                        type="text" 
                        value={currentInput.crop_name}
                        onChange={e => setCurrentInput({...currentInput, crop_name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder={t.cropPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">{t.location}</label>
                      <input 
                        required
                        type="text" 
                        value={currentInput.location_name}
                        onChange={e => setCurrentInput({...currentInput, location_name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder={t.locationPlaceholder}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">{t.sowingDate}</label>
                        <input 
                          required
                          type="date" 
                          value={currentInput.sowing_date}
                          onChange={e => setCurrentInput({...currentInput, sowing_date: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">{t.cropCategory}</label>
                        <select 
                          value={currentInput.crop_category}
                          onChange={e => setCurrentInput({...currentInput, crop_category: e.target.value as any})}
                          className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="pollinator-dependent">{t.pollinatorDependent}</option>
                          <option value="self-pollinating">{t.selfPollinating}</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? t.analyzing : t.submit}
                      <ChevronRight size={20} />
                    </button>
                  </form>
                </div>
                
                <div className="space-y-4">
                  <div className="glass-card p-6 bg-emerald-50 border-emerald-100">
                    <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <CloudSun size={18} />
                      {t.whyBloomSync}
                    </h3>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      {t.whyBloomSyncDesc}
                    </p>
                  </div>
                  
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-stone-900 mb-4">{t.recentSubmissions}</h3>
                    <div className="space-y-3">
                      {farmerInputs.slice(0, 3).map((input, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                          <div>
                            <p className="font-medium text-sm">{input.crop_name}</p>
                            <p className="text-xs text-stone-500">{input.location_name}</p>
                          </div>
                          <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-stone-200">
                            {input.sowing_date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Climate & Bloom Analysis Portal */}
            {activeTab === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                    <Thermometer className="text-orange-500 mb-2" size={32} />
                    <p className="text-sm text-stone-500 font-medium">{t.avgTempShift}</p>
                    <p className="text-3xl font-display font-bold text-stone-900">+1.8°C</p>
                    <p className="text-xs text-stone-400 mt-1">{t.last20Years}</p>
                  </div>
                  <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                    <Calendar className="text-blue-500 mb-2" size={32} />
                    <p className="text-sm text-stone-500 font-medium">{t.bloomWindowShift}</p>
                    <p className="text-3xl font-display font-bold text-stone-900">-12 Days</p>
                    <p className="text-xs text-stone-400 mt-1">{t.earlierBloom}</p>
                  </div>
                  <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                    <Wind className="text-emerald-500 mb-2" size={32} />
                    <p className="text-sm text-stone-500 font-medium">{t.overlapIndex}</p>
                    <p className={cn(
                      "text-3xl font-display font-bold",
                      overlapIndex > 70 ? "text-emerald-600" : overlapIndex > 40 ? "text-orange-500" : "text-red-500"
                    )}>{overlapIndex}%</p>
                    <p className="text-xs text-stone-400 mt-1">{t.currentSeason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-stone-900 mb-6">{t.tempTrend}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={climateHistory}>
                          <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="avg_temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-stone-900 mb-6">{t.bloomShift}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={climateHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Line type="monotone" dataKey="peak_bloom_day" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name={t.bloomPeak} />
                          <Line type="monotone" dataKey="pollinator_peak_day" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name={t.pollinatorPeak} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Risk Alert & Crop Recommendation Portal */}
            {activeTab === 2 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {!analysis ? (
                  <div className="glass-card p-12 text-center">
                    <AlertTriangle className="mx-auto text-stone-300 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-stone-900 mb-2">{t.noAnalysisYet}</h3>
                    <p className="text-stone-500">{t.noAnalysisDesc}</p>
                    <button 
                      onClick={() => setActiveTab(0)}
                      className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-bold"
                    >
                      {t.goToFarmerPortal}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "glass-card p-8 border-l-8",
                      analysis.riskScore === 'High' ? "border-l-red-500 bg-red-50/30" : 
                      analysis.riskScore === 'Moderate' ? "border-l-orange-500 bg-orange-50/30" : 
                      "border-l-emerald-500 bg-emerald-50/30"
                    )}>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-1">{t.riskScore}</h3>
                          <p className={cn(
                            "text-4xl font-display font-bold",
                            analysis.riskScore === 'High' ? "text-red-600" : 
                            analysis.riskScore === 'Moderate' ? "text-orange-600" : 
                            "text-emerald-600"
                          )}>{analysis.riskScore}</p>
                        </div>
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center text-white",
                          analysis.riskScore === 'High' ? "bg-red-500" : 
                          analysis.riskScore === 'Moderate' ? "bg-orange-500" : 
                          "bg-emerald-500"
                        )}>
                          <AlertTriangle size={32} />
                        </div>
                      </div>
                      <p className="text-stone-700 leading-relaxed text-lg">
                        {analysis.explanation}
                      </p>
                    </div>

                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                        <Wind className="text-emerald-600" />
                        {t.recommendations}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.recommendations.map((rec: string, i: number) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100"
                          >
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-sm text-stone-700 font-medium">{rec}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 4. Mapping & Localization Portal */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="glass-card p-4 h-[500px] relative overflow-hidden">
                  <MapContainerAny 
                    center={[17.3850, 78.4867]} 
                    zoom={7} 
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayerAny
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {farmerInputs.map((input, idx) => (
                      <React.Fragment key={idx}>
                        <Marker position={[input.latitude, input.longitude]}>
                          <Popup>
                            <div className="p-1">
                              <p className="font-bold text-emerald-900">{input.crop_name}</p>
                              <p className="text-xs text-stone-500">{input.location_name}</p>
                            </div>
                          </Popup>
                        </Marker>
                        <CircleAny 
                          center={[input.latitude, input.longitude]}
                          radius={20000}
                          pathOptions={{ 
                            fillColor: idx % 3 === 0 ? '#ef4444' : idx % 3 === 1 ? '#f97316' : '#10b981',
                            color: 'transparent',
                            fillOpacity: 0.2
                          }}
                        />
                      </React.Fragment>
                    ))}
                  </MapContainerAny>
                  
                  <div className="absolute bottom-8 right-8 z-[1000] glass-card p-4 bg-white/90">
                    <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">{t.riskLegend}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-red-500" /> {t.high}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-orange-500" /> {t.moderate}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> {t.safeZone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <Sprout size={18} />
            </div>
            <span className="font-display font-bold text-stone-900">BloomSync</span>
          </div>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            {t.footerDesc}
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-stone-400">
            <Globe size={20} />
            <Thermometer size={20} />
            <Wind size={20} />
          </div>
        </div>
      </footer>
    </div>
  );
}
