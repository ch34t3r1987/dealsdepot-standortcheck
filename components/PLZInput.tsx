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
    if (!nickname.trim()) { setError('Nickname fehlt'); return; }
    if (plz.length < 4) { setError('PLZ zu kurz'); return; }

    const { lat, lng, region } = getCoordsForPLZ(plz, country);
    onAdd({
      id: Math.random().toString(36).substring(7),
      code: plz,
      nickname: nickname.trim(),
      country,
      timestamp: Date.now(),
      lat,
      lng,
      city: region
    });
    setPlz('');
    setNickname('');
    setError('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Dein Anzeigename</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="z.B. Markus"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Land</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="DE">Deutschland 🇩🇪</option>
              <option value="AT">Österreich 🇦🇹</option>
              <option value="CH">Schweiz 🇨🇭</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Postleitzahl</label>
            <input
              type="text"
              value={plz}
              onChange={(e) => setPlz(e.target.value.replace(/\D/g, ''))}
              placeholder="PLZ"
              maxLength={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
          Auf der Karte eintragen
        </button>
        {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
      </form>
    </div>
  );
};
