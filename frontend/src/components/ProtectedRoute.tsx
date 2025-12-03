import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

type ProtectedRouteProps = {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = false,
  redirectTo = '/signup' 
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

