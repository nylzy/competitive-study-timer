'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/setup')
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      setError('Check your email to confirm your account.')
    }
  }

  return (
  <div style={{ maxWidth: '400px', margin: '120px auto', padding: '0 20px' }}>
    <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Uni-Grind</h1>
    <p style={{ fontSize: '12px', color: '#777', marginBottom: '48px' }}>Effort is visible.</p>

    {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      style={{ marginBottom: '12px' }}
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      style={{ marginBottom: '24px' }}
    />
    <div style={{ display: 'flex', gap: '12px' }}>
      <button onClick={handleLogin}>Log In</button>
      <button onClick={handleSignUp} style={{ background: '#111', color: '#fff', border: '1px solid #222' }}>Sign Up</button>
    </div>
  </div>
)
}