
import React, { useState } from 'react';
import { MapPin, ArrowRight, User, Globe } from 'lucide-react';
import { getCoordsForPLZ } from '../utils/plzData.ts';
import { PLZEntry, CountryCode } from '../types.ts';

interface PLZInputProps {
  onAdd: (entry: PLZEntry) => void;
}

const PLZInput: React.FC<PLZInputProps> = ({ onAdd }) => {
  const [plz, setPlz] = useState('');
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<CountryCode>('DE');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('Bitte gib einen Nicknamen ein.');
      return;
    }

    const plzPattern = country === 'DE' ? /^\d{5}$/ : /^\d{4}$/;
    if (!plzPattern.test(plz)) {
      setError(`Bitte gib eine gültige ${country === 'DE' ? '5' : '4'}-stellige PLZ für ${country} ein.`);
      return;
    }

    const { lat, lng, region } = getCoordsForPLZ(plz, country);
    
    const newEntry: PLZEntry = {
      id: Math.random().toString(36).substring(7),
      code: plz,
      nickname: nickname.trim(),
      country: country,
      timestamp: Date.now(),
      lat,
      lng,
      city: region
    };

    onAdd(newEntry);
    setPlz('');
    setNickname('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MapPin className="text-blue-500" />
        Wer bist du & woher kommst du?
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <User size={18} />
          </div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Dein Nickname"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Globe size={18} />
            </div>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value as CountryCode);
                setPlz('');
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="DE">Deutschland (DE)</option>
              <option value="AT">Österreich (AT)</option>
              <option value="CH">Schweiz (CH)</option>
            </select>
          </div>
          <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin size={18} />
            </div>
            <input
              type="text"
              maxLength={country === 'DE' ? 5 : 4}
              value={plz}
              onChange={(e) => setPlz(e.target.value.replace(/\D/g, ''))}
              placeholder={`PLZ (${country === 'DE' ? '5' : '4'}-stellig)`}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono tracking-wider"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 active:scale-[0.98]"
        >
          Teilnehmen
          <ArrowRight size={18} />
        </button>

        {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
      </form>
    </div>
  );
};

export default PLZInput;
