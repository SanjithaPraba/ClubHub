import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/signup')
  }

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showProfileMenu && !target.closest('[data-profile-menu]')) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <p style={{ textAlign: 'center' }}>Loading clubs...</p>
    </div>
  )
  if (error) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <p style={{ color: 'crimson', textAlign: 'center' }}>{error}</p>
    </div>
  )

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
        left: 0
      }}
    >
      {/* Profile Icon in top right */}
      <div data-profile-menu style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 100 }}>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          data-profile-menu
          style={{
            background: user?.username 
              ? `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
              : '#e5e7eb',
            border: '2px solid white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.2s',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {user?.username ? (
            user.username.charAt(0).toUpperCase()
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )}
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div
            data-profile-menu
            style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '250px',
              zIndex: 20,
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontWeight: 600, color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                {user?.username || 'User'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                {user?.school_email}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                ID: {user?.student_id}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'white',
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>All Clubs</h1>

      <button
        onClick={() => navigate('/my-clubs')}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 9999,
          border: 'none',
          background: '#2563eb',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom:'2rem',
        }}
      >
        My Clubs
  </button>

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
