import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Club = {
  club_id: number
  club_name: string
  admin_id: number
}

type FundingApp = {
  application_id: number
  grant_name: string
  status: string
  amount_received: number
}

export default function ClubFunding() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const clubFromState = location.state?.club as Club | undefined
  const clubIdNumber = clubFromState?.club_id || Number(clubId)

  // Verify Admin
  const isAdmin =
    !!user &&
    !!clubFromState &&
    String(user.student_id) === String(clubFromState.admin_id)

  const [apps, setApps] = useState<FundingApp[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Form State
  const [showCreate, setShowCreate] = useState(false)
  const [grantName, setGrantName] = useState('')
  const [initialAmount, setInitialAmount] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editAmount, setEditAmount] = useState('')

  // Protect Route
  useEffect(() => {
    if (!loading && !isAdmin) {
      alert("Access Denied: Admin only.")
      navigate(`/clubs/${clubIdNumber}`)
    }
  }, [isAdmin, loading, navigate, clubIdNumber])

  // Fetch Data
  useEffect(() => {
    if (!clubIdNumber) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/clubs/${clubIdNumber}/funding`)
        const json = await res.json()
        if (res.ok) setApps(json.applications || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [clubIdNumber])

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clubs/${clubIdNumber}/funding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.student_id,
          grant_name: grantName,
          amount_received: initialAmount,
          status: 'Pending' // Default for new apps
        })
      })
      if (res.ok) {
        // Refresh page data (simple way)
        window.location.reload()
      } else {
        alert("Failed to add application")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Start Edit
  const startEdit = (app: FundingApp) => {
    setEditingId(app.application_id)
    setEditStatus(app.status)
    setEditAmount(String(app.amount_received))
  }

  // Handle Save Update
  const saveUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/funding/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          amount_received: editAmount
        })
      })
      if (res.ok) {
        setApps(prev => prev.map(a => 
          a.application_id === id 
            ? { ...a, status: editStatus, amount_received: parseFloat(editAmount) } 
            : a
        ))
        setEditingId(null)
      } else {
        alert("Failed to update")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this application? This cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/funding/${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        // Remove from list immediately
        setApps(prev => prev.filter(app => app.application_id !== id))
      } else {
        const json = await res.json()
        alert(json.message || "Failed to delete")
      }
    } catch (err) {
      console.error(err)
      alert("Error connecting to server")
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'Approved') return '#16a34a' // Green
    if (status === 'Rejected') return '#dc2626' // Red
    return '#ca8a04' // Yellow/Pending
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Funding Tracker 💸</h1>
          <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '0.6rem 1.2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            {showCreate ? 'Cancel' : '+ New Application'}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0 }}>Track New Grant</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem' }}>
              <input type="text" placeholder="Grant Name (e.g. Fall Tech Grant)" required value={grantName} onChange={e => setGrantName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <input type="number" placeholder="Initial Amount (usually 0 if pending)" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <button type="submit" disabled={submitting} style={{ padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Saving...' : 'Add Tracker'}
              </button>
            </form>
          </div>
        )}

        {/* List of Applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {apps.map(app => (
            <div key={app.application_id} style={{ background: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{app.grant_name}</span>
                {editingId !== app.application_id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => startEdit(app)} 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.8rem', 
                        background: 'transparent', 
                        border: '1px solid #9ca3af', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(app.application_id)} 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.8rem', 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        border: '1px solid #fca5a5', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === app.application_id ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ padding: '6px', width: '100px', borderRadius: '4px' }} />
                  <button onClick={() => saveUpdate(app.application_id)} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: getStatusColor(app.status), color: 'white' }}>
                    {app.status}
                  </span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>
                    ${app.amount_received.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}