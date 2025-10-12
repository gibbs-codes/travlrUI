import { Navigate, useParams } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { tripId } = useParams();

  // Check if tripId exists and is valid
  if (!tripId || !tripId.startsWith('trip-')) {
    return <Navigate to="/create" replace />;
  }

  return children;
}
