import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()

  const handleViewClubs = () => {
    navigate('/clubs')
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
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: '#1e293b' }}>Welcome to ClubHub 🎉</h1>
        <p style={{ marginBottom: '1.5rem', color: '#374151' }}>Your account has been created successfully!</p>
        <button
          onClick={handleViewClubs}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            borderRadius: 6,
            border: 'none',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          View All Clubs
        </button>
      </div>
    </div>
  )
}
