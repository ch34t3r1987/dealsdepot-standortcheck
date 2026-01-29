
import React, { useState, useEffect } from 'react';
import { Users, Map as MapIcon, BarChart3, Info, Sparkles, Trash2 } from 'lucide-react';
import PLZInput from './components/PLZInput.tsx';
import GermanyMap from './components/GermanyMap.tsx';
import { PLZEntry } from './types.ts';
import { analyzeDistribution } from './services/gemini.ts';

const App: React.FC = () => {
  const [entries, setEntries] = useState<PLZEntry[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('plz-votes');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved votes");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('plz-votes', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = (entry: PLZEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const handleClear = () => {
    if (confirm("Möchtest du wirklich alle Daten löschen?")) {
      setEntries([]);
      setAnalysis('');
    }
  };

  const runAnalysis = async () => {
    if (entries.length < 2) {
      alert("Füge mindestens 2 Teilnehmer hinzu, um eine Analyse zu starten.");
      return;
    }
    setIsAnalyzing(true);
    const result = await analyzeDistribution(entries);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-500">
              <Users size={16} />
              <span>{entries.length} Teilnehmer</span>
            </div>
            {entries.length > 0 && (
              <button 
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Alles löschen"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                Wer ist <span className="text-blue-600">woher?</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Visualisiere die geografische Herkunft deiner Gruppe in der DACH-Region (DE, AT, CH). Gib deinen Namen und deine PLZ ein.
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
                  onClick={runAnalysis}
                  disabled={isAnalyzing || entries.length < 2}
                  className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 disabled:opacity-50 transition-all"
                >
                  {isAnalyzing ? 'Analysiere...' : 'Analyse starten'}
                </button>
              </div>
              
              <div className="min-h-[100px] flex items-center justify-center text-center">
                {analysis ? (
                  <p className="text-gray-700 text-sm italic leading-relaxed">
                    "{analysis}"
                  </p>
                ) : (
                  <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                    <Info size={32} strokeWidth={1.5} className="opacity-40" />
                    <p>Gib Daten ein und klicke auf "Analyse starten".</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hidden md:block">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-gray-500" />
                Letzte Teilnehmer
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {entries.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Noch keine Einträge...</p>
                ) : (
                  entries.slice(0, 15).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-800">{entry.nickname}</span>
                           <span className="text-[9px] font-bold bg-gray-200 px-1 rounded text-gray-600 uppercase">{entry.country}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">{entry.code}</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{entry.city}</span>
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
                  Interaktive DACH-Karte
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wider font-bold">Multi-Country</span>
                </h3>
              </div>
              <GermanyMap entries={entries} />
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-xs whitespace-nowrap">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-xs text-gray-600">Alle Standorte</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
