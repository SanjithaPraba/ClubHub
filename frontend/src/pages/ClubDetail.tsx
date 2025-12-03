import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

type Club = {
  club_id: number
  club_name: string
  club_type: string
  club_biography: string
}

export default function ClubDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  // Get club data from navigation state, or redirect if not available
  const club = location.state?.club as Club | undefined

  useEffect(() => {
    // If no club data was passed, redirect back to clubs page
    if (!club) {
      navigate('/clubs')
    }
  }, [club, navigate])

  const handleLogout = () => {
    logout()
    navigate('/signup')
  }

  const handleBack = () => {
    navigate('/clubs')
  }

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

  if (!club) {
    return null // Will redirect in useEffect
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
        minHeight: '100vh',
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

      {/* Back Button */}
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          background: 'white',
          color: '#374151',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f9fafb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Clubs
      </button>

      {/* Club Details Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          marginTop: '2rem'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem',
            color: 'white'
          }}
        >
          <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
            {club.club_name}
          </h1>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {club.club_type}
          </span>
        </div>

        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.25rem' }}>
            About
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#374151', 
            lineHeight: '1.6',
            fontSize: '1rem'
          }}>
            {club.club_biography}
          </p>
        </div>

        <div style={{ 
          padding: '1.5rem 2rem', 
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Club ID
              </p>
              <p style={{ margin: 0, color: '#111827', fontWeight: 600 }}>
                #{club.club_id}
              </p>
            </div>
            <div>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Type
              </p>
              <p style={{ 
                margin: 0, 
                color: '#2563eb', 
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {club.club_type}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

