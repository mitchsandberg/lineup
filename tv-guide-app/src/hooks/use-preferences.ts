import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SportCategory, UserPreferences } from '@/lib/types';

const STORAGE_KEY = 'tv-guide-preferences';

const defaultPreferences: UserPreferences = {
  selectedServices: ['youtube-tv', 'espn-plus', 'peacock', 'hulu-live', 'prime-video', 'paramount-plus', 'apple-tv'],
  selectedSport: 'all',
  favoriteTeams: [],
  favoriteSports: [],
  onboardingComplete: false,
};

let AsyncStorage: any = null;

async function getStorage() {
  if (Platform.OS === 'web') return null;
  if (!AsyncStorage) {
    try {
      const mod = require('@react-native-async-storage/async-storage');
      AsyncStorage = mod.default ?? mod;
    } catch {
      return null;
    }
  }
  return AsyncStorage;
}

async function loadPreferences(): Promise<UserPreferences> {
  try {
    const storage = await getStorage();
    if (storage) {
      const raw = await storage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultPreferences;
}

async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    const json = JSON.stringify(prefs);
    const storage = await getStorage();
    if (storage) {
      await storage.setItem(STORAGE_KEY, json);
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, json);
    }
  } catch {}
}

interface PreferencesContextValue {
  prefs: UserPreferences;
  loaded: boolean;
  updateServices: (services: string[]) => void;
  toggleService: (serviceId: string) => void;
  toggleTeam: (teamId: string) => void;
  updateTeams: (teamIds: string[]) => void;
  toggleFavoriteSport: (sport: string) => void;
  setSport: (sport: SportCategory) => void;
  completeOnboarding: () => void;
}

function usePreferencesState(): PreferencesContextValue {
  const [prefs, setPrefs] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPreferences().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const updateServices = useCallback((services: string[]) => {
    setPrefs((prev) => {
      const next = { ...prev, selectedServices: services };
      savePreferences(next);
      return next;
    });
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setPrefs((prev) => {
      const current = prev.selectedServices;
      const next = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];
      const updated = { ...prev, selectedServices: next };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const setSport = useCallback((sport: SportCategory) => {
    setPrefs((prev) => {
      const next = { ...prev, selectedSport: sport };
      savePreferences(next);
      return next;
    });
  }, []);

  const toggleTeam = useCallback((teamId: string) => {
    setPrefs((prev) => {
      const current = prev.favoriteTeams ?? [];
      const next = current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId];
      const updated = { ...prev, favoriteTeams: next };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const updateTeams = useCallback((teamIds: string[]) => {
    setPrefs((prev) => {
      const updated = { ...prev, favoriteTeams: teamIds };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const toggleFavoriteSport = useCallback((sport: string) => {
    setPrefs((prev) => {
      const current = prev.favoriteSports ?? [];
      const next = current.includes(sport)
        ? current.filter((s) => s !== sport)
        : [...current, sport];
      const updated = { ...prev, favoriteSports: next };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, onboardingComplete: true };
      savePreferences(next);
      return next;
    });
  }, []);

  return { prefs, loaded, updateServices, toggleService, toggleTeam, updateTeams, toggleFavoriteSport, setSport, completeOnboarding };
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const value = usePreferencesState();
  return React.createElement(PreferencesContext.Provider, { value }, children);
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (ctx) return ctx;
  return usePreferencesState();
}
