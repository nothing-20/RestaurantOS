import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { authService } from './authService';
import { TUserRole, IUser } from '../types';

interface IAuthContextType {
  user: IUser | null;
  role: TUserRole | null;
  tenantId: string | null;
  isLoading: boolean;
  loginAsMockRole: (role: TUserRole, tenantId?: string) => void;
  logout: () => Promise<void>;
  firebaseUser: User | null;
}

const AuthContext = createContext<IAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [role, setRole] = useState<TUserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there is a dev mock session in localStorage first
    const mockSession = localStorage.getItem('mock_user_session');
    if (mockSession) {
      try {
        const parsed: IUser = JSON.parse(mockSession);
        setUser(parsed);
        setRole(parsed.role);
        setTenantId(parsed.tenantId);
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to restore mock user session', e);
      }
    }

    // Subscribe to Firebase Auth state updates
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      if (fUser) {
        // Clear mock session since we have a real firebase user
        localStorage.removeItem('mock_user_session');

        try {
          // STEP 1: Firestore is the authoritative source for role and tenantId.
          // We fetch it FIRST so that stale JWT claims cannot override it.
          let userRole: TUserRole | null = null;
          let userTenantId: string | null = null;
          let resolvedName = fUser.displayName;
          let resolvedPhone = '';

          try {
            const userDocRef = doc(db, 'users', fUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const data = userDoc.data();
              userRole = (data.role as TUserRole) || null;
              userTenantId = (data.tenantId as string) || null;
              resolvedName = data.fullName || data.displayName || resolvedName;
              resolvedPhone = data.phoneNumber || '';
            }
          } catch (firestoreErr) {
            console.warn('Failed to fetch user profile from Firestore:', firestoreErr);
          }

          // STEP 2: If Firestore had no role, fall back to JWT custom claims.
          // This handles Super Admin accounts set up via Firebase Admin SDK.
          if (!userRole) {
            try {
              const claims = await authService.getUserClaims(fUser) as any;
              if (claims?.role) userRole = claims.role as TUserRole;
              if (claims?.tenantId && !userTenantId) userTenantId = claims.tenantId;
            } catch (claimsErr) {
              console.warn('Failed to retrieve JWT custom claims:', claimsErr);
            }
          }

          // STEP 3: Build the resolved user object.
          const resolvedUser: IUser = {
            uid: fUser.uid,
            email: fUser.email || '',
            displayName: resolvedName || fUser.email?.split('@')[0] || 'Staff',
            tenantId: userTenantId || '',
            role: userRole || 'customer',
            status: 'active',
            phoneNumber: resolvedPhone,
            createdAt: fUser.metadata.creationTime || new Date().toISOString()
          };

          setUser(resolvedUser);
          setRole(resolvedUser.role);
          setTenantId(resolvedUser.tenantId);
        } catch (e) {
          console.error('Failed to construct authenticated user metadata context', e);
          setUser(null);
          setRole(null);
          setTenantId(null);
        }
      } else {
        // Only clear the session if there's no mock session in localStorage
        if (!localStorage.getItem('mock_user_session')) {
          setUser(null);
          setRole(null);
          setTenantId(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsMockRole = (roleType: TUserRole, targetTenantId: string = 'gourmet-bistro') => {
    setIsLoading(true);
    const mockUser: IUser = {
      uid: `mock-uid-${roleType}`,
      email: `${roleType}@restaurantos.com`,
      displayName: `Mock ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}`,
      tenantId: roleType === 'super-admin' ? '' : targetTenantId,
      role: roleType,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    setRole(roleType);
    setTenantId(mockUser.tenantId);
    localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    // Clear mock session storage
    localStorage.removeItem('mock_user_session');
    
    // Trigger Firebase sign out if logged in via Firebase
    if (auth.currentUser) {
      await authService.signOutUser();
    }
    
    setUser(null);
    setRole(null);
    setTenantId(null);
    setFirebaseUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, tenantId, isLoading, loginAsMockRole, logout, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
