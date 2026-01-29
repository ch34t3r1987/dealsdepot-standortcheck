
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Sparkles, Trash2, Wifi, Settings, X, CheckCircle2, Clock, Key } from 'lucide-react';
import { PLZInput } from './components/PLZInput';
import { GermanyMap } from './components/GermanyMap';
import { PLZEntry } from './types';
import { analyzeDistribution } from './services/gemini';
import * as sync from './services/syncService';

// Extend window interface for the custom aistudio methods
// Use the built-in AIStudio type to avoid conflict with existing global declarations
declare global {
  interface Window {
    aistudio: AIStudio;
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
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const entriesRef = useRef<PLZEntry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    checkApiKey();
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
          (deletedId) => {
            setEntries(prev => prev.filter(e => e.id !== deletedId));
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      }
    } else {
      const saved = localStorage.getItem('plz-votes');
      if (saved) setEntries(JSON.parse(saved));
    }
  }, [config]);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleOpenKeyPicker = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Per guidelines: MUST assume the key selection was successful after triggering openSelectKey()
      setHasApiKey(true);
    }
  };

  const loadInitialData = async () => {
    const data = await sync.fetchEntries();
    setEntries(data);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
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
      if (isLive) {
        await sync.deleteEntry(id);
      } else {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem('plz-votes', JSON.stringify(newEntries));
      }
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeDistribution(entries);
      setAnalysis(res);
    } catch (err: any) {
      // Handle the KEY_INVALID signal from the gemini service
      if (err.message === 'KEY_INVALID') {
        setHasApiKey(false);
        setAnalysis("API-Key ungültig oder nicht ausgewählt. Bitte Key-Setup durchführen.");
      } else {
        setAnalysis("Fehler bei der Analyse. Bitte später erneut versuchen.");
      }
    } finally {
      setIsAnalyzing(false);
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
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
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
              <Wifi className="text-blue-600" />
              Cloud Setup
            </h3>
            <p className="text-gray-500 text-sm mb-6">Gib deine Supabase-Daten ein für Realtime-Sync.</p>
            <form onSubmit={(e) => { e.preventDefault(); sync.saveConfig(config.url, config.key); window.location.reload(); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Project URL</label>
                <input type="text" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="https://xyz.supabase.co" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Anon Key</label>
                <input type="password" value={config.key} onChange={e => setConfig({...config, key: e.target.value})} placeholder="Key..." className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all">Verbinden & Speichern</button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-2">KI-Schlüssel</h4>
              <button 
                onClick={handleOpenKeyPicker}
                className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
              >
                <Key size={16} />
                Schlüssel auswählen / ändern
              </button>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Wird für die KI-Analyse benötigt. Nutze einen Key aus einem Projekt mit Abrechnung (ai.google.dev/gemini-api/docs/billing).
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <section>
              <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">
                Woher kommt <br/><span className="text-blue-600">eure Gruppe?</span>
              </h2>
              <p className="text-gray-500 mb-6 font-medium">DACH-Region Abdeckung: Deutschland, Österreich & Schweiz.</p>
              <PLZInput onAdd={handleAddEntry} />
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                  <Clock size={16} className="text-blue-600" />
                  Letzte Einträge
                </div>
                <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase">
                  {entries.length} Total
                </span>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                {entries.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 text-sm italic">Noch keine Daten auf der Karte...</div>
                ) : (
                  entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="px-5 py-4 border-b border-gray-50 flex items-center justify-between hover:bg-blue-50/30 transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {entry.country}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{entry.nickname}</span>
                            <span className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded uppercase">{entry.code}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{entry.city}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles size={40} className="text-blue-600" />
               </div>
              <div className="flex items-center justify-between mb-4 relative z-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={18} />
                  <h3 className="font-bold text-gray-800 text-sm">KI-Schwerpunktanalyse</h3>
                </div>
                {!hasApiKey ? (
                  <button 
                    onClick={handleOpenKeyPicker}
                    className="px-3 py-1.5 bg-orange-500 text-white text-[11px] font-bold rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-md shadow-orange-100"
                  >
                    <Key size={12} /> Key auswählen
                  </button>
                ) : (
                  <button 
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || entries.length < 2}
                    className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-30 shadow-md shadow-blue-100"
                  >
                    {isAnalyzing ? "Analysiere..." : "Analyse starten"}
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-600 italic leading-relaxed min-h-[40px]">
                {analysis || (entries.length < 2 ? "Mindestens 2 Einträge für Analyse erforderlich." : "Klicke auf den Button für eine Zusammenfassung.")}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <GermanyMap entries={entries} />
              <div className="mt-4 flex gap-4 text-[10px] text-gray-400 font-bold uppercase justify-center">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> DE</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> AT</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> CH</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
