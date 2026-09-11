import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface IUserContextType {
  userProfile: IUser | null;
  isLoadingProfile: boolean;
  updateProfile: (data: Partial<IUser>) => Promise<void>;
  error: string | null;
}

const UserContext = createContext<IUserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    setIsLoadingProfile(true);
    const fetchProfile = async () => {
      try {
        const isCustomer = user.role === 'customer';
        let docRef = doc(db, isCustomer ? 'customers' : 'users', user.uid);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists() && isCustomer) {
          // Backward compatibility fallback to users/{uid}
          const fallbackRef = doc(db, 'users', user.uid);
          const fallbackSnap = await getDoc(fallbackRef);
          if (fallbackSnap.exists()) {
            docSnap = fallbackSnap;
          }
        }

        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as IUser);
        } else {
          // fallback to auth context parameters
          setUserProfile(user);
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to query user profile', err);
        setError(err.message || 'Failed to load user profile.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (data: Partial<IUser>) => {
    if (!userProfile) return;
    setIsLoadingProfile(true);
    try {
      const isCustomer = userProfile.role === 'customer';
      const col = isCustomer ? 'customers' : 'users';
      const docRef = doc(db, col, userProfile.uid);
      await updateDoc(docRef, data);
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      setError(null);
    } catch (err: any) {
      console.error('Failed to update user profile document', err);
      setError(err.message || 'Failed to modify profile settings.');
      throw err;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, isLoadingProfile, updateProfile, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
export default UserContext;
