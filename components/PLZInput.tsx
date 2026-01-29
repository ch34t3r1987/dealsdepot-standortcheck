import React, { useState } from 'react';
import { getCoordsForPLZ } from '../utils/plzData';
import { PLZEntry, CountryCode } from '../types';

interface PLZInputProps {
  onAdd: (entry: PLZEntry) => void;
}

export const PLZInput: React.FC<PLZInputProps> = ({ onAdd }) => {
  const [plz, setPlz] = useState('');
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<CountryCode>('DE');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setError('Anzeigename fehlt'); return; }
    if (plz.length < 4) { setError('PLZ ist zu kurz'); return; }

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
    setError('');
  };

  return (
    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Dein Anzeigename</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="z.B. Markus"
            className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#32c7a3] focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Land</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full px-5 py-4 bg-[#242424] rounded-2xl border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#32c7a3] transition-all appearance-none cursor-pointer"
            >
              <option value="DE">Deutschland 🇩🇪</option>
              <option value="AT">Österreich 🇦🇹</option>
              <option value="CH">Schweiz 🇨🇭</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Postleitzahl</label>
            <input
              type="text"
              value={plz}
              onChange={(e) => setPlz(e.target.value.replace(/\D/g, ''))}
              placeholder="PLZ eingeben"
              maxLength={5}
              className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#32c7a3] outline-none transition-all"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-5 bg-[#32c7a3] text-white rounded-2xl font-black text-lg uppercase tracking-wider hover:brightness-110 shadow-xl shadow-[#32c7a3]/20 transition-all active:scale-[0.98]"
        >
          Eintragen
        </button>
        
        {error && <p className="text-red-400 text-xs text-center font-bold tracking-wide uppercase">{error}</p>}
      </form>
    </div>
  );
};
