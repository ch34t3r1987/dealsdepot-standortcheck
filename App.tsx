import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Sparkles, Trash2, Wifi, Settings, X, CheckCircle2, Clock, Key, AlertCircle, ExternalLink, Info, Globe } from 'lucide-react';
import { PLZInput } from './components/PLZInput';
import { GermanyMap } from './components/GermanyMap';
import { PLZEntry } from './types';
import { analyzeDistribution } from './services/gemini';
import * as sync from './services/syncService';

// AI Studio Integration Types
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const App: React.FC = () => {
  const [entries, setEntries] = useState<PLZEntry[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(sync.getStoredConfig());
  const [notification, setNotification] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  
  const entriesRef = useRef<PLZEntry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    if (config.url && config.key) {
      const client = sync.initSupabase(config.url, config.key);
      if (client) {
        setIsLive(true);
        loadInitialData();
        const subscription = sync.subscribeToChanges(
          (newEntry) => {
            if (!entriesRef.current.some(e => e.id === newEntry.id)) {
              setEntries(prev => [newEntry, ...prev]);
              showToast(`${newEntry.nickname} aus ${newEntry.city} ist dabei!`);
            }
          },
          (deletedId) => setEntries(prev => prev.filter(e => e.id !== deletedId))
        );
        return () => { subscription?.unsubscribe(); };
      }
    } else {
      const saved = localStorage.getItem('plz-votes');
      if (saved) setEntries(JSON.parse(saved));
    }
  }, [config]);

  const loadInitialData = async () => {
    const data = await sync.fetchEntries();
    setEntries(data);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartAnalysis = async () => {
    if (entries.length < 2) return;
    
    setIsAnalyzing(true);
    setKeyError(null);
    try {
      const res = await analyzeDistribution(entries);
      setAnalysis(res);
    } catch (err: any) {
      console.error("Fehler in der Analyse:", err);
      if (err.message === "APIGEM_KEY_MISSING") {
        setKeyError("Kein API-Key gefunden. Bitte in Vercel als APIGEM_KEY hinterlegen.");
      } else if (err.message?.includes("API key not valid") || err.status === 400) {
        setKeyError("Der angegebene APIGEM_KEY ist ungültig oder die Abrechnung im Google Projekt fehlt.");
      } else {
        setAnalysis("Analyse fehlgeschlagen. Bitte versuche es später erneut.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddEntry = async (entry: PLZEntry) => {
    if (isLive) {
      const success = await sync.pushEntry(entry);
      if (!success) alert("Fehler beim Cloud-Speichern.");
    } else {
      const newEntries = [entry, ...entries];
      setEntries(newEntries);
      localStorage.setItem('plz-votes', JSON.stringify(newEntries));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Diesen Eintrag löschen?")) {
      if (isLive) await sync.deleteEntry(id);
      else {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem('plz-votes', JSON.stringify(newEntries));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {notification && (
        <div className="fixed top-20 right-4 z-[9999] animate-bounce-in">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{notification}</span>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
              <MapIcon className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              DealsDepot <span className="text-blue-600">Standortcheck</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 live-pulse' : 'bg-gray-400'}`}></div>
              {isLive ? 'SYNC AKTIV' : 'LOKAL'}
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-900">
              <Wifi className="text-blue-600" /> Cloud Setup
            </h3>
            <p className="text-gray-500 text-sm mb-6">Supabase für Realtime-Sync einrichten.</p>
            <form onSubmit={(e) => { e.preventDefault(); sync.saveConfig(config.url, config.key); window.location.reload(); }} className="space-y-4">
              <input type="text" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="Supabase URL" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={config.key} onChange={e => setConfig({...config, key: e.target.value})} placeholder="Anon Key" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all">Verbinden</button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <section>
              <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">Woher kommt <br/><span className="text-blue-600">eure Gruppe?</span></h2>
              <PLZInput onAdd={handleAddEntry} />
            </section>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between font-bold text-gray-700 text-sm">
                <div className="flex items-center gap-2"><Clock size={16} className="text-blue-600" /> Letzte Einträge</div>
                <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 uppercase">{entries.length}</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                {entries.length === 0 ? <div className="p-10 text-center text-gray-400 text-sm italic">Noch keine Daten...</div> : 
                  entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="px-5 py-4 border-b border-gray-50 flex items-center justify-between group hover:bg-blue-50/30 transition-all">
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{entry.country}</div>
                        <div>
                          <div className="flex items-center gap-2"><span className="font-bold text-gray-900">{entry.nickname}</span><span className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded uppercase">{entry.code}</span></div>
                          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{entry.city}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))
                }
              </div>
            </section>

            <section className={`bg-white rounded-2xl p-6 border transition-all ${keyError ? 'border-red-200 bg-red-50/30' : 'border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className={keyError ? 'text-red-500' : 'text-blue-600'} size={18} />
                  <h3 className="font-bold text-gray-800 text-sm">KI-Analyse</h3>
                </div>
                {!keyError && (
                  <button 
                    onClick={handleStartAnalysis} 
                    disabled={isAnalyzing || entries.length < 2} 
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    {isAnalyzing ? "Analysiere..." : <><Sparkles size={14} /> Starten</>}
                  </button>
                )}
              </div>

              {keyError && (
                <div className="mb-4 space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-red-100/50 rounded-xl border border-red-100">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                    <div className="text-xs">
                      <p className="font-bold text-red-900">Konfigurations-Fehler</p>
                      <p className="text-red-700 leading-tight mt-1">{keyError}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider">
                      <Globe size={12} /> Vercel Setup benötigt
                    </div>
                    <p>
                      Bitte hinterlege deinen Key in deinem Vercel Dashboard unter <strong>Settings &gt; Environment Variables</strong>.
                    </p>
                    <div className="pl-2 border-l-2 border-blue-200 italic">
                      Variable Name: <code className="bg-gray-100 px-1 rounded text-blue-700">APIGEM_KEY</code>
                    </div>
                    <p className="text-[10px]">Vergiss nicht, danach ein neues Deployment zu starten, damit die Variable aktiv wird.</p>
                  </div>
                </div>
              )}

              <div className={`text-xs italic leading-relaxed min-h-[40px] p-4 rounded-xl border ${keyError ? 'bg-white/50 border-red-100 text-red-400' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                {analysis || (entries.length < 2 ? "Füge mindestens 2 Personen hinzu." : "Bereit für die Analyse.")}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <GermanyMap entries={entries} />
              <div className="mt-4 flex gap-4 text-[10px] text-gray-400 font-bold uppercase justify-center">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> DE / AT / CH Karte aktiv</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
