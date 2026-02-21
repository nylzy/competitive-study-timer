'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = [
  'UWA',
  'Curtin',
  'Murdoch',
  'ECU',
  'Notre Dame',
  'Other'
]

export default function Setup() {
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [university, setUniversity] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (data) router.push('/dashboard')
      }
    }
    getUser()
  }, [])

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name.')
      return
    }
    if (!university) {
      setError('Please select your university.')
      return
    }
    const { error } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name: displayName.trim(), university })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '120px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>StudyGrind</h1>
      <p style={{ fontSize: '12px', color: '#444', marginBottom: '48px' }}>Set up your profile.</p>

      {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

      <input
        type="text"
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{ marginBottom: '12px' }}
      />

      <select
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
        style={{
          display: 'block',
          width: '100%',
          marginBottom: '24px',
          padding: '12px',
          background: '#111',
          border: '1px solid #222',
          color: university ? '#fff' : '#555',
          fontSize: '14px',
          outline: 'none'
        }}
      >
        <option value="" disabled>Select your university</option>
        {UNIVERSITIES.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <button onClick={handleSubmit}>Let's go</button>
    </div>
  )
}