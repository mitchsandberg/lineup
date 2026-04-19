import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import AppTabs from '@/components/app-tabs';

const NavyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D1117',
    card: '#1A1F2E',
    border: '#2D3548',
  },
};

export default function TabLayout() {
  return (
    <ThemeProvider value={NavyTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
