import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Sparkles, Trash2, Wifi, Settings, X, CheckCircle2, Clock, Key, AlertCircle, ExternalLink } from 'lucide-react';
import { PLZInput } from './components/PLZInput';
import { GermanyMap } from './components/GermanyMap';
import { PLZEntry } from './types';
import { analyzeDistribution } from './services/gemini';
import * as sync from './services/syncService';

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
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);
  
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
          (deletedId) => setEntries(prev => prev.filter(e => e.id !== deletedId))
        );
        return () => { subscription?.unsubscribe(); };
      }
    } else {
      const saved = localStorage.getItem('plz-votes');
      if (saved) setEntries(JSON.parse(saved));
    }
  }, [config]);

  const checkApiKey = async () => {
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (e) { console.warn("Key check failed", e); }
    }
  };

  const handleOpenKeyPicker = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setApiError(false);
      setAnalysis('');
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
      if (isLive) await sync.deleteEntry(id);
      else {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem('plz-votes', JSON.stringify(newEntries));
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (entries.length < 2) return;
    setIsAnalyzing(true);
    setApiError(false);
    try {
      const res = await analyzeDistribution(entries);
      setAnalysis(res);
    } catch (err: any) {
      if (err.message === 'KEY_INVALID') {
        setHasApiKey(false);
        setApiError(true);
        setAnalysis("API-Key ungültig oder nicht gesetzt.");
      } else {
        setAnalysis("Analyse fehlgeschlagen. Bitte versuche es später erneut.");
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
              <Wifi className="text-blue-600" /> Einstellungen
            </h3>
            <p className="text-gray-500 text-sm mb-6">Cloud-Sync und KI-Konfiguration.</p>
            <form onSubmit={(e) => { e.preventDefault(); sync.saveConfig(config.url, config.key); window.location.reload(); }} className="space-y-4">
               <label className="block text-[10px] font-bold text-gray-400 uppercase">Supabase Cloud Sync</label>
              <input type="text" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="Supabase URL" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={config.key} onChange={e => setConfig({...config, key: e.target.value})} placeholder="Anon Key" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all">Speichern</button>
            </form>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-2">KI-Schlüssel (Gemini)</h4>
              <button onClick={handleOpenKeyPicker} className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all mb-4">
                <Key size={16} /> Kostenlosen Key wählen
              </button>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Du kannst einen kostenlosen API-Key im Google AI Studio erstellen. Dieser reicht für private Analysen völlig aus.
                </p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 font-bold mt-2 flex items-center gap-1 hover:underline">
                  <ExternalLink size={12} /> Kostenlosen Key erstellen
                </a>
              </div>
            </div>
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

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Sparkles className="text-blue-600" size={18} /><h3 className="font-bold text-gray-800 text-sm">KI-Analyse</h3></div>
                {!hasApiKey || apiError ? (
                  <button onClick={handleOpenKeyPicker} className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-md">
                    <Key size={12} /> Key wählen
                  </button>
                ) : (
                  <button onClick={handleStartAnalysis} disabled={isAnalyzing || entries.length < 2} className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-all">
                    {isAnalyzing ? "Analysiere..." : "Starten"}
                  </button>
                )}
              </div>
              {apiError && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 items-start text-amber-800 text-[11px]">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div><p className="font-bold">Key erforderlich</p><p>Bitte wähle einen API-Key aus deinem Profil aus.</p></div>
                </div>
              )}
              <div className="text-xs text-gray-600 italic leading-relaxed min-h-[40px]">
                {analysis || (entries.length < 2 ? "Mindestens 2 Einträge nötig." : "Klicke auf 'Starten'.")}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <GermanyMap entries={entries} />
              <div className="mt-4 flex gap-4 text-[10px] text-gray-400 font-bold uppercase justify-center">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> DE / AT / CH</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
