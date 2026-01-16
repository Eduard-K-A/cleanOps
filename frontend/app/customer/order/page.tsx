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
    <main className="max-w-5xl mx-auto px-5 py-7">
      <div className="bg-white p-5 rounded-2xl shadow-md">
        <header className="mb-3">
          <h1 className="m-0 text-xl font-bold">Request a Cleaning</h1>
          <p className="mt-1.5 text-gray-500">Tell us how many rooms and which types you'd like cleaned.</p>
        </header>

        {error && <div role="alert" className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
        {success && <div role="status" className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm text-gray-900">
            Full name
            <input className="h-11 px-3 py-2 rounded-lg border border-gray-200 text-base focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-900">
            Email
            <input className="h-11 px-3 py-2 rounded-lg border border-gray-200 text-base focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-900">
            How many rooms?
            <input className="w-32 h-11 px-3 py-2 rounded-lg border border-gray-200 text-base focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} />
          </label>

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-sm font-semibold mb-1.5">Types of rooms to clean</legend>
            <div className="flex gap-2.5 flex-wrap">
              {allTypes.map((t) => (
                <label key={t} className="flex items-center p-2 rounded-lg bg-slate-100 cursor-pointer text-sm hover:bg-slate-200 transition-colors">
                  <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                  <span className="ml-2">{t}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2 text-sm text-gray-900">
            Notes (optional)
            <textarea className="h-22 px-3 py-2 rounded-lg border border-gray-200 text-base focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions" />
          </label>

          <div className="mt-1.5 p-2.5 rounded-lg bg-slate-100 flex gap-3.5">
            <div>Rooms: <strong>{rooms}</strong></div>
            <div>Types: <strong>{selectedTypes.join(', ') || '—'}</strong></div>
          </div>

          <div className="mt-2 flex gap-2">
            <button type="submit" className="px-3.5 py-2.5 bg-sky-500 text-white rounded-lg cursor-pointer font-semibold hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <OrderContent />
    </ProtectedRoute>
  )
}