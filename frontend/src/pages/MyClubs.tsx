// src/pages/MyClubs.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Club = {
  club_id: number
  club_name: string
  club_type: string
  club_biography: string
}

export default function MyClubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/signup')
  }

  useEffect(() => {
    if (!user) {
      navigate('/signup')
      return
    }

    const fetchClubs = async () => {
        try {
          const res = await fetch(`/api/my_clubs?sid=${user.student_id}`)
          const json = await res.json()
          if (!res.ok) throw new Error(json?.message || 'Failed to fetch your clubs')
          setClubs(json.clubs || [])
        } catch (err: any) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }

    fetchClubs()
  }, [user, navigate])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui',
        }}
      >
        <p>Loading your clubs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui',
        }}
      >
        <p style={{ color: 'crimson' }}>{error}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui',
        background: '#f9fafb',
        height: '100vh',
        width: '100%',
        margin: 0,
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {/* Back to All Clubs */}
      <button
    onClick={() => navigate('/clubs')}
    style={{
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        padding: '0.45rem 1.1rem',
        borderRadius: 9999,
        background: '#2563eb',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
    }}
    >
    <span style={{ fontSize: '1rem' }}>←</span>
    Back
    </button>


      <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>My Clubs</h1>

      <div
        style={{
          width: '100%',
          maxWidth: 800,
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr',
            backgroundColor: '#1e3a8a',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontWeight: 600,
          }}
        >
          <span>Club Name</span>
          <span>Biography</span>
          <span>Type</span>
        </div>

        {clubs.length === 0 && (
          <div style={{ padding: '1rem 1.5rem' }}>
            <span>You are not a member or manager of any clubs yet.</span>
          </div>
        )}

        {clubs.map((club, i) => (
          <div
            key={club.club_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr',
              padding: '1rem 1.5rem',
              borderBottom: i === clubs.length - 1 ? 'none' : '1px solid #e5e7eb',
              backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white',
            }}
          >
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {club.club_name}
            </span>
            <span style={{ color: '#374151' }}>{club.club_biography}</span>
            <span
              style={{
                color: '#2563eb',
                fontWeight: 500,
                textTransform: 'capitalize',
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
