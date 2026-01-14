"use client"

import React from 'react'
import Link from 'next/link'

export default function Navbar() {
  return (
    <header style={navStyles.header}>
      <div style={navStyles.inner}>
        <div style={navStyles.brand}> 
          <Link href="/" style={navStyles.logoLink}>
            <span style={navStyles.logo}>cleanOps</span>
          </Link>
        </div>

        <nav style={navStyles.nav} aria-label="Primary navigation">
          <Link href="/" style={navStyles.link}>Homepage</Link>
          <Link href="/customer/order" style={navStyles.link}>Clean</Link>
        </nav>

        <div style={navStyles.actions}>
          <Link href="/admin/login" style={navStyles.button}>Sign in</Link>
        </div>
      </div>
    </header>
  )
}

const navStyles: { [k: string]: React.CSSProperties } = {
  header: { width: '100%', borderBottom: '1px solid #e6eaf0', background: 'white' },
  inner: { maxWidth: 1100, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' },
  brand: { display: 'flex', alignItems: 'center' },
  logo: { fontWeight: 700, fontSize: 18, color: '#0f172a' },
  logoLink: { textDecoration: 'none' },
  nav: { display: 'flex', gap: 14, alignItems: 'center' },
  link: { color: '#334155', textDecoration: 'none', padding: '8px 10px', borderRadius: 8, fontSize: 15 },
  actions: {},
  button: { background: '#0ea5e9', color: 'white', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }
}
