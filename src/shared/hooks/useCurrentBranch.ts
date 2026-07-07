import { useWorkspace } from '../services/WorkspaceContext';

export function useCurrentBranch() {
  const { workspace, isLoading, validationError } = useWorkspace();

  return {
    branch: workspace?.branch || null,
    branchId: workspace?.branch?.id || 'main',
    isLoading,
    error: validationError,
  };
}
export default useCurrentBranch;
