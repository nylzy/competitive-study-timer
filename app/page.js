'use client'

import { useRouter } from 'next/navigation'

export default function Landing() {
  const router = useRouter()

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Uni-Grind</h1>
        <button
          onClick={() => router.push('/login')}
          style={{ background: 'transparent', color: '#444', border: '1px solid #222', fontSize: '11px', letterSpacing: '0.1em', padding: '6px 14px', cursor: 'pointer' }}
        >
          Log in
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 20px 100px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: '24px' }}>For Australian university students</p>
        <h2 style={{ fontSize: '48px', fontWeight: '700', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '24px' }}>
          Study harder.<br />Prove it.
        </h2>
        <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7, marginBottom: '40px', maxWidth: '420px' }}>
          Track your study hours with a Pomodoro timer, see how you stack up against other students, and understand where your time actually goes.
        </p>
        <button
          onClick={() => router.push('/login')}
          style={{ background: '#fff', color: '#000', border: 'none', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', padding: '14px 32px', cursor: 'pointer' }}
        >
          Get started free
        </button>
      </div>

      {/* How it works */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: '48px' }}>How it works</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
            {[
              { n: '01', title: 'Set a task', body: 'Pick what you\'re working on and which unit it belongs to before you start.' },
              { n: '02', title: 'Run the timer', body: 'Work in focused blocks with automatic breaks. Sessions save automatically when complete.' },
              { n: '03', title: 'Track & compete', body: 'See your weekly hours, daily streak, and where you rank against other students.' },
            ].map((step) => (
              <div key={step.n}>
                <p style={{ fontSize: '11px', color: '#333', marginBottom: '12px', letterSpacing: '0.1em' }}>{step.n}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{step.title}</p>
                <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: '48px' }}>Features</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {[
              { title: 'Pomodoro timer', body: 'Customisable focus and break intervals. The timer keeps running even if you navigate away.' },
              { title: 'Leaderboard', body: 'See who\'s putting in the most hours at your university. Weekly and all-time rankings for friendly competition.' },
              { title: 'Unit breakdown', body: 'A weekly chart showing how many minutes you\'ve spent on each unit. Spot if you\'ve been neglecting a subject or over-indexing on one before it\'s too late.' },
              { title: 'Daily streak', body: 'Track consecutive days of study. Simple but effective motivation to show up every day.' },
            ].map((f) => (
              <div key={f.title} style={{ paddingBottom: '40px', borderBottom: '1px solid #111' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{f.title}</p>
                <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard preview */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>Leaderboard</p>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '40px' }}>This week's top students across Australia.</p>
          {[
            { rank: 1, name: 'Sarah K', uni: 'UWA · Computer Science', time: '18h 40m' },
            { rank: 2, name: 'James T', uni: 'Curtin · Engineering', time: '16h 12m' },
            { rank: 3, name: 'Mia L', uni: 'UWA · Medicine', time: '14h 55m' },
            { rank: 4, name: 'Alex R', uni: 'Monash · Law', time: '13h 20m' },
            { rank: 5, name: 'You?', uni: 'Sign up to claim your spot', time: '—' },
          ].map((entry) => (
            <div key={entry.rank} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid #111',
              borderLeft: entry.rank === 5 ? '2px solid #333' : '2px solid transparent',
              paddingLeft: entry.rank === 5 ? '12px' : '0',
              opacity: entry.rank === 5 ? 0.5 : 1
            }}>
              <div>
                <span style={{ fontSize: '13px', color: entry.rank === 5 ? '#555' : '#888' }}>
                  <span style={{ color: '#333', marginRight: '12px' }}>#{entry.rank}</span>
                  {entry.name}
                </span>
                <p style={{ fontSize: '11px', color: '#333', marginTop: '3px', paddingLeft: '24px' }}>{entry.uni}</p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>{entry.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid #111', padding: '100px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '16px' }}>Start tracking today.</h2>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '40px' }}>Free. No BS. Just study hours.</p>
          <button
            onClick={() => router.push('/login')}
            style={{ background: '#fff', color: '#000', border: 'none', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', padding: '14px 32px', cursor: 'pointer' }}
          >
            Get started free
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #111', padding: '32px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#333' }}>Uni-Grind · Built for Australian students</p>
      </div>

    </div>
  )
}