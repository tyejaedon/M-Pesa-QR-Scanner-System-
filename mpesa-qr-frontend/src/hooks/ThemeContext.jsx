import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. SMART INITIALIZATION:
  // Check LocalStorage -> Then Check OS System Preference -> Default to 'dark'
  const [theme, setTheme] = useState(() => {
    // Safety check for server-side rendering environments (optional but good practice)
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      
      // If user has explicitly chosen before, use that
      if (savedTheme) {
        return savedTheme;
      }
      
      // Otherwise, check if their device prefers dark mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    // Fallback default
    return 'dark'; 
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 2. DOM MANIPULATION
    // Tailwind looks for the 'dark' class on the HTML tag
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // 3. PERSISTENCE
    localStorage.setItem('theme', theme);
    
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. CONSUMER HOOK
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};