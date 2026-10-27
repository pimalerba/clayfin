import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { Storage } from 'expo-sqlite/kv-store';
import { AppTheme, darkTheme, lightTheme } from './index';
import { getDatabase } from '@/db';

export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'clayfin_theme_preference';
const DB_META_KEY = 'theme_preference';

interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  isDark: boolean;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialPreferenceSync(): ThemePreference {
  try {
    const stored = Storage.getItemSync(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch {
    // Em ambientes sem suporte síncrono nativo (testes ou web), ignora
  }
  return 'auto';
}

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    getInitialPreferenceSync
  );
  const [isReady, setIsReady] = useState(false);

  // Carrega preferência persistida na inicialização (Storage e app_meta)
  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      let pref: ThemePreference = 'auto';

      try {
        const stored = await Storage.getItemAsync(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'auto') {
          pref = stored;
        } else {
          // Fallback para app_meta no banco SQLite
          const db = await getDatabase();
          const row = await db.getFirstAsync<{ value: string }>(
            'SELECT value FROM app_meta WHERE key = ?;',
            DB_META_KEY
          );
          if (row?.value === 'light' || row?.value === 'dark' || row?.value === 'auto') {
            pref = row.value;
            // Sincroniza de volta para o kv-store
            await Storage.setItemAsync(STORAGE_KEY, pref).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Não foi possível ler preferência de tema persistida:', err);
      }

      if (isMounted) {
        setPreferenceState(pref);
        setIsReady(true);
      }
    }

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return systemColorScheme === 'dark';
  }, [preference, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // Atualiza a cor de fundo raiz do sistema com expo-system-ui
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  const setPreference = useCallback(async (newPref: ThemePreference) => {
    setPreferenceState(newPref);

    try {
      await Storage.setItemAsync(STORAGE_KEY, newPref);
    } catch (e) {
      console.warn('Erro ao salvar tema no kv-store:', e);
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
        DB_META_KEY,
        newPref
      );
    } catch (e) {
      console.warn('Erro ao salvar tema em app_meta:', e);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      isDark,
      isReady,
    }),
    [theme, preference, setPreference, isDark, isReady]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  return ctx ? ctx.theme : lightTheme;
}

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: lightTheme,
      preference: 'auto',
      setPreference: async () => {},
      isDark: false,
      isReady: true,
    };
  }
  return ctx;
}
