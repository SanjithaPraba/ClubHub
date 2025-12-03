import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
type SignupPayload = {
  student_id: string
  username: string
  school_email: string
  password: string
  class: string
  major: string
}

export default function Signup() {
  const [form, setForm] = useState<SignupPayload>({
    student_id: '',
    username: '',
    school_email: '',
    password: '',
    class: '',
    major: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      console.log(res);
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Signup failed')
      }
      setMessage(json?.message || 'Account created successfully!')
      navigate('/welcome')

    } catch (err: any) {
        
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
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
      <main style={{ maxWidth: 560, width: '100%' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#1e293b', textAlign: 'center' }}>Sign up</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input name="student_id" placeholder="Student ID" value={form.student_id} onChange={onChange} required />
          <input name="username" placeholder="Username" value={form.username} onChange={onChange} required />
          <input name="school_email" placeholder="you@virginia.edu" value={form.school_email} onChange={onChange} required />
          <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
          <input name="class" placeholder="Class year" value={form.class} onChange={onChange} required />
          <input name="major" placeholder="Major" value={form.major} onChange={onChange} required />
          <button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Create account'}</button>
        </form>

        {message && <p style={{ color: 'green', marginTop: 12, textAlign: 'center' }}>{message}</p>}
        {error && <p style={{ color: 'crimson', marginTop: 12, textAlign: 'center' }}>{error}</p>}
      </main>
    </div>
  )
}
