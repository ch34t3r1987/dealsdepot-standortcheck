import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Wifi, Settings, X, CheckCircle2, Clock, Map as MapIcon } from 'lucide-react';
import { PLZInput } from './components/PLZInput';
import { GermanyMap } from './components/GermanyMap';
import { PLZEntry } from './types';
import * as sync from './services/syncService';

const DDLogo = () => (
  <div className="flex items-center justify-center bg-[#32c7a3] w-10 h-10 rounded-xl shadow-lg shadow-[#32c7a3]/20">
    <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
      <path d="M20 30 Q20 20 30 20 L50 20 Q60 20 60 30 L60 70 Q60 80 50 80 L30 80 Q20 80 20 70 Z M35 35 L35 65 Q35 70 40 70 L45 70 L45 30 L40 30 Q35 30 35 35 Z" />
      <path d="M55 30 Q55 20 65 20 L85 20 Q95 20 95 30 L95 70 Q95 80 85 80 L65 80 Q55 80 55 70 Z M70 35 L70 65 Q70 70 75 70 L80 70 L80 30 L75 30 Q70 30 70 35 Z" />
    </svg>
  </div>
);

export const App: React.FC = () => {
  const [entries, setEntries] = useState<PLZEntry[]>([]);
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

  const handleAddEntry = async (entry: PLZEntry) => {
    if (isLive) {
      const success = await sync.pushEntry(entry);
      if (!success) alert("Cloud-Fehler.");
    } else {
      const newEntries = [entry, ...entries];
      setEntries(newEntries);
      localStorage.setItem('plz-votes', JSON.stringify(newEntries));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Löschen?")) {
      if (isLive) await sync.deleteEntry(id);
      else {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem('plz-votes', JSON.stringify(newEntries));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-12 font-sans text-gray-200">
      {notification && (
        <div className="fixed top-24 right-4 z-[9999] animate-bounce-in">
          <div className="bg-[#32c7a3] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{notification}</span>
          </div>
        </div>
      )}

      <header className="bg-[#1a1a1a]/80 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DDLogo />
            <h1 className="text-xl font-bold tracking-tight text-white">
              DealDepot <span className="text-[#32c7a3]">Standortcheck</span>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <span className="hover:text-white transition-colors cursor-pointer">Unsere Strategie</span>
            <span className="hover:text-white transition-colors cursor-pointer">Unser Angebot</span>
            <span className="hover:text-white transition-colors cursor-pointer">Erfolgsgeschichten</span>
            <span className="hover:text-white transition-colors cursor-pointer">FAQ</span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${isLive ? 'bg-[#32c7a3]/10 text-[#32c7a3]' : 'bg-white/5 text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#32c7a3] live-pulse' : 'bg-gray-600'}`}></div>
              {isLive ? 'SYNC AKTIV' : 'LOKAL'}
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-[#32c7a3] hover:bg-[#32c7a3]/10 transition-all">
              <Settings size={20} />
            </button>
            <button className="hidden sm:block px-5 py-2.5 bg-[#32c7a3] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#32c7a3]/20 hover:scale-105 transition-all">
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
              <Wifi className="text-[#32c7a3]" /> Cloud Sync
            </h3>
            <p className="text-gray-400 text-sm mb-6">Realtime-Anbindung für DealDepot-Daten.</p>
            <form onSubmit={(e) => { e.preventDefault(); sync.saveConfig(config.url, config.key); window.location.reload(); }} className="space-y-4">
              <input type="text" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="Supabase URL" className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3]" />
              <input type="password" value={config.key} onChange={e => setConfig({...config, key: e.target.value})} placeholder="Anon Key" className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3]" />
              <button type="submit" className="w-full py-4 bg-[#32c7a3] text-white font-bold rounded-xl hover:brightness-110 transition-all">Konfiguration Speichern</button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col gap-10">
            <section className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-white leading-tight">
                  Woher kommt <br/>
                  <span className="text-[#32c7a3]">eure Gruppe?</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-md">
                  Visualisiere die Herkunft deiner Community in Echtzeit auf einer interaktiven Karte.
                </p>
              </div>
              <PLZInput onAdd={handleAddEntry} />
            </section>
            
            <section className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between font-bold text-gray-200">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-[#32c7a3]" /> 
                  <span className="text-sm">Letzte Aktivitäten</span>
                </div>
                <span className="text-xs bg-[#32c7a3] px-2.5 py-1 rounded-full text-white">{entries.length} Teilnehmer</span>
              </div>

              <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {entries.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm italic">Warten auf erste Teilnehmer...</div>
                ) : (
                  entries.map((entry) => (
                    <div key={entry.id} className="px-6 py-5 flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-[#32c7a3]/10 text-[#32c7a3] flex items-center justify-center font-bold text-sm border border-[#32c7a3]/20">{entry.country}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{entry.nickname}</span>
                            <span className="text-[10px] font-bold bg-white/10 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">{entry.code}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 font-medium">{entry.city}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-32">
              <GermanyMap entries={entries} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
