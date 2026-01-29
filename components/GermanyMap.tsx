import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PLZEntry } from '../types';

interface GermanyMapProps {
  entries: PLZEntry[];
}

export const GermanyMap: React.FC<GermanyMapProps> = ({ entries }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

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
    markersLayer.current.clearLayers();

    const counts: Record<string, { count: number; lat: number; lng: number; city?: string; nicknames: string[] }> = {};
    entries.forEach((e) => {
      // Gruppierung nach Koordinaten
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

    if (entries.length > 0 && mapInstance.current) {
      const group = L.featureGroup(markersLayer.current.getLayers() as L.Marker[]);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [entries]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-2 h-[500px] lg:h-[650px] relative z-0">
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
};
