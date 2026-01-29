import React, { useState } from 'react';
import { getCoordsForPLZ } from '../utils/plzData';
import { PLZEntry, CountryCode } from '../types';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface PLZInputProps {
  onAdd: (entry: PLZEntry) => void;
}

export const PLZInput: React.FC<PLZInputProps> = ({ onAdd }) => {
  const [plz, setPlz] = useState('');
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<CountryCode>('DE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setError('Name fehlt'); return; }
    if (plz.length < 4) { setError('PLZ ungültig'); return; }

    setIsLoading(true);
    setError('');

    try {
      // In einer echten App würde hier ein fetch() auf eine PLZ-API stehen für 100% Abdeckung
      // await new Promise(r => setTimeout(r, 400)); // Simulierter Check

      const { lat, lng, region, state } = getCoordsForPLZ(plz, country);
      
      onAdd({
        id: Math.random().toString(36).substring(7),
        code: plz,
        nickname: nickname.trim(),
        country,
        timestamp: Date.now(),
        lat,
        lng,
        city: region,
        state: state
      });

      setPlz('');
      setNickname('');
    } catch (err) {
      setError('Standort nicht gefunden');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <MapPin size={80} className="text-[#32c7a3]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Anzeigename</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Dein Name..."
            className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#32c7a3] outline-none transition-all font-medium"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Land</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full px-5 py-4 bg-[#242424] rounded-2xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3] transition-all appearance-none cursor-pointer font-bold"
            >
              <option value="DE">Deutschland 🇩🇪</option>
              <option value="AT">Österreich 🇦🇹</option>
              <option value="CH">Schweiz 🇨🇭</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">PLZ (5-stellig)</label>
            <div className="relative">
              <input
                type="text"
                value={plz}
                onChange={(e) => setPlz(e.target.value.replace(/\D/g, ''))}
                placeholder="24..."
                maxLength={5}
                className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#32c7a3] outline-none transition-all font-bold tracking-widest"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-5 bg-[#32c7a3] text-white rounded-2xl font-black text-lg uppercase tracking-wider hover:brightness-110 shadow-xl shadow-[#32c7a3]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Eintragen'}
        </button>
        
        {error && <p className="text-red-400 text-[10px] text-center font-black uppercase tracking-tighter animate-pulse">{error}</p>}
      </form>
    </div>
  );
};
