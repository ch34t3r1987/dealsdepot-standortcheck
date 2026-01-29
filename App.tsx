
import React, { useState, useEffect, useRef } from 'react';
import { Users, Map as MapIcon, BarChart3, Info, Sparkles, Trash2, Wifi, Settings, X, CheckCircle2 } from 'lucide-react';
import PLZInput from './components/PLZInput.tsx';
import GermanyMap from './components/GermanyMap.tsx';
import { PLZEntry } from './types.ts';
import { analyzeDistribution } from './services/gemini.ts';
import * as sync from './services/syncService.ts';

const App: React.FC = () => {
  const [entries, setEntries] = useState<PLZEntry[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(sync.getStoredConfig());
  const [notification, setNotification] = useState<string | null>(null);
  
  const entriesRef = useRef<PLZEntry[]>([]);
  entriesRef.current = entries;

  // Initial Sync Connection
  useEffect(() => {
    if (config.url && config.key) {
      const client = sync.initSupabase(config.url, config.key);
      if (client) {
        setIsLive(true);
        loadInitialData();
        
        const subscription = sync.subscribeToChanges((newEntry) => {
          // Check if entry already exists locally (to avoid duplicates from own push)
          if (!entriesRef.current.some(e => e.id === newEntry.id)) {
            setEntries(prev => [newEntry, ...prev]);
            showToast(`${newEntry.nickname} aus ${newEntry.city} ist beigetreten!`);
          }
        });

        return () => {
          subscription?.unsubscribe();
        };
      }
    } else {
      // Local Storage Fallback
      const saved = localStorage.getItem('plz-votes');
      if (saved) setEntries(JSON.parse(saved));
    }
  }, [config]);

  const loadInitialData = async () => {
    const data = await sync.fetchEntries();
    if (data.length > 0) setEntries(data);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddEntry = async (entry: PLZEntry) => {
    if (isLive) {
      const success = await sync.pushEntry(entry);
      if (success) {
        setEntries(prev => [entry, ...prev]);
      } else {
        alert("Fehler beim Speichern in der Cloud. Prüfe deine Konfiguration.");
      }
    } else {
      setEntries(prev => [entry, ...prev]);
      localStorage.setItem('plz-votes', JSON.stringify([entry, ...entries]));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sync.saveConfig(config.url, config.key);
    setShowSettings(false);
    window.location.reload(); // Refresh to re-init sync
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-[9999] animate-bounce-in">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400">
            <CheckCircle2 size={20} />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MapIcon className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              DealsDepot Standortcheck
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 live-pulse' : 'bg-gray-400'}`}></div>
              {isLive ? 'LIVE CLOUD' : 'LOKALER MODUS'}
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Wifi className="text-blue-600" />
              Live-Sync Setup
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Verbinde das Tool mit einer Supabase-Instanz, um Standorte in Echtzeit mit deiner Discord-Gruppe zu teilen.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Supabase Project URL</label>
                <input 
                  type="text" 
                  value={config.url}
                  onChange={e => setConfig({...config, url: e.target.value})}
                  placeholder="https://xyz.supabase.co"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Anon Key / API Key</label>
                <input 
                  type="password" 
                  value={config.key}
                  onChange={e => setConfig({...config, key: e.target.value})}
                  placeholder="eyJhbGciOiJIUzI1..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                Verbindung Speichern
              </button>
              <p className="text-[10px] text-gray-400 text-center italic">
                Hinweis: Du benötigst eine Tabelle 'plz_entries' mit Realtime-Aktivierung.
              </p>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                Wer ist <span className="text-blue-600">woher?</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Teile deinen Standort live mit der Gruppe. Alle Daten werden sofort auf der Karte für jeden sichtbar.
              </p>
              
              <PLZInput onAdd={handleAddEntry} />
            </section>

            <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-800">KI-Regional-Analyse</h3>
                </div>
                <button 
                  onClick={() => analyzeDistribution(entries).then(setAnalysis)}
                  disabled={isAnalyzing || entries.length < 2}
                  className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition-all"
                >
                  Analyse starten
                </button>
              </div>
              <div className="min-h-[60px] text-sm text-gray-600 italic">
                {analysis || "Analysiere die aktuelle Verteilung aller Teilnehmer..."}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hidden md:block">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-gray-500" />
                Letzte Teilnehmer ({entries.length})
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {entries.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Warte auf Teilnehmer...</p>
                ) : (
                  entries.slice(0, 15).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all animate-fade-in">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-800">{entry.nickname}</span>
                           <span className="text-[9px] font-bold bg-gray-200 px-1 rounded text-gray-600 uppercase">{entry.country}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">{entry.code}</span>
                          <span className="text-[10px] text-gray-500">{entry.city}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Live DACH-Karte
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full uppercase tracking-wider font-bold animate-pulse">Live</span>
                </h3>
              </div>
              <GermanyMap entries={entries} />
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-in {
          0% { transform: translateY(-20px); opacity: 0; }
          60% { transform: translateY(5px); opacity: 1; }
          100% { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}} />
    </div>
  );
};

export default App;
