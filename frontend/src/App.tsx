import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/Signup'
import Welcome from './pages/Welcome'
import Clubs from './pages/Clubs'


function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/clubs" element={<Clubs />} />
      </Routes>
    </Router>
  )
}

export default App