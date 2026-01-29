
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PLZEntry } from '../types.ts';

interface GermanyMapProps {
  entries: PLZEntry[];
}

const GermanyMap: React.FC<GermanyMapProps> = ({ entries }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainerRef.current, {
      center: [51.1657, 10.4515],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstance.current);

    markersLayer.current = L.layerGroup().addTo(mapInstance.current);

    setTimeout(() => {
      mapInstance.current?.invalidateSize();
    }, 100);

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

    const counts: Record<string, { count: number; lat: number; lng: number; city?: string; nicknames: string[] }> = {};
    entries.forEach((e) => {
      const key = `${e.lat.toFixed(3)}|${e.lng.toFixed(3)}`;
      if (!counts[key]) {
        counts[key] = { count: 0, lat: e.lat, lng: e.lng, city: e.city, nicknames: [] };
      }
      counts[key].count++;
      if (!counts[key].nicknames.includes(e.nickname)) {
        counts[key].nicknames.push(e.nickname);
      }
    });

    const entriesArray = Object.values(counts);

    entriesArray.forEach((data) => {
      const size = 16 + Math.min(data.count * 4, 32);
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: #2563eb;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-family: 'Inter', sans-serif;
            font-size: ${size > 22 ? '12px' : '10px'};
          ">
            ${data.count > 1 ? data.count : ''}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const nicknamesHtml = data.nicknames
        .map(name => `<div style="padding: 2px 0; border-bottom: 1px solid #f1f5f9; last-child { border: none }">• ${name}</div>`)
        .join('');

      const marker = L.marker([data.lat, data.lng], { icon })
        .bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 140px;">
            <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="color: #1e3a8a; font-size: 14px; display: block;">${data.city || 'Unbekannter Ort'}</strong>
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${data.count} Person${data.count > 1 ? 'en' : ''}</span>
            </div>
            <div style="max-height: 120px; overflow-y: auto; font-size: 12px; color: #334155;">
              ${nicknamesHtml}
            </div>
          </div>
        `, {
          closeButton: false,
          offset: L.point(0, -size/2)
        });
      
      markersLayer.current?.addLayer(marker);
    });

    if (entriesArray.length > 0) {
      const group = L.featureGroup(markersLayer.current.getLayers() as L.Marker[]);
      mapInstance.current.fitBounds(group.getBounds().pad(0.3));
    } else {
      mapInstance.current.setView([51.1657, 10.4515], 6);
    }
  }, [entries]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-2 relative overflow-hidden h-[500px] lg:h-[600px] z-0">
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl" />
      
      {entries.length === 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-lg border border-blue-100 z-[1000] pointer-events-none">
          <p className="text-blue-600 text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Warte auf erste Einträge...
          </p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-div-icon { background: none !important; border: none !important; }
        .custom-div-icon:hover > div { transform: scale(1.1); transition: transform 0.2s; }
        .leaflet-popup-content-wrapper { border-radius: 16px; padding: 4px; }
      `}} />
    </div>
  );
};

export default GermanyMap;
