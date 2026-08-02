import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Bloquea el acceso directo por URL a pantallas de gestión de flota para el rol "user".
// Un piloto normal solo puede grabar/ver sus propios vuelos; el resto de la gestión
// (pilotos, aeronaves, baterías, mantenimientos...) es solo para admin/superadmin.
export default function StaffRoute() {
  const { user } = useAuth();

  if (user?.role === 'user') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
