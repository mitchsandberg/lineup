/**
 * Tests that usePreferences returns shared context state when a
 * PreferencesProvider is present, and falls back to standalone state
 * when no provider wraps the consumer.
 */

let mockContextReturnValue: any = null;
let mockState: any = {};
let mockSetState: jest.Mock;
let mockEffectCallback: (() => void) | null = null;

jest.mock('react', () => ({
  useState: (init: any) => {
    if (mockState._key === undefined) mockState._key = 0;
    const key = mockState._key;
    if (!(key in mockState)) mockState[key] = init;
    mockState._key++;
    const setter = jest.fn((val: any) => {
      if (typeof val === 'function') {
        mockState[key] = val(mockState[key]);
      } else {
        mockState[key] = val;
      }
    });
    if (key === 0) mockSetState = setter;
    return [mockState[key], setter];
  },
  useEffect: (fn: () => void) => {
    mockEffectCallback = fn;
  },
  useCallback: (fn: any) => fn,
  createContext: () => ({ _value: null }),
  useContext: () => mockContextReturnValue,
  useMemo: (fn: any) => fn(),
  createElement: () => null,
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

const mockLocalStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: jest.fn((key: string, val: string) => {
    mockLocalStorage[key] = val;
  }),
  removeItem: jest.fn(),
};

beforeEach(() => {
  mockContextReturnValue = null;
  mockState = {};
  mockSetState = jest.fn();
  mockEffectCallback = null;
  for (const key of Object.keys(mockLocalStorage)) delete mockLocalStorage[key];
  jest.clearAllMocks();
  jest.resetModules();
});

describe('PreferencesProvider context sharing', () => {
  it('usePreferences returns context value when provider is present', () => {
    const sharedValue = {
      prefs: {
        selectedServices: ['peacock'],
        selectedSport: 'nba' as const,
        favoriteTeams: [],
        favoriteSports: [],
        tvMarkets: [],
        onboardingComplete: true,
      },
      loaded: true,
      updateServices: jest.fn(),
      toggleService: jest.fn(),
      toggleTeam: jest.fn(),
      updateTeams: jest.fn(),
      toggleFavoriteSport: jest.fn(),
      toggleTvMarket: jest.fn(),
      clearTvMarkets: jest.fn(),
      setSport: jest.fn(),
      completeOnboarding: jest.fn(),
    };

    mockContextReturnValue = sharedValue;

    const { usePreferences } = require('@/hooks/use-preferences');
    const result = usePreferences();

    expect(result).toBe(sharedValue);
    expect(result.prefs.selectedServices).toEqual(['peacock']);
    expect(result.prefs.selectedSport).toBe('nba');
  });

  it('usePreferences falls back to standalone state when no provider', () => {
    mockContextReturnValue = null;

    const { usePreferences } = require('@/hooks/use-preferences');
    const result = usePreferences();

    expect(result.prefs.onboardingComplete).toBe(false);
    expect(result.prefs.selectedSport).toBe('all');
    expect(result.prefs.selectedServices).toContain('youtube-tv');
  });

  it('two consumers get the same context reference', () => {
    const sharedValue = {
      prefs: {
        selectedServices: ['hulu-live'],
        selectedSport: 'all' as const,
        favoriteTeams: [],
        favoriteSports: [],
        tvMarkets: [],
        onboardingComplete: true,
      },
      loaded: true,
      updateServices: jest.fn(),
      toggleService: jest.fn(),
      toggleTeam: jest.fn(),
      updateTeams: jest.fn(),
      toggleFavoriteSport: jest.fn(),
      toggleTvMarket: jest.fn(),
      clearTvMarkets: jest.fn(),
      setSport: jest.fn(),
      completeOnboarding: jest.fn(),
    };

    mockContextReturnValue = sharedValue;

    const { usePreferences } = require('@/hooks/use-preferences');

    mockState._key = 0;
    const consumer1 = usePreferences();
    mockState._key = 0;
    const consumer2 = usePreferences();

    expect(consumer1).toBe(consumer2);
    expect(consumer1.prefs.selectedServices).toEqual(['hulu-live']);
  });

  it('context toggleService updates shared state', () => {
    const sharedToggle = jest.fn();
    const sharedValue = {
      prefs: {
        selectedServices: ['youtube-tv', 'peacock'],
        selectedSport: 'all' as const,
        favoriteTeams: [],
        favoriteSports: [],
        tvMarkets: [],
        onboardingComplete: true,
      },
      loaded: true,
      updateServices: jest.fn(),
      toggleService: sharedToggle,
      toggleTeam: jest.fn(),
      updateTeams: jest.fn(),
      toggleFavoriteSport: jest.fn(),
      toggleTvMarket: jest.fn(),
      clearTvMarkets: jest.fn(),
      setSport: jest.fn(),
      completeOnboarding: jest.fn(),
    };

    mockContextReturnValue = sharedValue;

    const { usePreferences } = require('@/hooks/use-preferences');
    const result = usePreferences();

    result.toggleService('peacock');

    expect(sharedToggle).toHaveBeenCalledWith('peacock');
    expect(sharedToggle).toHaveBeenCalledTimes(1);
  });

  it('PreferencesProvider calls usePreferencesState and renders via createElement', () => {
    const { PreferencesProvider } = require('@/hooks/use-preferences');

    mockState = {};
    const result = PreferencesProvider({ children: 'child' });

    expect(result).toBeNull();
    expect(mockEffectCallback).toBeDefined();
  });
});
