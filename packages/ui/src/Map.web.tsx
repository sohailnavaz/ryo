'use client';
import { useEffect, useRef } from 'react';

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  /** Optional count badge (e.g. number of homes in a city cluster). */
  count?: number;
};

export type MapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Optional markers to render instead of (or in addition to) the single
   * center point. ADDITIVE — when omitted the map behaves exactly as before
   * (a single terracotta pin at lat/lng). When provided, these markers are
   * rendered and the single point is suppressed.
   */
  markers?: MapMarker[];
  /** Fired with the marker id when a marker is pressed. */
  onMarkerPress?: (id: string) => void;
  /** Optional id to highlight (rendered in terracotta). */
  selectedId?: string;
};

export function Map({
  lat,
  lng,
  zoom = 13,
  className,
  style,
  markers,
  onMarkerPress,
  selectedId,
}: MapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Keep the latest callback without forcing a full map re-create on each render.
  const onMarkerPressRef = useRef(onMarkerPress);
  onMarkerPressRef.current = onMarkerPress;

  // Serialise markers so the effect only re-runs when their data truly changes.
  const markersKey = markers
    ? markers.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.count ?? ''}`).join('|')
    : '';

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      if (!ref.current) return;
      try {
        const maplibre = await import('maplibre-gl');
        if (cancelled || !ref.current) return;
        // @ts-expect-error side-effect CSS import has no type
        await import('maplibre-gl/dist/maplibre-gl.css');
        const map = new maplibre.Map({
          container: ref.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [lng, lat],
          zoom,
          attributionControl: false,
        });

        const list = markers && markers.length > 0 ? markers : null;

        if (list) {
          const bounds = new maplibre.LngLatBounds();
          for (const m of list) {
            const el = document.createElement('button');
            el.type = 'button';
            el.setAttribute('aria-label', m.label ?? `Location ${m.id}`);
            const selected = m.id === selectedId;
            el.style.cssText = [
              'display:flex',
              'align-items:center',
              'gap:6px',
              'cursor:pointer',
              'border:none',
              'padding:6px 12px',
              'border-radius:9999px',
              'font:600 13px/1 Inter,system-ui,sans-serif',
              'box-shadow:0 2px 8px rgba(14,26,43,0.18)',
              selected ? 'background:#C87156;color:#FAF6F0' : 'background:#FAF6F0;color:#0E1A2B',
            ].join(';');

            const text = document.createElement('span');
            text.textContent = m.label ?? '';
            if (m.label) el.appendChild(text);

            if (typeof m.count === 'number') {
              const badge = document.createElement('span');
              badge.textContent = String(m.count);
              badge.style.cssText = [
                'display:inline-flex',
                'align-items:center',
                'justify-content:center',
                'min-width:18px',
                'height:18px',
                'padding:0 5px',
                'border-radius:9999px',
                'font:600 11px/1 Inter,system-ui,sans-serif',
                selected
                  ? 'background:#FAF6F0;color:#C87156'
                  : 'background:#0E1A2B;color:#FAF6F0',
              ].join(';');
              el.appendChild(badge);
            }

            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onMarkerPressRef.current?.(m.id);
            });

            new maplibre.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
            bounds.extend([m.lng, m.lat]);
          }
          if (list.length > 1) {
            map.fitBounds(bounds, { padding: 64, maxZoom: 11, animate: false });
          } else if (list[0]) {
            map.setCenter([list[0].lng, list[0].lat]);
          }
        } else {
          // Original single-point behaviour — unchanged.
          new maplibre.Marker({ color: '#C87156' }).setLngLat([lng, lat]).addTo(map);
        }

        cleanup = () => map.remove();
      } catch (err) {
        console.warn('[Map.web] failed to load maplibre-gl', err);
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom, markersKey, selectedId]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', height: 360, borderRadius: 16, overflow: 'hidden', ...style }}
    />
  );
}
