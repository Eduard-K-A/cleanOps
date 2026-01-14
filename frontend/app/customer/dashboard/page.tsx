import React from 'react'

export default function CustomerDashboardPage() {
  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome back, Customer</h1>
        <p style={styles.subtitle}>Overview of your recent orders and activity.</p>
      </div>

      <section style={styles.grid}>
        <div style={styles.cardLarge}>
          <h2 style={styles.cardTitle}>Active Orders</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>Order #1024 — Kitchen deep clean — In progress</li>
            <li style={styles.listItem}>Order #1019 — Office weekly — Scheduled</li>
            <li style={styles.listItem}>Order #1007 — Window cleaning — Completed</li>
          </ul>
        </div>

        <aside style={styles.side}>
          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Quick actions</h3>
            <button style={styles.actionBtn}>Create order</button>
            <button style={{...styles.actionBtn, background: 'white', color: '#0f172a', border: '1px solid #e6eaf0'}}>View invoices</button>
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Account</h3>
            <p style={{margin:0}}>Plan: Business</p>
            <p style={{margin:0}}>Next billing: 2026-02-01</p>
          </div>
        </aside>
      </section>
    </main>
  )
}

const styles: { [k: string]: React.CSSProperties } = {
  page: { maxWidth: 1100, margin: '28px auto', padding: '0 20px' },
  header: { marginBottom: 20 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: '#6b7280' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' },
  cardLarge: { background: 'white', borderRadius: 10, padding: 18, boxShadow: '0 6px 24px rgba(16,24,40,0.04)' },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  list: { marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: { background: '#f8fafc', padding: 12, borderRadius: 8, color: '#0f172a' },
  side: { display: 'flex', flexDirection: 'column', gap: 12 },
  sideCard: { background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(16,24,40,0.04)' },
  sideTitle: { margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 },
  actionBtn: { display: 'block', width: '100%', padding: '10px 12px', background: '#0ea5e9', color: 'white', borderRadius: 8, border: 'none', marginBottom: 8, cursor: 'pointer', fontWeight: 600 }
}
