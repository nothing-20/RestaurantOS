import { useTheme as useThemeFromContext } from '../context/ThemeContext';

/**
 * Accesses theme states (dark/light) and toggle handlers.
 */
export const useTheme = useThemeFromContext;
export default useTheme;
