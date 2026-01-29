import React, { useEffect, useRef, useState } from 'react';
import { PLZEntry } from '../types';
import { Flame, MapPin } from 'lucide-react';

// Wir nutzen das globale 'L' von Leaflet, das via Script-Tag in index.html geladen wurde.
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

    // Initialisierung der Karte
    mapInstance.current = L.map(mapContainerRef.current, {
      center: [51.1657, 10.4515],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abcd',
      maxZoom: 20
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
    
    // Alte Layer entfernen
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
        const size = 24 + Math.min(data.count * 4, 30);
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#2563eb;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 4px 12px rgba(37, 99, 235, 0.4)">${data.count > 1 ? data.count : ''}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        L.marker([data.lat, data.lng], { icon })
          .bindPopup(`
            <div class="p-1">
              <div class="font-bold text-blue-600 border-b border-gray-100 mb-1 pb-1">${data.city}</div>
              <div class="text-xs text-gray-600">${data.nicknames.join(', ')}</div>
            </div>
          `)
          .addTo(markersLayer.current!);
      });
    } else {
      // Heatmap Modus
      if (typeof L.heatLayer === 'function') {
        // Wir setzen die Intensität auf 1.0 pro Punkt
        const heatData = entries.map(e => [e.lat, e.lng, 1.0]); 
        
        heatLayerInstance.current = L.heatLayer(heatData, {
          radius: 20,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(mapInstance.current);
      } else {
        console.error("Heatmap Plugin nicht gefunden.");
      }
    }

    // Auto-Zoom nur wenn Daten vorhanden
    if (entries.length > 0 && mapInstance.current) {
      const bounds = L.latLngBounds(entries.map(e => [e.lat, e.lng]));
      mapInstance.current.fitBounds(bounds.pad(0.2));
    }
  }, [entries, viewMode]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-2 h-[500px] lg:h-[650px] relative z-0">
      <div className="absolute top-4 right-4 z-[1000] flex bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setViewMode('markers')}
          className={`px-3 py-2 flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'markers' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <MapPin size={14} /> Marker
        </button>
        <button 
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-2 flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'heatmap' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Flame size={14} /> Heatmap
        </button>
      </div>
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
};
