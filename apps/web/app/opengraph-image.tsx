import { ImageResponse } from 'next/og';

// Dynamic default social-share card (Open Graph + Twitter). Brand-styled per
// docs/branding.md — warm cream ground, ink + terracotta. Rendered at the edge.
export const runtime = 'edge';
export const alt = 'Ryo — stay anywhere, and feel hosted. Just Ryo it.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF6F0',
          padding: '80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#C87156',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700, color: '#0E1A2B' }}>Ryo</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              color: '#0E1A2B',
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Stay anywhere — and feel hosted.
          </div>
          <div style={{ fontSize: 34, color: '#5C5750', marginTop: 28, maxWidth: 860 }}>
            Vetted hosts · a 24/7 concierge · honest pricing
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#C87156' }}>Just Ryo it.</div>
          <div style={{ fontSize: 24, color: '#8A837B' }}>ryo</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
