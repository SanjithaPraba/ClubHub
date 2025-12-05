import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Club = {
  club_id: number
  club_name: string
  admin_id: number
}

type EventItem = {
  event_id: number
  event_name: string
  event_description?: string | null
  event_type?: string | null
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  venue?: string | null
}

type RSVPStatus = 'yes' | 'no' | 'maybe'

export default function ClubEvents() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const clubFromState = location.state?.club as Club | undefined


  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventType, setNewEventType] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newVenue, setNewVenue] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState<Record<number, RSVPStatus | null>>(
    {}
  )
  const [rsvpSavingId, setRsvpSavingId] = useState<number | null>(null)

  const clubIdNumber = clubFromState?.club_id || Number(clubId)
  const isAdmin =
    !!user &&
    !!clubFromState &&
    String(user.student_id) === String(clubFromState.admin_id)

  // Fetch events
  useEffect(() => {
    if (!clubIdNumber) return
  
    const fetchEventsAndRsvps = async () => {
      setLoading(true)
      setError(null)
      try {

        const res = await fetch(`/api/clubs/${clubIdNumber}/events`)
        const json = await res.json()
  
        if (!res.ok) {
          setError(json.message || 'Failed to load events')
          setEvents([])
          setLoading(false)
          return
        }
  
        const eventsData: EventItem[] = json.events || []
        setEvents(eventsData)
  
 
        if (user?.student_id) {
          const rsvpRes = await fetch(
            `/api/clubs/${clubIdNumber}/rsvps?student_id=${user.student_id}`
          )
          const rsvpJson = await rsvpRes.json()
  
          if (rsvpRes.ok) {
            const map: Record<number, RSVPStatus | null> = {}
            ;(rsvpJson.rsvps || []).forEach(
              (row: { event_id: number; status: RSVPStatus }) => {
                map[row.event_id] = row.status
              }
            )
            setRsvpStatus(map)
          } else {
  
            console.warn('Failed to load RSVPs:', rsvpJson.message)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load events')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
  
    fetchEventsAndRsvps()
  }, [clubIdNumber, user?.student_id])
  // Admin creates an event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !clubIdNumber) return
    if (!newEventName.trim()) return

    if (!user?.student_id) {
      alert('You must be logged in to create an event.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/clubs/${clubIdNumber}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: user.student_id,
            event_name: newEventName,
            event_type: newEventType || null,
            event_description: newEventDescription || null,
            event_date: newEventDate || null,
            start_time: newStartTime || null,
            end_time: newEndTime || null,
            venue: newVenue || null,
          
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.message || 'Failed to create event')
        return
      }

      const created = json.event as EventItem

      setEvents((prev) => [created, ...prev])

      // reset form & close
      setNewEventName('')
      setNewEventType('')
      setNewEventDate('')
      setNewEventDescription('')
      setNewVenue('')
      setNewStartTime('')
      setNewEndTime('')
      setShowCreate(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const handleRSVP = async (eventId: number, status: RSVPStatus) => {
    if (!user?.student_id) {
      alert('You must be logged in to RSVP.')
      return
    }
  
    setRsvpSavingId(eventId)
    setError(null)
  
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.student_id,
          status,
        }),
      })
  
      const json = await res.json()
  
      if (!res.ok) {
        setError(json.message || 'Failed to save RSVP')
        return
      }
  
      setRsvpStatus((prev) => ({
        ...prev,
        [eventId]: status,
      }))
    } catch (err: any) {
      setError(err.message || 'Failed to save RSVP')
    } finally {
      setRsvpSavingId(null)
    }
  }
  


  const handleBack = () => navigate(-1)

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
        onClick={handleBack}
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ margin: 0 }}>
          {clubFromState?.club_name || 'Club'} – Events
        </h1>

        {/* Admin-only + button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 9999,
              border: 'none',
              background: '#2563eb',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            + New Event
          </button>
        )}
      </div>

      {loading && <p>Loading events...</p>}
      {error && !loading && (
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
      )}

      {/* Admin-only create form inside card */}
      {isAdmin && showCreate && !loading && (
        <form
          onSubmit={handleCreateEvent}
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: 12,
            background: 'white',
            border: '1px solid #e5e7eb',
            maxWidth: 700,
          }}
        >
          <p
            style={{
              marginTop: 0,
              marginBottom: '0.75rem',
              fontWeight: 600,
            }}
          >
            Create a new event
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <input
              type="text"
              placeholder="Event name *"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                gridColumn: '1 / -1',
              }}
            />
            <input
              type="text"
              placeholder="Event type (Workshop, Social, etc.)"
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
            />
            <input
              type="date"
              placeholder="Event date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
            />
            <input
                type="time"
                placeholder="Start time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                }}
            />

            <input
                type="time"
                placeholder="End time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                }}
            />

            <input
              type="text"
              placeholder="Venue"
              value={newVenue}
              onChange={(e) => setNewVenue(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                gridColumn: '1 / -1',
              }}
            />
          </div>

          <textarea
            placeholder="Event description"
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: 8,
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
              fontSize: '0.9rem',
            }}
          >
            {saving ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      )}

      {/* Events list */}
      {!loading && !error && events.length === 0 && (
        <p>No upcoming events.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            width: '100%',
            maxWidth: 900,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 16px 40px rgba(15,23,42,0.06)',
              padding: '2rem 2.25rem',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '0.75rem',
                fontSize: '1.15rem',
              }}
            >
              Upcoming Events
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {events.map((e) => (
                <div
                  key={e.event_id ?? e.event_name}
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '1rem',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '0.98rem',
                      }}
                    >
                      {e.event_name}
                    </p>
                    {e.event_date && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.event_date}
                      </p>
                    )}
                  </div>

                  {e.event_type && (
                    <p
                      style={{
                        margin: '0.15rem 0',
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      {e.event_type}
                    </p>
                  )}

                  {e.event_description && (
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.9rem',
                        color: '#374151',
                      }}
                    >
                      {e.event_description}
                    </p>
                  )}

                  {e.venue && (
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      Venue: {e.venue}
                    </p>
                  )}
                  {/* RSVP buttons */}
                  <div
                    style={{
                        marginTop: '0.6rem',
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                        }}
                    >
                    {(['yes', 'no', 'maybe'] as RSVPStatus[]).map((status) => {
                        const current = rsvpStatus[e.event_id] || null
                        const selected = current === status
                        const disabled = rsvpSavingId === e.event_id

                        return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => handleRSVP(e.event_id, status)}
                            disabled={disabled}
                            style={{
                            padding: '0.25rem 0.7rem',
                            borderRadius: 9999,
                            border: selected ? '1px solid #2563eb' : '1px solid #d1d5db',
                            background: selected ? '#2563eb' : 'white',
                            color: selected ? 'white' : '#374151',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                            }}
                        >
                            {status}
                        </button>
                        )
                     })}
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

