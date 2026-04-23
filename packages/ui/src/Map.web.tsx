'use client';
import { useEffect, useRef } from 'react';

export type MapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function Map({ lat, lng, zoom = 13, className, style }: MapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      if (!ref.current) return;
      try {
        const maplibre = await import('maplibre-gl');
        if (cancelled || !ref.current) return;
        await import('maplibre-gl/dist/maplibre-gl.css');
        const map = new maplibre.Map({
          container: ref.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [lng, lat],
          zoom,
          attributionControl: false,
        });
        new maplibre.Marker({ color: '#ff385c' }).setLngLat([lng, lat]).addTo(map);
        cleanup = () => map.remove();
      } catch (err) {
        console.warn('[Map.web] failed to load maplibre-gl', err);
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [lat, lng, zoom]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', height: 360, borderRadius: 16, overflow: 'hidden', ...style }}
    />
  );
}
