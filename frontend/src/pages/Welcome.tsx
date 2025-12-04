import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Post = {
  post_id: number
  student_id: number | string
  post_header: string
  post_body: string
}

export default function Welcome() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  // State for Posts
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // State for Profile Menu
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // State for Create Post Modal
  const [showModal, setShowModal] = useState(false)
  const [newPostHeader, setNewPostHeader] = useState('')
  const [newPostBody, setNewPostBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleViewClubs = () => {
    navigate('/clubs')
  }

  const handleLogout = () => {
    logout()
    navigate('/signup')
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

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // UPDATED ROUTE: /get_posts
        const res = await fetch('/api/get_posts')
        const json = await res.json()
        if (res.ok) {
          setPosts(json.post || [])
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err)
      } finally {
        setLoadingPosts(false)
      }
    }
    fetchPosts()
  }, [])

  // Handle Post Submission
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostHeader.trim() || !newPostBody.trim()) return

    setIsSubmitting(true)
    try {
      // UPDATED ROUTE: /make_post
      const res = await fetch('/api/make_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.student_id,
          header: newPostHeader,
          body: newPostBody
        })
      })
      const json = await res.json()

      if (res.ok && json.success) {
        // Add the new post to the TOP of the list immediately
        setPosts(prev => [json.post, ...prev])
        // Reset form and close modal
        setNewPostHeader('')
        setNewPostBody('')
        setShowModal(false)
      } else {
        alert('Failed to publish post: ' + (json.message || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to server')
    } finally {
      setIsSubmitting(false)
    }
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
        left: 0
      }}
    >
      {/* --- Profile Icon (Top Right) --- */}
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
              overflow: 'hidden',
              textAlign: 'left'
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
                {user?.username || 'User'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                {user?.school_email}
              </p>
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
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* --- Main Content Container --- */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        height: '90%', 
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        
        {/* Header Section */}
        <header style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#1e293b' }}>
              Welcome, {user?.username || 'Student'}! 👋
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              Here is what's happening at ClubHub today.
            </p>
          </div>
          <button
            onClick={handleViewClubs}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
          >
            Explore Clubs →
          </button>
        </header>

        {/* Dashboard Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 400px',
          gap: '2rem',
          flex: 1,
          overflow: 'hidden'
        }}>
          
          {/* Left Column */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#9ca3af'
          }}>
            <h3>Your Upcoming Events</h3>
            <p>You haven't joined any events yet.</p>
          </div>

          {/* Right Column: Feed Sidebar */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            position: 'relative'
          }}>
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              fontWeight: 600,
              color: '#334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Latest Community Posts 📢</span>
              
              {/* --- New Post Button --- */}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                + Create Post
              </button>
            </div>

            <div style={{ 
              overflowY: 'auto', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              height: '100%'
            }}>
              {loadingPosts ? (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading feed...</p>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.post_id} style={{
                    background: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.1s',
                    cursor: 'default'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#0f172a',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}>
                      {post.post_header}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      color: '#475569', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5'
                    }}>
                      {post.post_body}
                    </p>
                    <div style={{ 
                      marginTop: '0.75rem', 
                      fontSize: '0.75rem', 
                      color: '#94a3b8',
                      textAlign: 'right' 
                    }}>
                      Student #{post.student_id}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>No posts yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- Modal for Creating Post --- */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>Create New Post</h2>
            <form onSubmit={handlePublish}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title / Header</label>
                {/* FIXED: Removed the "ZX" typo below */}
                <input 
                  type="text" 
                  value={newPostHeader}
                  onChange={e => setNewPostHeader(e.target.value)}
                  placeholder="Ex: Debate club is meeting in Nau 242 at 7pm on Dec 5th!"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Body</label>
                <textarea 
                  value={newPostBody}
                  onChange={e => setNewPostBody(e.target.value)}
                  placeholder="Share details here..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#4b5563'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: 600,
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}