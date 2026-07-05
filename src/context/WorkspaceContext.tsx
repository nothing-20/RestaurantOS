import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

export interface IWorkspaceSession {
  user: any;
  tenant: any;
  branch: any;
  role: string;
  permissions: string[];
  subscription: string;
  restaurant: string;
  isValid: boolean;
}

interface IWorkspaceContext {
  workspace: IWorkspaceSession | null;
  isLoading: boolean;
  validationError: string | null;
  revalidate: () => Promise<void>;
}

const WorkspaceContext = createContext<IWorkspaceContext | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<IWorkspaceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchAndValidateWorkspace = async () => {
    if (!user) {
      setWorkspace(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      // MOCK SESSION SHORTCUT: If this is a dev mock user (uid starts with 'mock-uid-'),
      // skip ALL Firestore lookups and build a synthetic workspace directly from the user object.
      // This keeps the dev workflow functional without requiring Firestore documents for mock roles.
      if (user.uid.startsWith('mock-uid-')) {
        const mockRole = user.role;
        let permissions: string[] = [];
        if (mockRole === 'owner') permissions = ['full-access'];
        else if (mockRole === 'manager' || mockRole === 'admin') permissions = ['operational-access'];
        else if (mockRole === 'kitchen') permissions = ['kitchen-only'];
        else if (mockRole === 'waiter') permissions = ['waiter-only'];
        else if (mockRole === 'cashier') permissions = ['billing-only'];
        else if (mockRole === 'reception') permissions = ['reception-only'];
        else if (mockRole === 'super-admin') permissions = ['platform-access'];

        setWorkspace({
          user: { ...user },
          tenant: { name: user.tenantId || 'Demo Restaurant', status: 'active' },
          branch: null,
          role: mockRole,
          permissions,
          subscription: 'active',
          restaurant: 'Demo Restaurant',
          isValid: true
        });
        setValidationError(null);
        setIsLoading(false);
        return;
      }

      // Step 1: Validate User Document Exists
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setValidationError('user-not-found');
        setIsLoading(false);
        try {
          await signOut(auth);
          toast.error('Your account could not be found.', { id: 'user-not-found-toast' });
        } catch (signOutErr) {
          console.error('Sign out failed during user-not-found check:', signOutErr);
        }
        return;
      }

      const userData = userSnap.data();

      // Step 2: Validate Account Status == "active"
      if (userData.status && userData.status !== 'active') {
        setValidationError('user-suspended');
        setIsLoading(false);
        return;
      }

      // Step 2.5: Handle Super Admin Bypass
      if (userData.role === 'super-admin') {
        setWorkspace({
          user: userData,
          tenant: null,
          branch: null,
          role: 'super-admin',
          permissions: ['platform-access'],
          subscription: 'active',
          restaurant: 'Platform Management',
          isValid: true
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Validate Role
      const allowedRoles = ['owner', 'manager', 'waiter', 'kitchen', 'cashier', 'reception', 'admin'];
      if (!userData.role || !allowedRoles.includes(userData.role)) {
        setValidationError('unauthorized');
        setIsLoading(false);
        return;
      }

      // Step 4: Validate Tenant (Restaurant)
      const tenantId = userData.tenantId;
      if (!tenantId) {
        // tenantId missing means the employee account was not properly onboarded.
        // Show 'user-not-found' so the user sees "Contact your administrator" guidance.
        setValidationError('user-not-found');
        setIsLoading(false);
        return;
      }

      const tenantRef = doc(db, 'tenants', tenantId);
      const tenantSnap = await getDoc(tenantRef);

      if (!tenantSnap.exists()) {
        setValidationError('tenant-suspended');
        setIsLoading(false);
        return;
      }

      const tenantData = tenantSnap.data();

      // Validate Tenant Status
      if (tenantData.status && tenantData.status !== 'active') {
        setValidationError('tenant-suspended');
        setIsLoading(false);
        return;
      }

      // Step 5: Validate Subscription
      const subStatus = tenantData.subscriptionStatus || tenantData.stripeSubscriptionStatus || 'active';
      const invalidSubStatuses = ['expired', 'cancelled', 'unpaid'];
      if (invalidSubStatuses.includes(subStatus)) {
        // Define permissions mapping even if expired, so context is populated for owner billing renewal
        let permissions: string[] = [];
        const role = userData.role;
        if (role === 'owner') permissions = ['full-access'];
        else if (role === 'manager' || role === 'admin') permissions = ['operational-access'];
        else if (role === 'kitchen') permissions = ['kitchen-only'];
        else if (role === 'waiter') permissions = ['waiter-only'];
        else if (role === 'cashier') permissions = ['billing-only'];
        else if (role === 'reception') permissions = ['reception-only'];

        setWorkspace({
          user: userData,
          tenant: tenantData,
          branch: null,
          role: userData.role,
          permissions,
          subscription: subStatus,
          restaurant: tenantData.name || 'Gourmet Restaurant',
          isValid: false
        });
        setValidationError('subscription-expired');
        setIsLoading(false);
        return;
      }

      // Step 6: Validate Branch (if branchId exists)
      const branchId = userData.branchId;
      let branchData = null;
      if (branchId) {
        const branchRef = doc(db, 'branches', branchId);
        const branchSnap = await getDoc(branchRef);

        if (!branchSnap.exists()) {
          setValidationError('branch-disabled');
          setIsLoading(false);
          return;
        }

        branchData = branchSnap.data();
        if (branchData.status && branchData.status !== 'active') {
          setValidationError('branch-disabled');
          setIsLoading(false);
          return;
        }
      }

      // Define permissions mapping
      let permissions: string[] = [];
      const role = userData.role;
      if (role === 'owner') permissions = ['full-access'];
      else if (role === 'manager' || role === 'admin') permissions = ['operational-access'];
      else if (role === 'kitchen') permissions = ['kitchen-only'];
      else if (role === 'waiter') permissions = ['waiter-only'];
      else if (role === 'cashier') permissions = ['billing-only'];
      else if (role === 'reception') permissions = ['reception-only'];

      // Success: Generate Workspace Session
      setWorkspace({
        user: userData,
        tenant: tenantData,
        branch: branchData,
        role: userData.role,
        permissions,
        subscription: subStatus,
        restaurant: tenantData.name || 'Gourmet Restaurant',
        isValid: true
      });
      setValidationError(null);
    } catch (e) {
      console.error('Error validating workspace session:', e);
      setValidationError('unauthorized');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndValidateWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspace, 
        isLoading, 
        validationError, 
        revalidate: fetchAndValidateWorkspace 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
export default WorkspaceContext;
