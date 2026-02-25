'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const MAJORS = [
  'Accounting', 'Actuarial Science', 'Anatomy', 'Biochemistry', 'Biology',
  'Biomedical Science', 'Business', 'Chemistry', 'Civil Engineering', 'Commerce',
  'Computer Science', 'Criminology', 'Data Science', 'Economics', 'Education',
  'Electrical Engineering', 'Environmental Science', 'Finance', 'Human Biology',
  'Information Technology', 'Law', 'Marketing', 'Mathematics', 'Mechanical Engineering',
  'Medicine', 'Nursing', 'Philosophy', 'Physics', 'Politics', 'Psychology',
  'Software Engineering', 'Statistics', 'Other'
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
  const [uniSearch, setUniSearch] = useState('')
  const [uniResults, setUniResults] = useState([])
  const [showUniDropdown, setShowUniDropdown] = useState(false)
  const [major1, setMajor1] = useState('')
  const [major2, setMajor2] = useState('')
  const [units, setUnits] = useState([])
  const [newUnit, setNewUnit] = useState('')
  const [error, setError] = useState(null)
  const uniRef = useRef(null)
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (uniRef.current && !uniRef.current.contains(e.target)) {
        setShowUniDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchUniversities = async (query) => {
    if (query.length < 2) { setUniResults([]); return }
    const res = await fetch(`/api/universities?q=${query}`)
    const data = await res.json()
    setUniResults(data)
  }

  const handleUniInput = (val) => {
    setUniSearch(val)
    setUniversity('')
    setShowUniDropdown(true)
    searchUniversities(val)
  }

  const selectUni = (name) => {
    setUniversity(name)
    setUniSearch(name)
    setShowUniDropdown(false)
    setUniResults([])
  }

  const addUnit = () => {
    if (!newUnit.trim()) return
    if (units.includes(newUnit.trim())) return
    setUnits([...units, newUnit.trim()])
    setNewUnit('')
  }

  const removeUnit = (unit) => setUnits(units.filter((u) => u !== unit))

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastInitial.trim()) {
      setError('Please enter your first name and last initial.')
      return
    }
    if (!university) {
      setError('Please select your university from the list.')
      return
    }
    if (!major1) {
      setError('Please select at least one major.')
      return
    }
    const display_name = formatDisplayName(firstName, lastInitial)
    const { error } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name, university, major1, major2: major2 || null, units })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  const preview = formatDisplayName(firstName, lastInitial)

  const labelStyle = { fontSize: '11px', color: '#aaa', marginBottom: '8px' }
  const inputStyle = { display: 'block', width: '100%', marginBottom: '12px', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const selectStyle = { display: 'block', width: '100%', marginBottom: '12px', padding: '12px', background: '#111', border: '1px solid #333', color: '#aaa', fontSize: '14px', outline: 'none' }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '80px 20px' }}>
      <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Uni-Grind</h1>
      <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '48px' }}>Set up your profile.</p>

      {error && <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '16px' }}>{error}</p>}

      <p style={labelStyle}>First name</p>
      <input
        type="text" placeholder="e.g. Alan" value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={inputStyle}
      />

      <p style={labelStyle}>Last initial</p>
      <input
        type="text" placeholder="e.g. T" value={lastInitial}
        onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
        maxLength={1} style={inputStyle}
      />

      {preview && (
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
          Display name: <span style={{ color: '#fff' }}>{preview}</span>
        </p>
      )}

      <p style={labelStyle}>University</p>
      <div ref={uniRef} style={{ position: 'relative', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search your university..."
          value={uniSearch}
          onChange={(e) => handleUniInput(e.target.value)}
          onFocus={() => uniSearch.length >= 2 && setShowUniDropdown(true)}
          style={{ ...inputStyle, marginBottom: 0, border: `1px solid ${university ? '#666' : '#333'}` }}
        />
        {showUniDropdown && uniResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '1px solid #333', borderTop: 'none', zIndex: 10, maxHeight: '240px', overflowY: 'auto' }}>
            {uniResults.map((name) => (
              <div
                key={name}
                onClick={() => selectUni(name)}
                style={{ padding: '10px 12px', fontSize: '13px', color: '#888', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={labelStyle}>Major</p>
      <select value={major1} onChange={(e) => setMajor1(e.target.value)} style={selectStyle}>
        <option value="" disabled>Select major</option>
        {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <p style={labelStyle}>Second major <span style={{ color: '#666' }}>(optional)</span></p>
      <select value={major2} onChange={(e) => setMajor2(e.target.value)} style={{ ...selectStyle, marginBottom: '32px' }}>
        <option value="">None</option>
        {MAJORS.filter((m) => m !== major1).map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <p style={labelStyle}>Units <span style={{ color: '#666' }}>(optional — add your current semester units)</span></p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text" placeholder="e.g. CITS2200"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUnit()}
          style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '13px', outline: 'none' }}
        />
        <button onClick={addUnit} style={{ padding: '8px 16px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>Add</button>
      </div>

      {units.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {units.map((unit) => (
            <div key={unit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', border: '1px solid #333', fontSize: '12px', color: '#aaa' }}>
              {unit}
              <span onClick={() => removeUnit(unit)} style={{ cursor: 'pointer', color: '#666', marginLeft: '4px' }}>×</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 28px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
        Let's go
      </button>
    </div>
    </div>
  )
}