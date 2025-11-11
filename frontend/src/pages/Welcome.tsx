import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()

  const handleViewClubs = () => {
    navigate('/clubs')
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h1>Welcome to ClubHub 🎉</h1>
      <p>Your account has been created successfully!</p>
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
  )
}
