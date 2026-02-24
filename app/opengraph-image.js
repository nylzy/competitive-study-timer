import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'UniGrind - Study Tracker for Australian University Students'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#444',
          marginBottom: '24px',
          display: 'flex',
        }}>
          FOR AUSTRALIAN UNIVERSITY STUDENTS
        </div>
        <div style={{
          fontSize: '96px',
          fontWeight: '700',
          color: '#ffffff',
          letterSpacing: '-3px',
          lineHeight: 1,
          display: 'flex',
        }}>
          UNI-GRIND
        </div>
        <div style={{
          fontSize: '28px',
          color: '#444',
          marginTop: '24px',
          display: 'flex',
        }}>
          Study harder. Prove it.
        </div>
        <div style={{
          marginTop: '60px',
          display: 'flex',
          gap: '48px',
        }}>
          {['Pomodoro Timer', 'Leaderboard', 'Unit Breakdown', 'Daily Streak'].map((feature) => (
            <div key={feature} style={{
              fontSize: '13px',
              color: '#333',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'flex',
            }}>
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}