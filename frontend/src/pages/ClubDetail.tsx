import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

type Club = {
  club_id: number
  club_name: string
  club_type: string
  club_biography: string
  admin_id: number
}

export default function ClubDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [newAdminIdInput, setNewAdminIdInput] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  
  // Get club data from navigation state, or redirect if not available
  const club = location.state?.club as Club | undefined


  const isAdmin =
  !!user &&
  !!club &&
  String(user.student_id) === String(club.admin_id)

  useEffect(() => {
    if (!club) {
      navigate('/clubs')
    }
  }, [club, navigate])

  // Check membership status when component loads
  useEffect(() => {
    const checkMembership = async () => {
      
      if (!club || !user?.student_id) {
        setIsMember(false)
        return
      }

      if (isAdmin) {
        setIsMember(true)
        return
      }


      try {
        const res = await fetch(`/api/clubs/${club.club_id}/membership?student_id=${user.student_id}`)
        const json = await res.json()
        if (res.ok) {
          setIsMember(json.is_member)
        } else {
          setError(json.message || 'Failed to check membership status')
          setIsMember(false)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check membership status')
        setIsMember(false)
      }
    }

    checkMembership()
  }, [club, user])

  const handleLogout = () => {
    logout()
    navigate('/signup')
  }

  const handleBack = () => {
    navigate('/clubs')
  }

  const handleJoinClub = async () => {
    if (!club || !user?.student_id) {
      setError('You must be logged in to join a club')
      return
    }
  
  

    setIsJoining(true)
    setError(null)

    try {
      const res = await fetch(`/api/clubs/${club.club_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_id: user.student_id }),
      })

      const json = await res.json()
      if (res.ok) {
        setIsMember(true)
      } else {
        setError(json.message || 'Failed to join club')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join club')
    } finally {
      setIsJoining(false)
    }
  }

  const handleOpenTransferModal = () => {
    setTransferError(null)
    setNewAdminIdInput('')
    setShowTransferModal(true)
  }
  
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!club || !user) return
  
    const trimmed = newAdminIdInput.trim()
    if (!trimmed) {
      setTransferError('Please enter a student ID.')
      return
    }
  
    const newAdminIdNum = Number(trimmed)
    if (Number.isNaN(newAdminIdNum)) {
      setTransferError('Student ID must be a number.')
      return
    }
  
    setTransferLoading(true)
    setTransferError(null)
  
    try {
      const res = await fetch(`/api/clubs/${club.club_id}/transfer-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_admin_id: user.student_id,
          new_admin_id: newAdminIdNum,
        }),
      })
  
      const json = await res.json()
  
      if (!res.ok) {
        setTransferError(json.message || 'Failed to transfer ownership.')
        return
      }
  
      // Ownership changed; simplest is to kick back to clubs list
      alert('Ownership transferred successfully. You are no longer the admin.')
      setShowTransferModal(false)
      navigate('/clubs') // or wherever your list page is
    } catch (err: any) {
      setTransferError(err.message || 'Failed to transfer ownership.')
    } finally {
      setTransferLoading(false)
    }
  }


  const handleViewEvents = () => {
    if (!club) return
      navigate(`/clubs/${club.club_id}/events`, { state: { club } })
  }
    
  const handleViewAnnouncements = () => {
    if (!club) return
      navigate(`/clubs/${club.club_id}/announcements`, { state: { club } })
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
            color: 'white',
            position: 'relative'
          }}
        >
          <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
            {club.club_name}
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
            {isMember === true && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(34, 197, 94, 0.9)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white'
                }}
              >
                ✓ Member
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.25rem' }}>
            About
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#374151', 
            lineHeight: '1.6',
            fontSize: '1rem',
            marginBottom: '1.5rem'
          }}>
            {club.club_biography}
          </p>

          {/* Join Button or Error Message */}
          {user && isMember === false && (
            <div style={{ marginTop: '1.5rem' }}>
              {error && (
                <p style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  margin: 0, 
                  marginBottom: '0.75rem' 
                }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleJoinClub}
                disabled={isJoining}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isJoining ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  cursor: isJoining ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isJoining) {
                    e.currentTarget.style.background = '#1d4ed8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isJoining) {
                    e.currentTarget.style.background = '#2563eb'
                  }
                }}
              >
                {isJoining ? 'Joining...' : 'Join Club'}
              </button>
            </div>
          )}
          {/* Navigation buttons to modular pages */}
          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap' 
          }}>
            <button
              onClick={handleViewEvents}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #2563eb',
                background: 'white',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
            >
              View Events
            </button>

            <button
              onClick={handleViewAnnouncements}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #6b7280',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
            >
              View Announcements
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate(`/clubs/${club.club_id}/expenses`, { state: { club } })}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #dc2626', // Red border to distinguish
                  background: 'white',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
              >
                View Expenses (Admin)
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate(`/clubs/${club.club_id}/funding`, { state: { club } })}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #16a34a', // Green border
                  background: 'white',
                  color: '#16a34a',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
              >
                View Funding (Admin)
              </button>   
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenTransferModal}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #f97316',
                  background: 'white',
                  color: '#c2410c',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff7ed'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                }}
              >
                Transfer Ownership
              </button>
            )}
          </div>

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
      {showTransferModal && club && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'white',
              borderRadius: 16,
              padding: '1.5rem 1.75rem',
              boxShadow: '0 20px 45px rgba(15,23,42,0.25)',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '0.5rem',
                fontSize: '1.15rem',
              }}
            >
              Transfer Club Ownership
            </h2>
            <p
              style={{
                marginTop: 0,
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                color: '#4b5563',
              }}
            >
              You are about to transfer admin rights for{' '}
              <strong>{club.club_name}</strong> to another student. Enter the
              recipient&apos;s <strong>student ID</strong> below.
            </p>

            {transferError && (
              <p
                style={{
                  marginTop: 0,
                  marginBottom: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#b91c1c',
                }}
              >
                {transferError}
              </p>
            )}

            <form onSubmit={handleTransferSubmit}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  marginBottom: '0.25rem',
                  color: '#374151',
                }}
              >
                New Admin Student ID
              </label>
              <input
                type="text"
                value={newAdminIdInput}
                onChange={(e) => setNewAdminIdInput(e.target.value)}
                placeholder="e.g. 2001"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.6rem',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferLoading}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    cursor: transferLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: 8,
                    border: 'none',
                    background: transferLoading ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    cursor: transferLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    
  )
}

