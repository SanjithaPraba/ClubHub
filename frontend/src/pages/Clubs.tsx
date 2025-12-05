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
  const [searchTerm, setSearchTerm] = useState('')

  // --- NEW STATE FOR CREATION MODAL ---
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('')
  const [newBio, setNewBio] = useState('')
  const [creating, setCreating] = useState(false)

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

  // --- NEW FUNCTION TO HANDLE CREATION ---
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in to create a club.')
      return
    }
    setCreating(true)

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.student_id,
          club_name: newName,
          club_type: newType,
          club_biography: newBio
        })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        // Add new club to list and close modal
        setClubs(prev => [...prev, json.club])
        setShowCreateModal(false)
        setNewName('')
        setNewType('')
        setNewBio('')
      } else {
        alert('Failed to create club: ' + (json.message || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to server')
    } finally {
      setCreating(false)
    }
  }

  const filteredClubs = clubs.filter((club) => {
    const term = searchTerm.toLowerCase()
    return (
      club.club_name.toLowerCase().includes(term) ||
      club.club_biography.toLowerCase().includes(term) ||
      club.club_type.toLowerCase().includes(term)
    )
  })

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <p style={{ textAlign: 'center' }}>Loading clubs...</p>
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <p style={{ color: 'crimson', textAlign: 'center' }}>{error}</p>
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem',
        paddingTop: '6rem',
        fontFamily: 'system-ui',
        background: '#f9fafb',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: 'none',
          background: '#6b7280',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        Home
      </button>

      {/* Profile Icon */}
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
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            padding: 0
          }}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </button>

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
              <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{user?.username || 'User'}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{user?.school_email}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'white',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>All Clubs</h1>

      {/* Actions Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
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
          }}
        >
          My Clubs
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 9999,
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Create New Club
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, type, or bio..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: '12px 16px',
          marginBottom: '1.5rem',
          width: '100%',
          maxWidth: '400px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '1rem',
          outline: 'none',
        }}
      />

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

        {filteredClubs.length > 0 ? (
          filteredClubs.map((club, i) => (
            <div
              key={club.club_id}
              onClick={() => navigate(`/clubs/${club.club_id}`, { state: { club } })}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr',
                padding: '1rem 1.5rem',
                borderBottom: i === filteredClubs.length - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e7ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#f9fafb' : 'white' }}
            >
              <span style={{ fontWeight: 600, color: '#111827' }}>{club.club_name}</span>
              <span style={{ color: '#374151' }}>{club.club_biography}</span>
              <span style={{ color: '#2563eb', fontWeight: 500, textTransform: 'capitalize' }}>
                {club.club_type}
              </span>
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No clubs found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* --- CREATE CLUB MODAL --- */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>Create a New Club</h2>
            <form onSubmit={handleCreateClub}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Club Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. HackUVA"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Club Type</label>
                <input 
                  type="text" 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  placeholder="e.g. Technology, Sports, Arts"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Biography / Description</label>
                <textarea 
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                  placeholder="Tell us what your club is about..."
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  style={{ background: '#10b981', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600, opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}