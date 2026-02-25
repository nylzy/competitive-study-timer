'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const router = useRouter()
  const [topStudents, setTopStudents] = useState([])

  useEffect(() => {
    const fetchTop = async () => {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('user_id, duration_minutes')
        .gte('created_at', oneWeekAgo.toISOString())

      if (sessions) {
        const totals = {}
        sessions.forEach(s => {
          totals[s.user_id] = (totals[s.user_id] || 0) + s.duration_minutes
        })
        const userIds = Object.keys(totals)
        if (userIds.length === 0) return
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, university, major1')
          .in('id', userIds)
        const nameMap = {}
        profiles?.forEach(p => { nameMap[p.id] = p })
        const sorted = Object.entries(totals)
          .map(([user_id, minutes]) => ({
            user_id, minutes,
            display_name: nameMap[user_id]?.display_name || 'Anonymous',
            university: nameMap[user_id]?.university || '',
            major1: nameMap[user_id]?.major1 || '',
          }))
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 5)
        setTopStudents(sorted)
      }
    }
    fetchTop()
  }, [])

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Uni-Grind</h1>
        <button
          onClick={() => router.push('/login')}
          style={{ background: 'transparent', color: '#aaa', border: '1px solid #222', fontSize: '11px', letterSpacing: '0.1em', padding: '6px 14px', cursor: 'pointer' }}
        >
          Log in
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 20px 100px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa', marginBottom: '24px' }}>For ambitious university students</p>
        <h2 style={{ fontSize: '48px', fontWeight: '700', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '24px' }}>
          Study harder.<br />Prove it.
        </h2>
        <p style={{ fontSize: '15px', color: '#999', lineHeight: 1.7, marginBottom: '40px', maxWidth: '420px' }}>
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
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '48px' }}>How it works</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
            {[
              { n: '01', title: 'Set a task', body: 'Pick what you\'re working on and which unit it belongs to before you start.' },
              { n: '02', title: 'Run the timer', body: 'Work in focused blocks with automatic breaks. Sessions save automatically when complete.' },
              { n: '03', title: 'Track & compete', body: 'See your weekly hours, daily streak, and where you rank against other students.' },
            ].map((step) => (
              <div key={step.n}>
                <p style={{ fontSize: '11px', color: '#333', marginBottom: '12px', letterSpacing: '0.1em' }}>{step.n}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{step.title}</p>
                <p style={{ fontSize: '12px', color: '#bbb', lineHeight: 1.6 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666', marginBottom: '48px' }}>Features</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {[
              { title: 'Pomodoro timer', body: 'Customisable focus and break intervals. The timer keeps running even if you navigate away.' },
              { title: 'Leaderboard', body: 'See who\'s putting in the most hours at your university. Weekly and all-time rankings for friendly competition.' },
              { title: 'Unit breakdown', body: 'A weekly chart showing how many minutes you\'ve spent on each unit. Spot if you\'ve been neglecting a subject or over-indexing on one before it\'s too late.' },
              { title: 'Daily streak', body: 'Track consecutive days of study. Simple but effective motivation to show up every day.' },
            ].map((f) => (
              <div key={f.title} style={{ paddingBottom: '40px', borderBottom: '1px solid #111' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{f.title}</p>
                <p style={{ fontSize: '12px', color: '#bbb', lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard preview */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>Leaderboard</p>
          <p style={{ fontSize: '14px', color: '#bbb', marginBottom: '40px' }}>This week's top students across the world.</p>
          {topStudents.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#999' }}>No study sessions this week yet — be the first.</p>
          ) : topStudents.map((entry, index) => {
            const h = Math.floor(entry.minutes / 60)
            const m = entry.minutes % 60
            return (
              <div key={entry.user_id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid #111',
                borderLeft: '2px solid transparent', paddingLeft: '0'
              }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#aaa' }}>
                    <span style={{ color: '#999', marginRight: '12px' }}>#{index + 1}</span>
                    {entry.display_name}
                  </span>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '3px', paddingLeft: '24px' }}>
                    {entry.university}{entry.major1 ? ` · ${entry.major1}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#999' }}>{h}h {m}m</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid #111', padding: '100px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '16px' }}>Start tracking today.</h2>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '40px' }}>Free. No BS. Just study hours.</p>
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
        <p style={{ fontSize: '11px', color: '#555' }}>Uni-Grind · Built for ambitious students.</p>
      </div>

    </div>
  )
}