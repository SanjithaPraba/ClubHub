import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Signup from './pages/Signup'
import SignIn from './pages/SignIn'
import Welcome from './pages/Welcome'
import Clubs from './pages/Clubs'
import MyClubs from './pages/MyClubs'


function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/welcome' : '/signup'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/clubs" element={<Clubs />} />
      <Route path="/my-clubs" element={<MyClubs />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App