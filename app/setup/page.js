'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Setup() {
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        // Check if they already have a profile
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (data) {
          router.push('/dashboard')
        }
      }
    }
    getUser()
  }, [])

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name.')
      return
    }
    const { error } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name: displayName.trim() })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
  <div style={{ maxWidth: '400px', margin: '120px auto', padding: '0 20px' }}>
    <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>StudyGrind</h1>
    <p style={{ fontSize: '12px', color: '#444', marginBottom: '48px' }}>Choose your display name for the leaderboard.</p>

    {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

    <input
      type="text"
      placeholder="Display name"
      value={displayName}
      onChange={(e) => setDisplayName(e.target.value)}
      style={{ marginBottom: '24px' }}
    />
    <button onClick={handleSubmit}>Let's go</button>
  </div>
)
}