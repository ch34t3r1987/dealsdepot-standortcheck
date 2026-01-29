import React, { useEffect, useRef, useState } from 'react';
import { PLZEntry } from '../types';
import { Flame, MapPin } from 'lucide-react';

declare const L: any;

interface GermanyMapProps {
  entries: PLZEntry[];
}

export const GermanyMap: React.FC<GermanyMapProps> = ({ entries }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const heatLayerInstance = useRef<any>(null);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainerRef.current, {
      center: [51.1657, 10.4515],
      zoom: 6,
      zoomControl: true,
    });

    // Hellen Kartenstil mit deutscher Beschriftung verwenden (OSM DE)
    // Wir nutzen hier den Standard-OSM-Stil, der in Deutschland meist deutsche Labels hat,
    // oder einen sauberen hellen Stil wie CartoDB Positron, falls OSM DE nicht verfügbar ist.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap Mitwirkende',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(mapInstance.current);

    markersLayer.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    
    markersLayer.current.clearLayers();
    if (heatLayerInstance.current) {
      mapInstance.current.removeLayer(heatLayerInstance.current);
      heatLayerInstance.current = null;
    }

    if (viewMode === 'markers') {
      const counts: Record<string, { count: number; lat: number; lng: number; city?: string; nicknames: string[] }> = {};
      entries.forEach((e) => {
        const key = `${e.lat.toFixed(2)}|${e.lng.toFixed(2)}`;
        if (!counts[key]) {
          counts[key] = { count: 0, lat: e.lat, lng: e.lng, city: e.city, nicknames: [] };
        }
        counts[key].count++;
        if (!counts[key].nicknames.includes(e.nickname)) {
          counts[key].nicknames.push(e.nickname);
        }
      });

      Object.values(counts).forEach((data) => {
        const size = 32 + Math.min(data.count * 4, 30);
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#32c7a3;width:${size}px;height:${size}px;border-radius:12px;border:2px solid white;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;box-shadow:0 8px 24px rgba(50, 199, 163, 0.4)">${data.count > 1 ? data.count : '•'}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        L.marker([data.lat, data.lng], { icon })
          .bindPopup(`
            <div class="bg-white text-gray-900 p-2 rounded-lg shadow-xl">
              <div class="font-black text-[#32c7a3] border-b border-gray-100 mb-2 pb-1 text-sm uppercase tracking-wider">${data.city}</div>
              <div class="text-[11px] text-gray-600 font-medium leading-relaxed">${data.nicknames.join(', ')}</div>
            </div>
          `, { className: 'light-popup' })
          .addTo(markersLayer.current!);
      });
    } else {
      if (typeof L.heatLayer === 'function' && entries.length > 0) {
        const heatData = entries.map(e => [e.lat, e.lng, 1.0]); 
        
        heatLayerInstance.current = L.heatLayer(heatData, {
          radius: 35,
          blur: 20,
          maxZoom: 10,
          max: 1.0,
          minOpacity: 0.5,
          gradient: {
            0.2: '#e5f9f5',
            0.4: '#b2eddf',
            0.6: '#65dcc1',
            0.8: '#32c7a3',
            1.0: '#25a083'
          }
        }).addTo(mapInstance.current);

        if (heatLayerInstance.current.redraw) {
          heatLayerInstance.current.redraw();
        }
      }
    }

    if (entries.length > 0 && mapInstance.current) {
      const bounds = L.latLngBounds(entries.map(e => [e.lat, e.lng]));
      mapInstance.current.fitBounds(bounds.pad(0.3));
    }
  }, [entries, viewMode]);

  return (
    <div className="bg-white/5 rounded-[2.5rem] shadow-2xl border border-white/10 p-3 h-[600px] lg:h-[700px] relative z-0 backdrop-blur-md">
      <div className="absolute top-6 right-6 z-[1000] flex bg-white p-1.5 rounded-2xl shadow-xl border border-gray-100">
        <button 
          onClick={() => setViewMode('markers')}
          className={`px-5 py-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${viewMode === 'markers' ? 'bg-[#32c7a3] text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <MapPin size={14} /> Karte
        </button>
        <button 
          onClick={() => setViewMode('heatmap')}
          className={`px-5 py-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${viewMode === 'heatmap' ? 'bg-[#32c7a3] text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <Flame size={14} /> Heatmap
        </button>
      </div>
      <div ref={mapContainerRef} className="w-full h-full rounded-[2rem] overflow-hidden contrast-[1.05]" />
      
      <style>{`
        .light-popup .leaflet-popup-content-wrapper { background: white; color: #1a1a1a; border-radius: 12px; padding: 0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
        .light-popup .leaflet-popup-tip { background: white; }
        .leaflet-bar { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; border-radius: 12px !important; overflow: hidden; }
        .leaflet-bar a { background: white !important; color: #1a1a1a !important; border-bottom: 1px solid #f3f4f6 !important; }
        .leaflet-bar a:hover { background: #f9fafb !important; color: #32c7a3 !important; }
      `}</style>
    </div>
  );
};
