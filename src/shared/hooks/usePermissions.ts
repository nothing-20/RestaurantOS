import { useAuth } from '../services/AuthContext';
import { TUserRole } from '../types';

/**
 * Accesses security controls and permission checkers matching custom user claims.
 */
export const usePermissions = () => {
  const { role } = useAuth();

  const hasPermission = (allowedRoles: TUserRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  const isAdminOrOwner = (): boolean => {
    return hasPermission(['owner', 'admin', 'super-admin']);
  };

  const isStaff = (): boolean => {
    return hasPermission(['owner', 'admin', 'waiter', 'kitchen']);
  };

  return {
    role,
    hasPermission,
    isAdminOrOwner,
    isStaff
  };
};
export default usePermissions;
