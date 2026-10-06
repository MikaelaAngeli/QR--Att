import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';

export const THEME_COLORS = [
  { name: 'Blue', primary: COLORS.primary, tint: '#E3F2FD' },
  { name: 'Purple', primary: '#7B1FA2', tint: '#F3E5F5' },
  { name: 'Teal', primary: '#00897B', tint: '#E0F2F1' },
  { name: 'Green', primary: '#2E7D32', tint: '#E8F5E9' },
  { name: 'Orange', primary: '#EF6C00', tint: '#FFF3E0' },
  { name: 'Red', primary: '#C62828', tint: '#FFEBEE' },
  { name: 'Pink', primary: '#C2185B', tint: '#FCE4EC' },
  { name: 'Slate', primary: '#455A64', tint: '#ECEFF1' },
] as const;

type ThemeContextValue = {
  primary: string;
  tint: string;
  setPrimary: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  primary: COLORS.primary,
  tint: COLORS.surface,
  setPrimary: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedColor, setSavedColor] = useState<string>(COLORS.primary);

  useEffect(() => {
    let active = true;
    setSavedColor(COLORS.primary);

    if (user) {
      getProfile(user.id).then((profile) => {
        if (active) {
          setSavedColor(profile?.theme_color ?? COLORS.primary);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [user]);

  const selected = THEME_COLORS.find((color) => color.primary === savedColor)
    ?? THEME_COLORS[0];
  const value = useMemo(
    () => ({
      primary: selected.primary,
      tint: selected.tint,
      setPrimary: setSavedColor,
    }),
    [selected]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
