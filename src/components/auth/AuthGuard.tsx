import { Navigate, useLocation } from 'react-router-dom';
import { useAppAuth } from './AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export function AuthGuard({ children, requireActive = true }: AuthGuardProps) {
  const { isSignedIn, isLoaded, status, role, isLoadingProfile } = useAppAuth();
  const location = useLocation();

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-4">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  // Jika belum login, redirect ke halaman pendaftaran/login
  if (!isSignedIn) {
    return <Navigate to="/daftar" state={{ from: location }} replace />;
  }

  // Jika belum onboarding, paksa ke halaman onboarding
  // Admin (super_admin / content_admin) melewati redirect ini karena
  // profil mereka di-bootstrap sebagai active, tidak perlu onboarding.
  if (status === 'incomplete' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Jika membutuhkan status aktif (misalnya direktori atau profil saya)
  if (requireActive) {
    // Admin tetap boleh mengakses meski status pending/rejected/suspended:
    // hanya member biasa yang diblokir sesuai PRD.
    const isAdmin = role === 'super_admin' || role === 'content_admin';
    if (!isAdmin && (status === 'pending' || status === 'rejected' || status === 'suspended')) {
      return <Navigate to="/status" replace />;
    }
  }

  return <>{children}</>;
}
