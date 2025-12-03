import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type SignInPayload = {
  school_email: string
  password: string
}

export default function SignIn() {
  const [form, setForm] = useState<SignInPayload>({
    school_email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/welcome')
    }
  }, [isAuthenticated, navigate])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Login failed')
      }
      
      // Save user info to maintain session
      if (json.user) {
        login(json.user)
        navigate('/welcome')
      }

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
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '2rem',
          width: '100%',
          maxWidth: 400
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', color: '#1e293b', textAlign: 'center' }}>Sign In</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            name="school_email"
            type="email"
            placeholder="you@virginia.edu"
            value={form.school_email}
            onChange={onChange}
            required
            style={{
              padding: '0.75rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: '1rem'
            }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            required
            style={{
              padding: '0.75rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: 6,
              border: 'none',
              background: '#2563eb',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {error && <p style={{ color: 'crimson', marginTop: 12, textAlign: 'center', fontSize: '0.875rem' }}>{error}</p>}
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.875rem'
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

