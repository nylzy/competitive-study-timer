'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = ['UWA', 'Curtin', 'Murdoch', 'ECU', 'Notre Dame', 'Other']

const MAJORS = [
  'Accounting',
  'Actuarial Science',
  'Anatomy',
  'Biochemistry',
  'Biology',
  'Biomedical Science',
  'Business',
  'Chemistry',
  'Civil Engineering',
  'Commerce',
  'Computer Science',
  'Criminology',
  'Data Science',
  'Economics',
  'Education',
  'Electrical Engineering',
  'Environmental Science',
  'Finance',
  'Human Biology',
  'Information Technology',
  'Law',
  'Marketing',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Nursing',
  'Philosophy',
  'Physics',
  'Politics',
  'Psychology',
  'Software Engineering',
  'Statistics',
  'Other'
]

function formatDisplayName(firstName, lastInitial) {
  if (!firstName.trim() || !lastInitial.trim()) return ''
  const first = firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1).toLowerCase()
  const initial = lastInitial.trim().charAt(0).toUpperCase()
  return `${first} ${initial}`
}

export default function Setup() {
  const [user, setUser] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [university, setUniversity] = useState('')
  const [major1, setMajor1] = useState('')
  const [major2, setMajor2] = useState('')
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
    if (!firstName.trim() || !lastInitial.trim()) {
      setError('Please enter your first name and last initial.')
      return
    }
    if (!university) {
      setError('Please select your university.')
      return
    }
    if (!major1) {
      setError('Please select at least one major.')
      return
    }

    const display_name = formatDisplayName(firstName, lastInitial)

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name,
        university,
        major1,
        major2: major2 || null
      })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  const selectStyle = {
    display: 'block',
    width: '100%',
    marginBottom: '12px',
    padding: '12px',
    background: '#111',
    border: '1px solid #222',
    color: '#888',
    fontSize: '14px',
    outline: 'none'
  }

  const preview = formatDisplayName(firstName, lastInitial)

  return (
    <div style={{ maxWidth: '400px', margin: '120px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>StudyGrind</h1>
      <p style={{ fontSize: '12px', color: '#444', marginBottom: '48px' }}>Set up your profile.</p>

      {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>First name</p>
      <input
        type="text"
        placeholder="e.g. Tom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={{ marginBottom: '12px' }}
      />

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Last initial</p>
      <input
        type="text"
        placeholder="e.g. N"
        value={lastInitial}
        onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
        maxLength={1}
        style={{ marginBottom: '12px' }}
      />

      {preview && (
        <p style={{ fontSize: '12px', color: '#555', marginBottom: '24px' }}>
          Display name: <span style={{ color: '#fff' }}>{preview}</span>
        </p>
      )}

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>University</p>
      <select value={university} onChange={(e) => setUniversity(e.target.value)} style={selectStyle}>
        <option value="" disabled>Select university</option>
        {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Major</p>
      <select value={major1} onChange={(e) => setMajor1(e.target.value)} style={selectStyle}>
        <option value="" disabled>Select major</option>
        {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Second major <span style={{ color: '#333' }}>(optional)</span></p>
      <select value={major2} onChange={(e) => setMajor2(e.target.value)} style={{ ...selectStyle, marginBottom: '32px' }}>
        <option value="">None</option>
        {MAJORS.filter((m) => m !== major1).map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <button onClick={handleSubmit}>Let's go</button>
    </div>
  )
}