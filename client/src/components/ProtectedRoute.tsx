import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.JSX.Element;
  roles?: Array<'admin' | 'nurse' | 'doctor'>;
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="page-loader">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
