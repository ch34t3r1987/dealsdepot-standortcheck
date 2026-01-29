import React, { useState, useEffect, useRef } from 'react';
import { Users, Map as MapIcon, BarChart3, Info, Sparkles, Trash2, Wifi, Settings, X, CheckCircle2, Clock } from 'lucide-react';
import PLZInput from './components/PLZInput';
import GermanyMap from './components/GermanyMap';
import { PLZEntry } from './types';
import { analyzeDistribution } from './services/gemini';
import * as sync from './services/syncService';

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
              showToast(`${newEntry.nickname} aus ${newEntry.city} ist beigetreten!`);
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
      if (!success) {
        alert("Fehler beim Speichern in der Cloud.");
      }
      // Hinweis: State Update erfolgt über Realtime Subscription
    } else {
      const newEntries = [entry, ...entries];
      setEntries(newEntries);
      localStorage.setItem('plz-votes', JSON.stringify(newEntries));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
      if (isLive) {
        const success = await sync.deleteEntry(id);
        if (!success) alert("Fehler beim Löschen.");
      } else {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem('plz-votes', JSON.stringify(newEntries));
      }
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sync.saveConfig(config.url, config.key);
    setShowSettings(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
              Verbinde das Tool mit Supabase (Realtime 'plz_entries' Tabelle erforderlich).
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Supabase URL</label>
                <input 
                  type="text" 
                  value={config.url}
                  onChange={e => setConfig({...config, url: e.target.value})}
                  placeholder="https://xyz.supabase.co"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Anon API Key</label>
                <input 
                  type="password" 
                  value={config.key}
                  onChange={e => setConfig({...config, key: e.target.value})}
                  placeholder="eyJhbGciOiJIUzI1..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                Speichern & Neu laden
              </button>
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
                Gib deine PLZ ein und sieh sofort, wo die anderen aus der Gruppe wohnen.
              </p>
              <PLZInput onAdd={handleAddEntry} />
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                <h3 className="font-bold text-gray-700">Letzte Aktivitäten</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {entries.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Noch keine Einträge vorhanden.</div>
                ) : (
                  entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="px-5 py-3 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{entry.nickname}</span>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{entry.code}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{entry.city} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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

            <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-800">KI-Analyse</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsAnalyzing(true);
                    analyzeDistribution(entries).then(res => {
                      setAnalysis(res);
                      setIsAnalyzing(false);
                    });
                  }}
                  disabled={isAnalyzing || entries.length < 1}
                  className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? "Analysiere..." : "Starten"}
                </button>
              </div>
              <div className="min-h-[60px] text-sm text-gray-600 italic">
                {analysis || "Klicke auf Starten für eine KI-Zusammenfassung der Regionen."}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <GermanyMap entries={entries} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
