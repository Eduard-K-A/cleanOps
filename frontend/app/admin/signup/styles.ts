import React from 'react'

export const styles: { [k: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(180deg,#f7fafc,white)'
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 28,
    borderRadius: 12,
    boxShadow: '0 6px 24px rgba(16,24,40,0.08)',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  label: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#111827' },
  input: {
    height: 44,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    outline: 'none',
    fontSize: 15
  },
  passwordRow: { display: 'flex', alignItems: 'center' },
  toggle: {
    height: 36,
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer'
  },
  submit: {
    marginTop: 6,
    height: 46,
    borderRadius: 10,
    border: 'none',
    background: '#0ea5e9',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer'
  },
  footerNote: { margin: 0, fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  error: { background: '#fff1f2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8 },
  success: { background: '#ecfdf5', color: '#065f46', padding: '8px 12px', borderRadius: 8 },
  link: { color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }
}
