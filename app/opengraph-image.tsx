import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GridGoal - Goal Tracking Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(to bottom right, #171717, #262626)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: '"Inter", sans-serif',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 900, marginBottom: '20px' }}>
          GridGoal
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#d4d4d4',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          All of the Progress, None of the Bloat
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
