import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, role, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <Loader />;
  }

  if (!token) {
    return <Navigate to="/callback" replace />;
  }

  // tunggu role siap
  if (!role) {
    return <Loader />;
  }

  return children;
};

export default ProtectedRoute;
