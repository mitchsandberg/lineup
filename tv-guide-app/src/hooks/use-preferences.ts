import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SportCategory, UserPreferences } from '@/lib/types';

const STORAGE_KEY = 'tv-guide-preferences';

const defaultPreferences: UserPreferences = {
  selectedServices: ['youtube-tv', 'espn-plus', 'peacock', 'hulu-live', 'prime-video', 'apple-tv', 'mlb-tv'],
  selectedSport: 'all',
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

export function usePreferences() {
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

  const completeOnboarding = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, onboardingComplete: true };
      savePreferences(next);
      return next;
    });
  }, []);

  return { prefs, loaded, updateServices, toggleService, setSport, completeOnboarding };
}
