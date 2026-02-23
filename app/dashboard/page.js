'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
  const [leaderboardView, setLeaderboardView] = useState('weekly')
  const [tasks, setTasks] = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskUnit, setNewTaskUnit] = useState('')
  const [unitData, setUnitData] = useState([])
  const intervalRef = useRef(null)
  const isBreakRef = useRef(false)
  const workMinutesRef = useRef(25)
  const breakMinutesRef = useRef(5)
  const mountedRef = useRef(false)
  const shouldAutoStart = useRef(false)
  const timerFinishedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    const savedWork = parseInt(localStorage.getItem('workMinutes')) || 25
    const savedBreak = parseInt(localStorage.getItem('breakMinutes')) || 5
    const wasRunning = localStorage.getItem('timerRunning') === 'true'
    const savedTimeLeft = parseInt(localStorage.getItem('timerTimeLeft')) || null
    const savedIsBreak = localStorage.getItem('timerIsBreak') === 'true'
    const savedAt = parseInt(localStorage.getItem('timerSavedAt')) || null

    setWorkMinutes(savedWork)
    setBreakMinutes(savedBreak)

    if (savedTimeLeft) {
      if (wasRunning && savedAt) {
        const secondsPassed = Math.floor((Date.now() - savedAt) / 1000)
        const adjusted = Math.max(0, savedTimeLeft - secondsPassed)
        setTimeLeft(adjusted > 0 ? adjusted : savedWork * 60)
        setIsBreak(savedIsBreak)
        if (adjusted > 0) {
          shouldAutoStart.current = true
          setRunning(true)
        }
      } else {
        setTimeLeft(savedTimeLeft)
        setIsBreak(savedIsBreak)
      }
    } else {
      setTimeLeft(savedWork * 60)
    }

    const savedActiveTask = localStorage.getItem('activeTask')
    if (savedActiveTask) {
      try {
        setActiveTask(JSON.parse(savedActiveTask))
      } catch (e) {
        localStorage.removeItem('activeTask')
      }
    }
  }, [])

  // Save timer state on every tick
  useEffect(() => {
    isBreakRef.current = isBreak
    workMinutesRef.current = workMinutes
    breakMinutesRef.current = breakMinutes
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    localStorage.setItem('timerTimeLeft', timeLeft)
    localStorage.setItem('timerIsBreak', isBreak)
    localStorage.setItem('timerRunning', running ? 'true' : 'false')
    localStorage.setItem('timerSavedAt', Date.now())
  }, [timeLeft, running, isBreak])

  // Save active task
  useEffect(() => {
    if (!mountedRef.current) return
    if (activeTask) {
      localStorage.setItem('activeTask', JSON.stringify(activeTask))
    } else {
      localStorage.removeItem('activeTask')
    }
  }, [activeTask])

  useEffect(() => {
    if (running && shouldAutoStart.current) {
      shouldAutoStart.current = false
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            timerFinishedRef.current = true
            setRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [running])

  useEffect(() => {
    if (!running && timerFinishedRef.current) {
      timerFinishedRef.current = false
      playBeep()
      if (!isBreakRef.current) {
        saveSession(workMinutesRef.current)
        setIsBreak(true)
        isBreakRef.current = true
        setTimeLeft(breakMinutesRef.current * 60)
      } else {
        setIsBreak(false)
        isBreakRef.current = false
        setTimeLeft(workMinutesRef.current * 60)
      }
    }
  }, [running])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, university, major1, major2, units')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        if (profileData?.university) setSelectedUni(profileData.university)
        fetchWeeklyMinutes(user.id)
        fetchLeaderboard(profileData?.university || 'All')
        fetchStreak(user.id)
        fetchTasks(user.id)
        fetchUnitData(user.id)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    getUser()
    return () => subscription.unsubscribe()
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

  const fetchLeaderboard = async (uniFilter, view = 'weekly') => {
    let query = supabase
      .from('study_sessions')
      .select('user_id, duration_minutes')
    if (view === 'weekly') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      query = query.gte('created_at', oneWeekAgo.toISOString())
    }
    const { data: sessions } = await query
    if (sessions) {
      const totals = {}
      sessions.forEach((session) => {
        totals[session.user_id] = (totals[session.user_id] || 0) + session.duration_minutes
      })
      const userIds = Object.keys(totals)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, university, major1, major2')
        .in('id', userIds)
      const nameMap = {}
      profiles?.forEach((p) => { nameMap[p.id] = { display_name: p.display_name, university: p.university, major1: p.major1, major2: p.major2 } })
      let sorted = Object.entries(totals)
        .map(([user_id, minutes]) => ({
          user_id, minutes,
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
    if (!data || data.length === 0) { setStreak(0); return }
    const days = [...new Set(data.map((s) => {
      const d = new Date(s.created_at)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))]
    let count = 0
    const today = new Date()
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(today)
      expected.setDate(today.getDate() - i)
      const expectedStr = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`
      if (days[i] === expectedStr) { count++ } else { break }
    }
    setStreak(count)
  }

  const fetchUnitData = async (userId) => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { data } = await supabase
      .from('study_sessions')
      .select('unit, duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
    if (data) {
      const totals = {}
      data.forEach((s) => {
        const key = s.unit || 'Untagged'
        totals[key] = (totals[key] || 0) + s.duration_minutes
      })
      const formatted = Object.entries(totals).map(([unit, minutes]) => ({
        unit,
        minutes
      }))
      setUnitData(formatted)
    }
  }

  const fetchTasks = async (userId) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, title: newTaskTitle.trim(), unit: newTaskUnit || null })
      .select()
      .single()
    if (data) {
      setTasks([...tasks, data])
      setNewTaskTitle('')
      setNewTaskUnit('')
    }
  }

  const completeTask = async (taskId) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', taskId)
    if (activeTask?.id === taskId) {
      setActiveTask(null)
      localStorage.removeItem('activeTask')
    }
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  const saveSession = async (minutes) => {
    if (!user) return
    await supabase.from('study_sessions').insert({
      user_id: user.id,
      duration_minutes: minutes,
      task_id: activeTask?.id || null,
      unit: activeTask?.unit || null
    })
    fetchWeeklyMinutes(user.id)
    fetchLeaderboard(selectedUni, leaderboardView)
    fetchStreak(user.id)
    fetchUnitData(user.id)
  }

  const startTimer = () => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          timerFinishedRef.current = true
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => { clearInterval(intervalRef.current); setRunning(false) }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setIsBreak(false)
    setTimeLeft(workMinutes * 60)
  }

  const saveSettings = () => {
    const w = Math.max(1, Math.min(120, parseInt(tempWork) || 25))
    const b = Math.max(1, Math.min(60, parseInt(tempBreak) || 5))
    setWorkMinutes(w); setBreakMinutes(b); setTimeLeft(w * 60)
    setIsBreak(false); clearInterval(intervalRef.current)
    setRunning(false); setShowSettings(false)
    localStorage.setItem('workMinutes', w)
    localStorage.setItem('breakMinutes', b)
  }

  const handleUniChange = (uni) => { setSelectedUni(uni); fetchLeaderboard(uni, leaderboardView) }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const playBeep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 1)
  }

  const hours = Math.floor(weeklyMinutes / 60)
  const mins = weeklyMinutes % 60

  return (
    <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Uni Grind</h1>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
            {profile?.display_name} · {profile?.university} · {profile?.major1}{profile?.major2 ? ` & ${profile?.major2}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/profile')}
            style={{ background: 'transparent', color: '#444', border: '1px solid #222', fontSize: '11px', letterSpacing: '0.1em', padding: '6px 14px' }}
          >
            Profile
          </button>
          <button
            onClick={() => { setTempWork(workMinutes); setTempBreak(breakMinutes); setShowSettings(!showSettings) }}
            style={{ background: 'transparent', color: '#444', border: '1px solid #222', fontSize: '11px', letterSpacing: '0.1em', padding: '6px 14px' }}
          >
            Settings
          </button>
        </div>
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

      {/* Timer */}
      <div style={{ textAlign: 'center', marginBottom: '60px', borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
        {activeTask && (
          <p style={{ fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {activeTask.unit ? `${activeTask.unit} · ` : ''}{activeTask.title}
          </p>
        )}
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

      {/* Tasks */}
      <div style={{ marginBottom: '60px', borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '24px' }}>Tasks</p>

        {activeTask && (
          <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#fff' }}>{activeTask.title}</p>
              {activeTask.unit && <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{activeTask.unit}</p>}
            </div>
            <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Active</p>
          </div>
        )}

        {tasks.length === 0 && !activeTask && (
          <p style={{ fontSize: '12px', color: '#333', marginBottom: '16px' }}>No tasks yet.</p>
        )}

        {tasks.map((task) => (
          <div key={task.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: '1px solid #111'
          }}>
            <div
              onClick={() => setActiveTask(activeTask?.id === task.id ? null : task)}
              style={{ cursor: 'pointer', flex: 1 }}
            >
              <p style={{ fontSize: '13px', color: activeTask?.id === task.id ? '#fff' : '#666' }}>{task.title}</p>
              {task.unit && <p style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>{task.unit}</p>}
            </div>
            <button
              onClick={() => completeTask(task.id)}
              style={{ background: 'transparent', color: '#333', border: '1px solid #222', fontSize: '10px', padding: '4px 10px', marginLeft: '12px' }}
            >
              Done
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <input
            type="text"
            placeholder="New task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            style={{ flex: 2, padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
          <select
            value={newTaskUnit}
            onChange={(e) => setNewTaskUnit(e.target.value)}
            style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #222', color: newTaskUnit ? '#fff' : '#555', fontSize: '13px', outline: 'none' }}
          >
            <option value="">No unit</option>
            {(profile?.units || []).map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button onClick={addTask} style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>+ Add</button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Unit Breakdown */}
      {unitData.length > 0 && (
        <div style={{ marginBottom: '60px', borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '24px' }}>This Week by Unit</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={unitData} barSize={32}>
              <XAxis dataKey="unit" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 0 }}
                labelStyle={{ color: '#fff', fontSize: 11 }}
                itemStyle={{ color: '#888', fontSize: 11 }}
                formatter={(value) => [`${value}m`, 'Minutes']}
              />
              <Bar dataKey="minutes" radius={0}>
                {unitData.map((entry, index) => {
                  const colors = ['#ffffff', '#888888', '#555555', '#333333', '#222222']
                  return <Cell key={entry.unit} fill={colors[index % colors.length]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
            {unitData.map((entry, index) => {
              const colors = ['#ffffff', '#888888', '#555555', '#333333', '#222222']
              return (
                <div key={entry.unit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', background: colors[index % colors.length] }} />
                  <span style={{ fontSize: '11px', color: '#444' }}>{entry.unit} — {entry.minutes}m</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444' }}>Leaderboard</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setLeaderboardView('weekly'); fetchLeaderboard(selectedUni, 'weekly') }}
                style={{ background: leaderboardView === 'weekly' ? '#fff' : 'transparent', color: leaderboardView === 'weekly' ? '#000' : '#444', border: '1px solid #222', fontSize: '10px', padding: '4px 10px', letterSpacing: '0.05em' }}
              >Weekly</button>
              <button
                onClick={() => { setLeaderboardView('alltime'); fetchLeaderboard(selectedUni, 'alltime') }}
                style={{ background: leaderboardView === 'alltime' ? '#fff' : 'transparent', color: leaderboardView === 'alltime' ? '#000' : '#444', border: '1px solid #222', fontSize: '10px', padding: '4px 10px', letterSpacing: '0.05em' }}
              >All-time</button>
            </div>
          </div>
          <select
            value={selectedUni}
            onChange={(e) => handleUniChange(e.target.value)}
            style={{ background: '#111', border: '1px solid #222', color: '#888', fontSize: '11px', padding: '6px 10px', outline: 'none', letterSpacing: '0.05em' }}
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
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid #111',
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