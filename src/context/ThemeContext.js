// src/context/ThemeContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

const themes = {
  'pink-dark': {
    '--background-color': '#111214',
    '--surface-color': '#1e2022',
    '--text-color': '#f3f4f6',
    '--text-muted': '#9ca3af',
    '--primary-color': '#d81b60',
    '--secondary-color': '#ffb6c1',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
    '--sidebar-bg': '#1a1c1e',
    '--sidebar-active-bg': 'linear-gradient(135deg, #d81b60, #1a1c1e)',
    storeName: 'Pink Bella CRM',
    logoUrl: null,
  },
  'pink-light': {
    '--background-color': '#f5f5f7',
    '--surface-color': '#ffffff',
    '--text-color': '#111827',
    '--text-muted': '#6b7280',
    '--primary-color': '#e91e8c',
    '--secondary-color': '#d81b60',
    '--border-color': 'rgba(0, 0, 0, 0.08)',
    '--sidebar-bg': '#ffffff',
    '--sidebar-active-bg': 'linear-gradient(135deg, #e91e8c, #ffe4f0)',
    storeName: 'Pink Bella Light',
    logoUrl: null,
  },
  'dark-blue': {
    '--background-color': '#0f172a',
    '--surface-color': '#1e293b',
    '--text-color': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--primary-color': '#3b82f6',
    '--secondary-color': '#60a5fa',
    '--border-color': 'rgba(255, 255, 255, 0.07)',
    '--sidebar-bg': '#1e293b',
    '--sidebar-active-bg': 'linear-gradient(135deg, #3b82f6, #1e293b)',
    storeName: 'Blue Bella CRM',
    logoUrl: null,
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentThemeKey, setCurrentThemeKey] = useState(
    localStorage.getItem('themeKey') || 'pink-dark'
  );

  const currentTheme = themes[currentThemeKey] || themes['pink-dark'];

  useEffect(() => {
    localStorage.setItem('themeKey', currentThemeKey);

    const root = document.documentElement;
    for (const [key, value] of Object.entries(currentTheme)) {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value);
        document.body.style.setProperty(key, value);
      }
    }
  }, [currentThemeKey, currentTheme]);

  const changeTheme = (key) => {
    if (themes[key]) setCurrentThemeKey(key);
  };

  return (
    <ThemeContext.Provider value={{ currentThemeKey, currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
