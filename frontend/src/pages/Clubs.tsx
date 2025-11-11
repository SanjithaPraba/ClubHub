import { useEffect, useState } from 'react'

type Club = {
club_id: number
  club_name: string
  club_type: string
  club_biography: string
}

export default function Clubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await fetch('/api/clubs')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || 'Failed to fetch clubs')
        setClubs(json.clubs || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchClubs()
  }, [])

  if (loading) return <p style={{ textAlign: 'center' }}>Loading clubs...</p>
  if (error) return <p style={{ color: 'crimson', textAlign: 'center' }}>{error}</p>

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui',
        background: '#f9fafb',
        minHeight: '100vh'
      }}
    >
      <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>All Clubs</h1>

      <div
        style={{
          width: '100%',
          maxWidth: 800,
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr',
            backgroundColor: '#1e3a8a',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontWeight: 600
          }}
        >
          <span>Club Name</span>
          <span>Biography</span>
          <span>Type</span>
        </div>

        {/* Data rows */}
        {clubs.map((club, i) => (
          <div
            key={club.club_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr',
              padding: '1rem 1.5rem',
              borderBottom: i === clubs.length - 1 ? 'none' : '1px solid #e5e7eb',
              backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white'
            }}
          >
            <span style={{ fontWeight: 600, color: '#111827' }}>{club.club_name}</span>
            <span style={{ color: '#374151' }}>{club.club_biography}</span>
            <span
              style={{
                color: '#2563eb',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {club.club_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
