import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
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
      let userData: any = null;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        userData = userSnap.data();
      } else {
        const ownerRef = doc(db, 'owners', user.uid);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
          userData = ownerSnap.data();
        } else if (user.role) {
          userData = { ...user };
        }
      }

      if (!userData) {
        setValidationError('user-not-found');
        setIsLoading(false);
        return;
      }

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
      const isOwner = userData.role === 'owner' || user.role === 'owner';
      let tenantId = userData.tenantId || user.tenantId || (user as any).restaurantId;

      let tenantData: any = null;
      if (tenantId) {
        const tenantRef = doc(db, 'tenants', tenantId);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          tenantData = tenantSnap.data();
        } else {
          const restRef = doc(db, 'restaurants', tenantId);
          const restSnap = await getDoc(restRef);
          if (restSnap.exists()) {
            tenantData = restSnap.data();
          }
        }
      }

      // If tenant not resolved by ID, look up by ownerUid
      if (!tenantData && user.uid) {
        try {
          const qTenants = query(collection(db, 'tenants'), where('ownerUid', '==', user.uid));
          const snapTenants = await getDocs(qTenants);
          if (!snapTenants.empty) {
            tenantId = snapTenants.docs[0].id;
            tenantData = snapTenants.docs[0].data();
          } else {
            const qRest = query(collection(db, 'restaurants'), where('ownerUid', '==', user.uid));
            const snapRest = await getDocs(qRest);
            if (!snapRest.empty) {
              tenantId = snapRest.docs[0].id;
              tenantData = snapRest.docs[0].data();
            }
          }
        } catch (e) {
          console.warn('[Workspace] Error querying tenant by ownerUid:', e);
        }
      }

      // Self-heal missing restaurant document for authenticated owner
      if (!tenantData && isOwner) {
        tenantId = tenantId || `restaurant-${user.uid.slice(0, 8)}`;
        tenantData = {
          id: tenantId,
          name: userData.restaurantName || userData.displayName || user.displayName || 'My Restaurant',
          ownerUid: user.uid,
          status: 'active',
          planTier: 'starter',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'tenants', tenantId), tenantData, { merge: true });
          await setDoc(doc(db, 'restaurants', tenantId), tenantData, { merge: true });
          await setDoc(doc(db, 'users', user.uid), { tenantId }, { merge: true });
        } catch (e) {
          console.warn('[Workspace] Self-healing tenant doc write failed, using in-memory state:', e);
        }
      }

      if (!tenantData) {
        if (isOwner) {
          tenantId = tenantId || `restaurant-${user.uid.slice(0, 8)}`;
          tenantData = {
            id: tenantId,
            name: userData.restaurantName || userData.displayName || 'My Restaurant',
            status: 'active',
            subscriptionStatus: 'active'
          };
        } else {
          setValidationError('tenant-suspended');
          setIsLoading(false);
          return;
        }
      }

      // Validate Tenant Status (owners are never locked out with 'tenant-suspended')
      if (tenantData.status && tenantData.status !== 'active' && !isOwner) {
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
        const branchRef = doc(db, 'restaurants', tenantId, 'branches', branchId);
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
  }, [user?.uid, user?.role, user?.tenantId]);

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
