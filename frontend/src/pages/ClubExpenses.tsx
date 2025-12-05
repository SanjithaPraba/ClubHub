import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Club = {
  club_id: number
  club_name: string
  admin_id: number
}

type Expense = {
  expense_id: number
  expense_amount: number
  expense_date: string
  expense_description: string
}

export default function ClubExpenses() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const clubFromState = location.state?.club as Club | undefined
  const clubIdNumber = clubFromState?.club_id || Number(clubId)

  // Verify Admin Status
  const isAdmin =
    !!user &&
    !!clubFromState &&
    String(user.student_id) === String(clubFromState.admin_id)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [showCreate, setShowCreate] = useState(false)
  // --- FIX IS HERE: Removed the typo "QL" ---
  const [amount, setAmount] = useState('') 
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Redirect non-admins if they try to access via URL directly
  useEffect(() => {
    if (!loading && !isAdmin) {
      alert("Access Denied: You are not the admin of this club.")
      navigate(`/clubs/${clubIdNumber}`)
    }
  }, [isAdmin, loading, navigate, clubIdNumber])

  // Fetch Expenses
  useEffect(() => {
    if (!clubIdNumber) return

    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/clubs/${clubIdNumber}/expenses`)
        const json = await res.json()
        if (res.ok) {
          setExpenses(json.expenses || [])
        } else {
          setError(json.message || 'Failed to load expenses')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [clubIdNumber])

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !date || !description) return
    setSaving(true)

    try {
      const res = await fetch(`/api/clubs/${clubIdNumber}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.student_id,
          expense_amount: amount,
          expense_date: date,
          expense_description: description
        })
      })

      const json = await res.json()
      if (res.ok) {
        // Refresh list logic (optimistic update)
        const newExpense: Expense = {
          expense_id: Date.now(), // temporary ID
          expense_amount: parseFloat(amount),
          expense_date: date,
          expense_description: description
        }
        setExpenses(prev => [newExpense, ...prev])
        
        // Reset Form
        setAmount('')
        setDate('')
        setDescription('')
        setShowCreate(false)
      } else {
        alert('Error: ' + json.message)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save expense.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading expenses...</div>

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui',
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: '1.5rem',
            padding: '0.5rem 1rem',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#1e293b' }}>
            Expense Log 💰
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showCreate ? 'Cancel' : '+ Log Expense'}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ marginTop: 0 }}>Log New Expense</h3>
            <form onSubmit={handleCreateExpense} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pizza for general body meeting"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Submit Log'}
              </button>
            </form>
          </div>
        )}

        {/* Expense List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>No expenses logged yet.</p>
          ) : (
            expenses.map((exp) => (
              <div key={exp.expense_id} style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '1.1rem' }}>
                    {exp.expense_description}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    Date: {exp.expense_date}
                  </p>
                </div>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '1.2rem' }}>
                  -${exp.expense_amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}