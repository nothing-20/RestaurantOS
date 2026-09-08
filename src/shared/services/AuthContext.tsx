import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { authService } from './authService';
import { TUserRole, IUser } from '../types';
import { getDashboardRoute } from '../utils/navigation';

interface IAuthContextType {
  user: IUser | null;
  role: TUserRole | null;
  tenantId: string | null;
  isLoading: boolean;
  profileError: string | null;
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    // Subscribe to Firebase Auth state updates
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (fUser) {
        setIsLoading(true);
        setProfileError(null);

        try {
          const userDocRef = doc(db, 'users', fUser.uid);

          // Real-time listener for user profile updates
          unsubscribeUserDoc = onSnapshot(
            userDocRef,
            async (userDoc) => {
              try {
                if (userDoc.exists() && userDoc.data().role) {
                  const data = userDoc.data();
                  const resolvedUser: IUser = {
                    uid: fUser.uid,
                    email: (fUser.email || data.email || '').toLowerCase(),
                    displayName: data.fullName || data.displayName || fUser.displayName || 'User',
                    tenantId: data.tenantId || '',
                    role: data.role as TUserRole,
                    status: (data.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
                    phoneNumber: data.phoneNumber || '',
                    createdAt: data.createdAt || fUser.metadata.creationTime || new Date().toISOString()
                  };

                  console.log('[AUTH Context] Profile loaded via snapshot:', {
                    uid: resolvedUser.uid,
                    email: resolvedUser.email,
                    role: resolvedUser.role,
                    tenantId: resolvedUser.tenantId
                  });

                  setUser(resolvedUser);
                  setRole(resolvedUser.role);
                  setTenantId(resolvedUser.tenantId);
                  setProfileError(null);
                  setIsLoading(false);
                } else {
                  // Document missing or role missing — call authoritative roleResolver
                  const { resolveAuthenticatedUser } = await import('./roleResolver');
                  const profile = await resolveAuthenticatedUser(fUser);

                  if (profile && profile.role) {
                    const resolvedUser: IUser = {
                      uid: profile.uid,
                      email: profile.email,
                      displayName: profile.displayName,
                      tenantId: profile.tenantId,
                      role: profile.role,
                      status: (profile.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
                      phoneNumber: profile.phoneNumber || '',
                      createdAt: profile.createdAt
                    };

                    console.log('[AUTH Context] Profile resolved via roleResolver:', {
                      uid: resolvedUser.uid,
                      role: resolvedUser.role,
                      tenantId: resolvedUser.tenantId
                    });

                    setUser(resolvedUser);
                    setRole(resolvedUser.role);
                    setTenantId(resolvedUser.tenantId);
                    setProfileError(null);
                  } else {
                    console.warn('[AUTH Context] Profile missing or unassigned role for UID:', fUser.uid);
                    setUser(null);
                    setRole(null);
                    setTenantId(null);
                    setProfileError(`Owner profile is missing or not configured. Missing profile document in users/${fUser.uid}. Please contact your administrator.`);
                  }
                  setIsLoading(false);
                }
              } catch (snapErr: any) {
                console.error('[AUTH Context] Error parsing snapshot data:', snapErr);
                setUser(null);
                setRole(null);
                setTenantId(null);
                setProfileError('Failed to load user session profile.');
                setIsLoading(false);
              }
            },
            (error) => {
              console.error('[AUTH Context] Database snapshot listener error:', error);
              setUser(null);
              setRole(null);
              setTenantId(null);
              if (error.code === 'permission-denied') {
                setProfileError('Permission denied reading your user profile.');
              } else {
                setProfileError('Database snapshot listener error.');
              }
              setIsLoading(false);
            }
          );
        } catch (e: any) {
          console.error('[AUTH Context] Auth initialization error:', e);
          setUser(null);
          setRole(null);
          setTenantId(null);
          setProfileError('Failed to initialize session.');
          setIsLoading(false);
        }
      } else {
        // Unauthenticated
        setUser(null);
        setRole(null);
        setTenantId(null);
        setProfileError(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
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
    setProfileError(null);
    console.log('[AUTH Mock] Logged in as mock role:', roleType);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear tab-isolated sessionStorage only; preserve cross-tab independent states
      sessionStorage.clear();
      
      if (auth.currentUser) {
        await authService.signOutUser();
      }
    } catch (err) {
      console.error('[AUTH Logout Error]', err);
    } finally {
      setUser(null);
      setRole(null);
      setTenantId(null);
      setFirebaseUser(null);
      setProfileError(null);
      setIsLoading(false);
      console.log('[AUTH] Deep session logout completed.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, tenantId, isLoading, profileError, loginAsMockRole, logout, firebaseUser }}>
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
