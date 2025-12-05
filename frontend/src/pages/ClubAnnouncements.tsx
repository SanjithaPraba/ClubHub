import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Club = {
  club_id: number
  club_name: string
  admin_id: number
}

type Announcement = {
  announcement_id: number
  announcement_header: string
  announcement_body: string
  created_at?: string | null
}

export default function ClubAnnouncements() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const clubFromState = location.state?.club as Club | undefined

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newHeader, setNewHeader] = useState('')
  const [newBody, setNewBody] = useState('')
  const [saving, setSaving] = useState(false)

  const clubIdNumber = clubFromState?.club_id || Number(clubId)
  const isAdmin =
    !!user &&
    !!clubFromState &&
    String(user.student_id) === String(clubFromState.admin_id)

  // Fetch announcements
  useEffect(() => {
    if (!clubIdNumber) return

    const fetchAnnouncements = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/clubs/${clubIdNumber}/announcements`)
        const json = await res.json()
        if (res.ok) {
          setAnnouncements(json.announcements || [])
        } else {
          setError(json.message || 'Failed to load announcements')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [clubIdNumber])

  // Admin creates an announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !clubIdNumber) return
    if (!newHeader.trim() || !newBody.trim()) return

    if (!user?.student_id) {
      alert('You must be logged in to post an announcement.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/clubs/${clubIdNumber}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.student_id,
          announcement_header: newHeader,
          announcement_body: newBody,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.message || 'Failed to create announcement')
        return
      }

      // Optimistically add new announcement to the list
      setAnnouncements((prev) => [
        {
          announcement_id: Date.now(), // temp id for UI
          announcement_header: newHeader,
          announcement_body: newBody,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      setNewHeader('')
      setNewBody('')
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'system-ui',
        minHeight: '100vh',
        background: '#f9fafb',
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        ← Back to Club
      </button>

      <h1 style={{ marginBottom: '1rem' }}>
        {clubFromState?.club_name || 'Club'} – Announcements
      </h1>

      {loading && <p>Loading announcements...</p>}
      {error && !loading && (
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
      )}

      {/* Admin-only create form */}
      {isAdmin && !loading && (
        <form
          onSubmit={handleCreateAnnouncement}
          style={{
            marginTop: '0.5rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: 'white',
            maxWidth: 600,
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: '0.75rem',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Create Announcement 
          </p>
          <input
            type="text"
            placeholder="Announcement title"
            value={newHeader}
            onChange={(e) => setNewHeader(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
            }}
          />
          <textarea
            placeholder="Write your announcement..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: saving ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      )}

      {!loading && !error && announcements.length === 0 && (
        <p>No announcements yet.</p>
      )}

      {!loading && !error && announcements.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {announcements.map((a) => (
            <li
              key={a.announcement_id}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: 'white',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                {a.announcement_header}
              </p>
              {a.created_at && (
                <p
                  style={{
                    margin: '0.2rem 0',
                    fontSize: '0.8rem',
                    color: '#9ca3af',
                  }}
                >
                  {new Date(a.created_at).toLocaleString()}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {a.announcement_body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
