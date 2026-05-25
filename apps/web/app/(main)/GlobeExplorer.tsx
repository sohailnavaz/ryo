'use client';
import createGlobe from 'cobe';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Destination = {
  id: string;
  name: string;
  country: string;
  landmark: string;
  lat: number;
  lng: number;
  history: string;
  activities: string[];
  bestTime: string;
};

const DESTINATIONS: Destination[] = [
  { id: 'hyderabad', name: 'Hyderabad', country: 'India', landmark: 'Charminar', lat: 17.36, lng: 78.47,
    history: 'Founded in 1591 by the Qutb Shahi dynasty; the Charminar still anchors the old city of bazaars, biryani and pearls.',
    activities: ['Old-city food walk', 'Golconda Fort', 'Pearl markets', 'Ramoji film city'], bestTime: 'Oct–Feb' },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', landmark: 'Fushimi Inari', lat: 35.01, lng: 135.77,
    history: 'Japan’s imperial capital for over a millennium — 1,600 temples, geisha districts and slow tea mornings.',
    activities: ['Temple-hopping', 'Tea ceremony', 'Arashiyama bamboo', 'Autumn maples'], bestTime: 'Mar–Apr, Nov' },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', landmark: 'Belém Tower', lat: 38.72, lng: -9.14,
    history: 'A city of seven hills and Age-of-Discovery seafarers; tiled façades, trams and fado in the Alfama.',
    activities: ['Tram 28', 'Pastéis de Belém', 'Sintra day-trip', 'Miradouro sunsets'], bestTime: 'May–Jun, Sep' },
  { id: 'tulum', name: 'Tulum', country: 'Mexico', landmark: 'Mayan Ruins', lat: 20.21, lng: -87.46,
    history: 'A clifftop Mayan port over turquoise water; today cenotes, jungle casitas and beach clubs.',
    activities: ['Cenote diving', 'Mayan ruins', 'Snorkeling', 'Beach clubs'], bestTime: 'Nov–Apr' },
  { id: 'santorini', name: 'Santorini', country: 'Greece', landmark: 'Oia Caldera', lat: 36.46, lng: 25.38,
    history: 'A volcanic crescent born from an ancient eruption; white-washed villages spill down the caldera.',
    activities: ['Caldera sunset', 'Island-hopping', 'Wine tasting', 'Sea kayaking'], bestTime: 'May–Jun, Sep' },
  { id: 'queenstown', name: 'Queenstown', country: 'New Zealand', landmark: 'The Remarkables', lat: -45.03, lng: 168.66,
    history: 'A gold-rush town turned adventure capital, ringed by the Remarkables and Lake Wakatipu.',
    activities: ['Alpine treks', 'Bungee', 'Lake cruises', 'Ski / snowboard'], bestTime: 'Dec–Feb, Jun–Aug' },
  { id: 'bali', name: 'Bali', country: 'Indonesia', landmark: 'Tanah Lot', lat: -8.41, lng: 115.19,
    history: 'The Island of the Gods — rice terraces, sea temples and a surf-and-yoga rhythm.',
    activities: ['Surfing', 'Rice-terrace treks', 'Temple visits', 'Reef diving'], bestTime: 'Apr–Oct' },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', landmark: 'Koutoubia', lat: 31.63, lng: -7.99,
    history: 'A 1,000-year-old imperial city of souks, riads and the Jemaa el-Fnaa’s nightly theatre.',
    activities: ['Souk wandering', 'Atlas Mountains', 'Desert overnight', 'Hammam'], bestTime: 'Mar–May, Sep–Nov' },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', landmark: 'Hallgrímskirkja', lat: 64.15, lng: -21.94,
    history: 'The world’s northernmost capital — gateway to volcanoes, geysers and the northern lights.',
    activities: ['Northern lights', 'Golden Circle', 'Glacier hikes', 'Hot springs'], bestTime: 'Sep–Mar (auroras)' },
  { id: 'capetown', name: 'Cape Town', country: 'South Africa', landmark: 'Table Mountain', lat: -33.92, lng: 18.42,
    history: 'Where two oceans meet beneath Table Mountain — beaches, vineyards and Cape fynbos.',
    activities: ['Table Mountain', 'Cape Point', 'Wine country', 'Shark diving'], bestTime: 'Nov–Mar' },
];

export function GlobeExplorer() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Destination>(DESTINATIONS[0]!);
  // target longitude (radians) to ease toward when a destination is picked
  const focusPhi = useRef<number | null>(null);
  const phi = useRef(0);

  useEffect(() => {
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 5.4,
      baseColor: [0.93, 0.89, 0.82], // warm sand
      markerColor: [0.78, 0.44, 0.34], // terracotta
      glowColor: [0.98, 0.95, 0.9],
      markers: DESTINATIONS.map((d) => ({ location: [d.lat, d.lng] as [number, number], size: 0.055 })),
      // onRender is valid at runtime but missing from cobe's option types
      onRender: (state: Record<string, number>) => {
        if (focusPhi.current !== null) {
          // ease toward the selected destination, then hold
          phi.current += (focusPhi.current - phi.current) * 0.08;
        } else {
          phi.current += 0.0035; // gentle auto-spin
        }
        state.phi = phi.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    } as Parameters<typeof createGlobe>[1]);
    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const pick = (d: Destination) => {
    setSelected(d);
    // bring the destination roughly to the front of the globe
    focusPhi.current = -(d.lng * Math.PI) / 180 + Math.PI;
  };

  return (
    <section className="border-b border-surface-border bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-10 md:py-16">
        <div className="max-w-[680px]">
          <p className="text-[13px] font-semibold uppercase tracking-[3px] text-brand-500">Where to next</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink md:text-[44px]">
            Spin the globe. Pick a place.
          </h2>
          <p className="mt-3 max-w-[520px] text-ink-soft md:text-[17px]">
            Tap a destination to see what it’s known for — history, things to do, when to go — then the homes waiting there.
          </p>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Globe + destination chips */}
          <div>
            <div className="relative mx-auto aspect-square w-full max-w-[480px]">
              <canvas ref={canvasRef} className="h-full w-full" style={{ contain: 'layout paint size' }} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {DESTINATIONS.map((d) => {
                const active = d.id === selected.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => pick(d)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
                      active
                        ? 'border-ink bg-ink text-white'
                        : 'border-surface-border text-ink hover:bg-surface-alt'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-3xl border border-surface-border bg-surface p-6 shadow-card">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-brand-600">
              {selected.country} · {selected.landmark}
            </p>
            <h3 className="mt-1 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">
              {selected.name}
            </h3>
            <p className="mt-3 text-[15px] leading-[23px] text-ink-soft">{selected.history}</p>

            <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-ink-muted">Things to do</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.activities.map((a) => (
                <span key={a} className="rounded-full bg-surface-alt px-3 py-1 text-[13px] text-ink">
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
              <span className="text-[13px] text-ink-soft">Best time to visit</span>
              <span className="text-[14px] font-semibold text-ink">{selected.bestTime}</span>
            </div>

            <button
              type="button"
              onClick={() => router.push('/discover')}
              className="mt-5 w-full rounded-full bg-brand-500 py-3 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-600 active:scale-[0.98]"
            >
              View stays in {selected.name}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
