import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './Loading';

export function ProtectedRoute({ children, adminOnly = false, allowUploader = false }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin && !(allowUploader && user.is_uploader)) return <Navigate to="/" replace />;

  return children;
}
