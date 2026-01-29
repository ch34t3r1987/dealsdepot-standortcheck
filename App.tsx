import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, Wifi, Settings, X, CheckCircle2, Clock, Search, Filter, MapPin, Eraser, Map as MapIcon } from 'lucide-react';
import { PLZInput } from './components/PLZInput';
import { GermanyMap } from './components/GermanyMap';
import { PLZEntry, CountryCode } from './types';
import { DE_STATES, getCoordsForPLZ } from './utils/plzData';
import * as sync from './services/syncService';

const DDLogo = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-xl bg-gradient-to-br from-[#32c7a3] to-[#25a083] p-0.5 border border-white/20 shadow-lg group relative">
      <div className="w-full h-full bg-[#1a1a1a] rounded-[10px] flex items-center justify-center font-black text-white text-sm tracking-tighter select-none relative overflow-hidden">
        {!imgError ? (
          <img 
            src="https://dealdepot.io/wp-content/uploads/2023/03/ddd-300x300.png" 
            alt="DD" 
            className="w-full h-full object-contain filter brightness-125"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center leading-none">
            <span className="text-[#32c7a3] text-[10px] font-black">DEAL</span>
            <span className="text-white text-[10px] font-black">DEPOT</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [entries, setEntries] = useState<PLZEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(sync.getStoredConfig());
  const [notification, setNotification] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<CountryCode | 'ALL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  
  const entriesRef = useRef<PLZEntry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    setStateFilter('ALL');
  }, [countryFilter]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setCountryFilter('ALL');
    setStateFilter('ALL');
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
                            entry.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (entry.city && entry.city.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCountry = countryFilter === 'ALL' || entry.country === countryFilter;
      
      let effectiveState = entry.state;
      if (!effectiveState && entry.code) {
        const coords = getCoordsForPLZ(entry.code, entry.country);
        effectiveState = coords.state;
      }
      const matchesState = stateFilter === 'ALL' || effectiveState === stateFilter;
      return matchesSearch && matchesCountry && matchesState;
    });
  }, [entries, searchTerm, countryFilter, stateFilter]);

  const isFilterActive = searchTerm !== '' || countryFilter !== 'ALL' || stateFilter !== 'ALL';

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-12 font-sans text-gray-200">
      {notification && (
        <div className="fixed top-24 right-4 z-[9999] animate-bounce-in">
          <div className="bg-[#32c7a3] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{notification}</span>
          </div>
        </div>
      )}

      <header className="bg-[#0f0f0f]/80 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DDLogo />
            <h1 className="text-xl font-black tracking-tight text-white hidden sm:block">
              DealDepot <span className="text-[#32c7a3]">Standortcheck</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${isLive ? 'bg-[#32c7a3]/10 text-[#32c7a3]' : 'bg-white/5 text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#32c7a3] live-pulse' : 'bg-gray-600'}`}></div>
              {isLive ? 'SYNC AKTIV' : 'LOKAL'}
            </div>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-[#32c7a3] hover:bg-[#32c7a3]/10 transition-all border border-white/5"
            >
              <Settings size={20} />
            </button>
            <button className="px-6 py-2.5 bg-[#32c7a3] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#32c7a3]/20 hover:brightness-110 transition-all active:scale-95">
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
              <Wifi className="text-[#32c7a3]" /> Cloud Sync
            </h3>
            <p className="text-gray-400 text-sm mb-6">Realtime-Datenbank Anbindung.</p>
            <form onSubmit={(e) => { e.preventDefault(); sync.saveConfig(config.url, config.key); window.location.reload(); }} className="space-y-4">
              <input type="text" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="Supabase URL" className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3]" />
              <input type="password" value={config.key} onChange={e => setConfig({...config, key: e.target.value})} placeholder="Anon Key" className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3]" />
              <button type="submit" className="w-full py-4 bg-[#32c7a3] text-white font-bold rounded-xl hover:brightness-110 transition-all">Speichern</button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col gap-10">
            <section className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
                  Woher kommt <br/>
                  <span className="text-[#32c7a3]">eure Gruppe?</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-md font-medium">
                  Deine Community-Verteilung mit maximaler PLZ-Präzision.
                </p>
              </div>
              <PLZInput onAdd={handleAddEntry} />
            </section>
            
            <section className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
              <div className="px-8 py-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between font-bold text-gray-200">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-[#32c7a3]" /> 
                  <span className="text-xs uppercase tracking-[0.2em] font-black opacity-80">Teilnehmer</span>
                </div>
                <div className="flex items-center gap-2">
                  {isFilterActive && (
                    <button 
                      onClick={resetFilters}
                      className="text-[10px] text-gray-500 hover:text-[#32c7a3] transition-colors flex items-center gap-1 uppercase tracking-widest font-black"
                    >
                      <Eraser size={12} /> Filter aus
                    </button>
                  )}
                  <span className="text-[10px] font-black bg-[#32c7a3] px-3 py-1 rounded-full text-white uppercase tracking-wider">{filteredEntries.length} Aktiv</span>
                </div>
              </div>

              <div className="p-6 bg-white/[0.01] border-b border-white/5 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Suche..."
                    className="w-full pl-11 pr-4 py-3 bg-white/5 rounded-xl border border-white/10 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#32c7a3] transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {['ALL', 'DE', 'AT', 'CH'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setCountryFilter(c as any)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${countryFilter === c ? 'bg-[#32c7a3] text-white border-[#32c7a3] shadow-lg shadow-[#32c7a3]/20' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'}`}
                    >
                      {c === 'ALL' ? 'Alle' : c}
                    </button>
                  ))}
                </div>

                {countryFilter === 'DE' && (
                  <div className="flex items-center gap-2 animate-bounce-in">
                    <MapPin size={14} className="text-[#32c7a3] shrink-0" />
                    <select 
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-xs font-bold rounded-lg px-3 py-2 text-gray-400 outline-none focus:border-[#32c7a3] transition-colors cursor-pointer"
                    >
                      <option value="ALL">Alle Bundesländer</option>
                      {DE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="max-h-[450px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {filteredEntries.length === 0 ? (
                  <div className="p-16 text-center text-gray-600 text-xs font-bold uppercase tracking-widest italic opacity-50">Keine Daten</div>
                ) : (
                  filteredEntries.map((entry) => {
                    let displayState = entry.state;
                    if (!displayState && entry.code) {
                      displayState = getCoordsForPLZ(entry.code, entry.country).state;
                    }
                    return (
                      <div key={entry.id} className="px-8 py-6 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-default">
                        <div className="flex gap-5 items-center">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#32c7a3]/20 to-[#32c7a3]/5 text-[#32c7a3] flex items-center justify-center font-black text-[11px] border border-[#32c7a3]/30 uppercase shadow-inner">{entry.country}</div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white text-base">{entry.nickname}</span>
                              <span className="text-[10px] font-black bg-white/10 text-gray-400 px-2 py-0.5 rounded-md uppercase tracking-widest">{entry.code}</span>
                            </div>
                            <div className="text-[12px] text-gray-500 mt-1 font-semibold flex items-center gap-1.5">
                              <MapPin size={12} className="opacity-50" />
                              {entry.city} <span className="opacity-30">|</span> {displayState}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteEntry(entry.id)} className="p-3 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-32">
              <GermanyMap entries={filteredEntries} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
