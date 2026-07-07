import { useAuth } from '../services/AuthContext';
import { useUser } from '../services/UserContext';

export function useCurrentUser() {
  const { user, role, logout } = useAuth();
  const userContext = useUser();

  return {
    user,
    role,
    logout,
    userProfile: userContext.userProfile,
    isLoadingProfile: userContext.isLoadingProfile,
    updateProfile: userContext.updateProfile,
    error: userContext.error,
  };
}
export default useCurrentUser;
