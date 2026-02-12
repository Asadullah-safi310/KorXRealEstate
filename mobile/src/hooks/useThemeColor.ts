import { useTheme } from '../theme';

export function useThemeColor() {
  const { colors } = useTheme();
  return colors;
}

export function useCurrentTheme() {
  const { theme } = useTheme();
  return theme;
}
