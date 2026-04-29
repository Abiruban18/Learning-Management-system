import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const RequireAuth = () => {
  const token = useAuthStore(s => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RequireTeacher = () => {
  const { token, isTeacher } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isTeacher()) return <Navigate to="/student/dashboard" replace />;
  return <Outlet />;
};

export const RequireStudent = () => {
  const { token, isStudent } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isStudent()) return <Navigate to="/teacher/dashboard" replace />;
  return <Outlet />;
};

export const RedirectIfAuthed = () => {
  const { token, isTeacher } = useAuthStore();
  if (!token) return <Outlet />;
  return <Navigate to={isTeacher() ? '/teacher/dashboard' : '/student/dashboard'} replace />;
};
