import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 26 26" fill="none">
          <circle cx="13" cy="20" r="1.8" fill="#0F766E" />
          <path d="M8 15.5C10.5 13 15.5 13 18 15.5" stroke="#0F766E" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 11.5C9.5 6.8 16.5 6.8 21.5 11.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
