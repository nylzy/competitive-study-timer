'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = ['All', 'UWA', 'Curtin', 'Murdoch', 'ECU', 'Notre Dame', 'Other']

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [isBreak, setIsBreak] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [weeklyMinutes, setWeeklyMinutes] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [selectedUni, setSelectedUni] = useState('All')
  const [showSettings, setShowSettings] = useState(false)
  const [tempWork, setTempWork] = useState(25)
  const [tempBreak, setTempBreak] = useState(5)
  const [streak, setStreak] = useState(0)
  const intervalRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, university, major1, major2')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        if (profileData?.university) setSelectedUni(profileData.university)
        fetchWeeklyMinutes(user.id)
        fetchLeaderboard(profileData?.university || 'All')
        fetchStreak(user.id)
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

  const fetchLeaderboard = async (uniFilter) => {
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

      const userIds = Object.keys(totals)
      let profileQuery = supabase
        .from('profiles')
        .select('id, display_name, university, major1, major2')
        .in('id', userIds)

      const { data: profiles } = await profileQuery

      const nameMap = {}
      profiles?.forEach((p) => { nameMap[p.id] = { display_name: p.display_name, university: p.university, major1: p.major1, major2: p.major2 } })

      let sorted = Object.entries(totals)
        .map(([user_id, minutes]) => ({
          user_id,
          minutes,
          display_name: nameMap[user_id]?.display_name || 'Anonymous',
          university: nameMap[user_id]?.university || '',
          major1: nameMap[user_id]?.major1 || '',
          major2: nameMap[user_id]?.major2 || ''
        }))
        .filter((entry) => uniFilter === 'All' || entry.university === uniFilter)
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 10)

      setLeaderboard(sorted)
    }
  }

  const fetchStreak = async (userId) => {
  const { data } = await supabase
    .from('study_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) {
    setStreak(0)
    return
  }

  // Get unique days
  const days = [...new Set(data.map((s) => {
    const d = new Date(s.created_at)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))]

  // Count consecutive days back from today
  let count = 0
  const today = new Date()

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    const expectedStr = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`
    if (days[i] === expectedStr) {
      count++
    } else {
      break
    }
  }

  setStreak(count)
}

  const saveSession = async (minutes) => {
    await supabase.from('study_sessions').insert({ user_id: user.id, duration_minutes: minutes })
    fetchWeeklyMinutes(user.id)
    fetchLeaderboard(selectedUni)
    fetchLeaderboard(selectedUni)
    fetchStreak(user.id)
  }

  const startTimer = () => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          if (!isBreak) {
            saveSession(workMinutes)
            setIsBreak(true)
            setTimeLeft(breakMinutes * 60)
          } else {
            setIsBreak(false)
            setTimeLeft(workMinutes * 60)
          }
          return prev
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
    setIsBreak(false)
    setTimeLeft(workMinutes * 60)
  }

  const saveSettings = () => {
    const w = Math.max(1, Math.min(120, parseInt(tempWork) || 25))
    const b = Math.max(1, Math.min(60, parseInt(tempBreak) || 5))
    setWorkMinutes(w)
    setBreakMinutes(b)
    setTimeLeft(w * 60)
    setIsBreak(false)
    clearInterval(intervalRef.current)
    setRunning(false)
    setShowSettings(false)
  }

  const handleUniChange = (uni) => {
    setSelectedUni(uni)
    fetchLeaderboard(uni)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const hours = Math.floor(weeklyMinutes / 60)
  const mins = weeklyMinutes % 60

  return (
    <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>StudyGrind</h1>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
            {profile?.display_name} · {profile?.university} · {profile?.major1}{profile?.major2 ? ` & ${profile?.major2}` : ''}
          </p>
        </div>
        <button
          onClick={() => { setTempWork(workMinutes); setTempBreak(breakMinutes); setShowSettings(!showSettings) }}
          style={{ background: 'transparent', color: '#444', border: '1px solid #222', fontSize: '11px', letterSpacing: '0.1em', padding: '6px 14px' }}
        >
          Settings
        </button>
      </div>

      {showSettings && (
        <div style={{ marginBottom: '48px', padding: '24px', border: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '20px' }}>Timer Settings</p>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Work (minutes)</p>
              <input type="number" value={tempWork} onChange={(e) => setTempWork(e.target.value)} min="1" max="120" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Break (minutes)</p>
              <input type="number" value={tempBreak} onChange={(e) => setTempBreak(e.target.value)} min="1" max="60" />
            </div>
          </div>
          <button onClick={saveSettings}>Save</button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '16px' }}>
          {isBreak ? 'Break' : 'Focus'}
        </p>
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

      <div style={{ marginBottom: '60px', borderTop: '1px solid #1a1a1a', paddingTop: '40px', display: 'flex', gap: '60px' }}>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>This Week</p>
          <p style={{ fontSize: '48px', fontWeight: '700' }}>{hours}h {mins}m</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>Streak</p>
          <p style={{ fontSize: '48px', fontWeight: '700' }}>{streak} <span style={{ fontSize: '20px', color: '#444', fontWeight: '400' }}>{streak === 1 ? 'day' : 'days'}</span></p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444' }}>Leaderboard</p>
          <select
            value={selectedUni}
            onChange={(e) => handleUniChange(e.target.value)}
            style={{
              background: '#111',
              border: '1px solid #222',
              color: '#888',
              fontSize: '11px',
              padding: '6px 10px',
              outline: 'none',
              letterSpacing: '0.05em'
            }}
          >
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {leaderboard.length === 0 && (
          <p style={{ fontSize: '12px', color: '#333' }}>No results for this university yet.</p>
        )}

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
              <div>
                <span style={{ fontSize: '13px', color: isMe ? '#fff' : '#888' }}>
                  <span style={{ color: '#333', marginRight: '12px' }}>#{index + 1}</span>
                  {isMe ? 'You' : entry.display_name}
                </span>
                <p style={{ fontSize: '11px', color: '#333', marginTop: '3px', paddingLeft: '24px' }}>
                  {entry.university}{entry.major1 ? ` · ${entry.major1}` : ''}{entry.major2 ? ` & ${entry.major2}` : ''}
                </p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: isMe ? '#fff' : '#555' }}>{h}h {m}m</span>
            </div>
          )
          })}
      </div>

    </div>
  )
}