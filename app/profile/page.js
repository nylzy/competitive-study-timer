'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = ['UWA', 'Curtin', 'Murdoch', 'ECU', 'Notre Dame', 'Other']

const MAJORS = [
  'Accounting', 'Actuarial Science', 'Anatomy', 'Biochemistry', 'Biology',
  'Biomedical Science', 'Business', 'Chemistry', 'Civil Engineering', 'Commerce',
  'Computer Science', 'Criminology', 'Data Science', 'Economics', 'Education',
  'Electrical Engineering', 'Environmental Science', 'Finance', 'Human Biology',
  'Information Technology', 'Law', 'Marketing', 'Mathematics', 'Mechanical Engineering',
  'Medicine', 'Nursing', 'Philosophy', 'Physics', 'Politics', 'Psychology',
  'Software Engineering', 'Statistics', 'Other'
]

export default function Profile() {
  const [user, setUser] = useState(null)
  const [university, setUniversity] = useState('')
  const [major1, setMajor1] = useState('')
  const [major2, setMajor2] = useState('')
  const [units, setUnits] = useState([])
  const [newUnit, setNewUnit] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase
        .from('profiles')
        .select('university, major1, major2, units')
        .eq('id', user.id)
        .single()
      if (data) {
        setUniversity(data.university || '')
        setMajor1(data.major1 || '')
        setMajor2(data.major2 || '')
        setUnits(data.units || [])
      }
    }
    getUser()
  }, [])

  const addUnit = () => {
    if (!newUnit.trim()) return
    if (units.includes(newUnit.trim())) return
    setUnits([...units, newUnit.trim()])
    setNewUnit('')
  }

  const removeUnit = (unit) => {
    setUnits(units.filter((u) => u !== unit))
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ university, major1, major2: major2 || null, units })
      .eq('id', user.id)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const selectStyle = {
    display: 'block', width: '100%', marginBottom: '12px',
    padding: '12px', background: '#111', border: '1px solid #222',
    color: '#888', fontSize: '14px', outline: 'none'
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Profile</h1>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{user?.email}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', color: '#444', border: '1px solid #222', fontSize: '11px', padding: '6px 14px' }}
        >
          Dashboard
        </button>
      </div>

      {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

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

      <p style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>Units</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text" placeholder="e.g. CITS2200"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUnit()}
          style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', fontSize: '13px', outline: 'none' }}
        />
        <button onClick={addUnit} style={{ padding: '8px 16px' }}>Add</button>
      </div>

      {units.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {units.map((unit) => (
            <div key={unit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', border: '1px solid #222', fontSize: '12px', color: '#888' }}>
              {unit}
              <span onClick={() => removeUnit(unit)} style={{ cursor: 'pointer', color: '#444', marginLeft: '4px' }}>×</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSave} style={{ marginRight: '12px' }}>
        {saved ? 'Saved!' : 'Save changes'}
      </button>
      <button onClick={handleLogout} style={{ background: 'transparent', color: '#444', border: '1px solid #222' }}>
        Log out
      </button>
    </div>
  )
}