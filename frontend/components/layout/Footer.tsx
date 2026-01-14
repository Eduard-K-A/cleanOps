import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.col}>
          <div style={styles.logo}>cleanOps</div>
          <div style={styles.note}>Efficient, reliable cleaning operations for modern teams.</div>
        </div>

        <div style={styles.col}>
          <div style={styles.colTitle}>Product</div>
          <Link href="/customer/order" style={styles.link}>Order</Link>
          <Link href="/customer/payment" style={styles.link}>Payment</Link>
        </div>

        <div style={styles.col}>
          <div style={styles.colTitle}>Company</div>
          <Link href="/" style={styles.link}>About</Link>
          <Link href="/" style={styles.link}>Careers</Link>
        </div>

        <div style={styles.col}>
          <div style={styles.colTitle}>Legal</div>
          <Link href="/" style={styles.link}>Privacy</Link>
          <Link href="/" style={styles.link}>Terms</Link>
        </div>
      </div>

      <div style={styles.copy}>© {new Date().getFullYear()} cleanOps — All rights reserved.</div>
    </footer>
  )
}

const styles: { [k: string]: React.CSSProperties } = {
  footer: { borderTop: '1px solid #e6eaf0', marginTop: 36, background: '#fff', paddingTop: 28, paddingBottom: 18 },
  inner: { maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr repeat(3, 120px)', gap: 20, padding: '0 20px' },
  col: { display: 'flex', flexDirection: 'column', gap: 8 },
  logo: { fontWeight: 700, fontSize: 18, color: '#0f172a' },
  note: { color: '#6b7280', fontSize: 13, marginTop: 6, maxWidth: 260 },
  colTitle: { fontSize: 13, color: '#111827', fontWeight: 600 },
  link: { color: '#374151', textDecoration: 'none', fontSize: 14, marginTop: 6 },
  copy: { maxWidth: 1100, margin: '12px auto 0', padding: '0 20px', color: '#6b7280', fontSize: 13 }
}
