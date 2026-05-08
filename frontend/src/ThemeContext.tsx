import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeScope = 'admin' | 'staff' | 'customer';

interface ThemeContextType {
  themes: Record<ThemeScope, Theme>;
  setTheme: (theme: Theme, scope: ThemeScope) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemesState] = useState<Record<ThemeScope, Theme>>(() => {
    const adminTheme = (localStorage.getItem('adminTheme') as Theme) || 'light';
    const staffTheme = (localStorage.getItem('staffTheme') as Theme) || 'light';
    const customerTheme = (localStorage.getItem('customerTheme') as Theme) || 'dark';
    return { admin: adminTheme, staff: staffTheme, customer: customerTheme };
  });

  const setTheme = (newTheme: Theme, scope: ThemeScope) => {
    setThemesState((prev) => ({ ...prev, [scope]: newTheme }));
    localStorage.setItem(`${scope}Theme`, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
