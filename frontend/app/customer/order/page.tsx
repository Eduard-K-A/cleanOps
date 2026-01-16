"use client"

import React, { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

type RoomType = 'Bedroom' | 'Bathroom' | 'Kitchen' | 'Living Room' | 'Office'

function OrderContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rooms, setRooms] = useState<number>(1)
  const [selectedTypes, setSelectedTypes] = useState<RoomType[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const allTypes: RoomType[] = ['Bedroom', 'Bathroom', 'Kitchen', 'Living Room', 'Office']

  function toggleType(t: RoomType) {
    setSelectedTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  }

  function validate() {
    if (!name.trim()) return 'Please enter your name.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) return 'Please enter a valid email.'
    if (!rooms || rooms < 1) return 'Please enter at least 1 room.'
    if (selectedTypes.length === 0) return 'Select at least one room type to clean.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const v = validate()
    if (v) return setError(v)

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          rooms,
          selectedTypes,
          notes
        })
      })
      
      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      setSuccess('Order created — we will contact you shortly.')
      setName('')
      setEmail('')
      setRooms(1)
      setSelectedTypes([])
      setNotes('')
    } catch (err) {
      setError('Failed to create order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Request a Cleaning</h1>
          <p style={styles.subtitle}>Tell us how many rooms and which types you'd like cleaned.</p>
        </header>

        {error && <div role="alert" style={styles.error}>{error}</div>}
        {success && <div role="status" style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Full name
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </label>

          <label style={styles.label}>
            Email
            <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          </label>

          <label style={styles.label}>
            How many rooms?
            <input style={styles.number} type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} />
          </label>

          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Types of rooms to clean</legend>
            <div style={styles.typeGrid}>
              {allTypes.map((t) => (
                <label key={t} style={styles.typeCard}>
                  <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                  <span style={{ marginLeft: 8 }}>{t}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label style={styles.label}>
            Notes (optional)
            <textarea style={{ ...styles.input, minHeight: 88 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions" />
          </label>

          <div style={styles.summary}>
            <div>Rooms: <strong>{rooms}</strong></div>
            <div>Types: <strong>{selectedTypes.join(', ') || '—'}</strong></div>
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.submit} disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}

const styles: { [k: string]: React.CSSProperties } = {
  page: { maxWidth: 1100, margin: '28px auto', padding: '0 20px' },
  card: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' },
  header: { marginBottom: 12 },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#111827' },
  input: { height: 44, padding: '8px 12px', borderRadius: 8, border: '1px solid #e6eef6', fontSize: 15 },
  number: { width: 120, height: 44, padding: '8px 12px', borderRadius: 8, border: '1px solid #e6eef6', fontSize: 15 },
  fieldset: { border: 'none', padding: 0, margin: 0 },
  legend: { fontSize: 14, fontWeight: 600, marginBottom: 6 },
  typeGrid: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  typeCard: { display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 14 },
  summary: { marginTop: 6, padding: 10, borderRadius: 8, background: '#f1f5f9', display: 'flex', gap: 14 },
  actions: { marginTop: 8, display: 'flex', gap: 8 },
  submit: { padding: '10px 14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  error: { padding: 10, borderRadius: 8, background: '#fff1f2', color: '#b91c1c' },
  success: { padding: 10, borderRadius: 8, background: '#ecfdf5', color: '#065f46' }
}

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <OrderContent />
    </ProtectedRoute>
  )
}