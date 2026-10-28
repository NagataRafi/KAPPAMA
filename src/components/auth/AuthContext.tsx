import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { getMyProfile, ApiMemberProfile } from '../../services/api';
import { isClerkConfigured } from '../../config/env';

export interface AuthUserObject {
  id?: string;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  email?: string;
}

export interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: AuthUserObject | null | undefined;
  role: 'member' | 'content_admin' | 'super_admin' | null;
  profile: ApiMemberProfile | null;
  status: 'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended' | null;
  isLoadingProfile: boolean;
  token: string | null;
  refetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  role: null,
  profile: null,
  status: null,
  isLoadingProfile: false,
  token: null,
  refetchProfile: async () => {},
  signOut: async () => {},
});

// Dipakai saat VITE_CLERK_PUBLISHABLE_KEY kosong: halaman publik tetap render,
// fitur login nonaktif, dan hook Clerk tidak pernah dipanggil.
const DISABLED_AUTH: AuthContextType = {
  isSignedIn: false,
  isLoaded: true,
  user: null,
  role: null,
  profile: null,
  status: null,
  isLoadingProfile: false,
  token: null,
  refetchProfile: async () => {},
  signOut: async () => {},
};

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'member' | 'content_admin' | 'super_admin' | null>(null);
  const [profile, setProfile] = useState<ApiMemberProfile | null>(null);
  const [status, setStatus] = useState<'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended' | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isSignedIn) {
      setRole(null);
      setProfile(null);
      setStatus(null);
      return;
    }

    try {
      setIsLoadingProfile(true);
      const sessionToken = await getToken().catch(() => null);
      setToken(sessionToken);

      const res = await getMyProfile(sessionToken);
      if (res.data) {
        setRole(res.data.user.role as 'member' | 'content_admin' | 'super_admin');
        setProfile(res.data.profile);
        setStatus(res.data.status as 'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended');
      }
    } catch {
      setStatus('incomplete');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchProfile();
    }
  }, [isClerkLoaded, isSignedIn, user?.id, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: Boolean(isSignedIn),
        isLoaded: isClerkLoaded,
        user,
        role,
        profile,
        status,
        isLoadingProfile,
        token,
        refetchProfile: fetchProfile,
        signOut: async () => {
          await signOut();
          setProfile(null);
          setStatus(null);
          setRole(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured) {
    return <AuthContext.Provider value={DISABLED_AUTH}>{children}</AuthContext.Provider>;
  }
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

// Hook dipisahkan agar mematuhi react-refresh
// eslint-disable-next-line react-refresh/only-export-components
export const useAppAuth = () => useContext(AuthContext);
