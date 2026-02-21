'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [weeklyMinutes, setWeeklyMinutes] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const intervalRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchWeeklyMinutes(user.id)
        fetchLeaderboard()
      }
    }
    getUser()
  }, [])

  const fetchWeeklyMinutes = async (userId) => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (data) {
      const total = data.reduce((sum, session) => sum + session.duration_minutes, 0)
      setWeeklyMinutes(total)
    }
  }

  const fetchLeaderboard = async () => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('user_id, duration_minutes')
    .gte('created_at', oneWeekAgo.toISOString())

  if (sessions) {
    const totals = {}
    sessions.forEach((session) => {
      totals[session.user_id] = (totals[session.user_id] || 0) + session.duration_minutes
    })

    // Fetch display names for all users in leaderboard
    const userIds = Object.keys(totals)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    const nameMap = {}
    profiles?.forEach((p) => {
      nameMap[p.id] = p.display_name
    })

    const sorted = Object.entries(totals)
      .map(([user_id, minutes]) => ({
        user_id,
        minutes,
        display_name: nameMap[user_id] || 'Anonymous'
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10)

    setLeaderboard(sorted)
  }
}

  const saveSession = async (minutes) => {
    await supabase.from('study_sessions').insert({
      user_id: user.id,
      duration_minutes: minutes
    })
    fetchWeeklyMinutes(user.id)
    fetchLeaderboard()
  }

  const startTimer = () => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          saveSession(25)
          return 25 * 60
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setTimeLeft(25 * 60)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const hours = Math.floor(weeklyMinutes / 60)
  const minutes = weeklyMinutes % 60

  return (
  <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 20px' }}>
    
    <div style={{ marginBottom: '60px' }}>
      <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff' }}>StudyGrind</h1>
      <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{user?.email}</p>
    </div>

    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
      <div style={{ fontSize: '96px', fontWeight: '700', letterSpacing: '-2px', lineHeight: 1 }}>
        {formatTime(timeLeft)}
      </div>
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {!running ? (
          <button onClick={startTimer}>Start</button>
        ) : (
          <button onClick={pauseTimer}>Pause</button>
        )}
        <button onClick={resetTimer} style={{ background: '#111', color: '#fff', border: '1px solid #222' }}>Reset</button>
      </div>
    </div>

    <div style={{ marginBottom: '60px', borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>This Week</p>
      <p style={{ fontSize: '48px', fontWeight: '700' }}>{hours}h {minutes}m</p>
    </div>

    <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '24px' }}>Leaderboard</p>
      {leaderboard.map((entry, index) => {
        const h = Math.floor(entry.minutes / 60)
        const m = entry.minutes % 60
        const isMe = entry.user_id === user?.id
        return (
          <div key={entry.user_id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 0',
            borderBottom: '1px solid #111',
            borderLeft: isMe ? '2px solid #fff' : '2px solid transparent',
            paddingLeft: isMe ? '12px' : '0'
          }}>
            <span style={{ fontSize: '13px', color: isMe ? '#fff' : '#888' }}>
              <span style={{ color: '#333', marginRight: '12px' }}>#{index + 1}</span>
              {isMe ? 'You' : entry.display_name}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: isMe ? '#fff' : '#555' }}>{h}h {m}m</span>
          </div>
        )
      })}
    </div>

  </div>
)
}