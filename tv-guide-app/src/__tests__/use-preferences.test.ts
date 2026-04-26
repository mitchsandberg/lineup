let mockState: any = {};
let mockSetState: jest.Mock;
let mockEffectCallback: (() => void) | null = null;
let mockLoadedSetter: jest.Mock;

jest.mock('react', () => ({
  useState: (init: any) => {
    if (mockState._key === undefined) {
      mockState._key = 0;
    }
    const key = mockState._key;
    if (!(key in mockState)) {
      mockState[key] = init;
    }
    mockState._key++;
    const setter = jest.fn((val: any) => {
      if (typeof val === 'function') {
        mockState[key] = val(mockState[key]);
      } else {
        mockState[key] = val;
      }
    });
    if (key === 0) mockSetState = setter;
    if (key === 1) mockLoadedSetter = setter;
    return [mockState[key], setter];
  },
  useEffect: (fn: () => void) => {
    mockEffectCallback = fn;
  },
  useCallback: (fn: any) => fn,
  createContext: () => ({ _value: null }),
  useContext: () => null,
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
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
};

beforeEach(() => {
  mockState = {};
  mockSetState = jest.fn();
  mockLoadedSetter = jest.fn();
  mockEffectCallback = null;
  for (const key of Object.keys(mockLocalStorage)) delete mockLocalStorage[key];
  jest.clearAllMocks();
});

describe('usePreferences', () => {
  it('returns default preferences initially', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { prefs } = usePreferences();

    expect(prefs.onboardingComplete).toBe(false);
    expect(prefs.selectedSport).toBe('all');
    expect(Array.isArray(prefs.selectedServices)).toBe(true);
    expect(prefs.selectedServices).toContain('youtube-tv');
  });

  it('returns loaded=false initially', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { loaded } = usePreferences();
    expect(loaded).toBe(false);
  });

  it('toggleService adds a service when not present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleService } = usePreferences();

    toggleService('new-service');

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.selectedServices).toContain('new-service');
    expect(result.selectedServices).toContain('youtube-tv');
  });

  it('toggleService removes a service when already present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleService } = usePreferences();

    toggleService('youtube-tv');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv', 'espn-plus'],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.selectedServices).not.toContain('youtube-tv');
    expect(result.selectedServices).toContain('espn-plus');
  });

  it('completeOnboarding sets onboardingComplete to true', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { completeOnboarding } = usePreferences();

    completeOnboarding();

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: [],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.onboardingComplete).toBe(true);
  });

  it('setSport updates the selected sport', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { setSport } = usePreferences();

    setSport('nba');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: [],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.selectedSport).toBe('nba');
  });

  it('updateServices replaces the entire services list', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { updateServices } = usePreferences();

    updateServices(['peacock', 'hulu-live']);

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.selectedServices).toEqual(['peacock', 'hulu-live']);
  });

  it('returns default favoriteSports as empty array', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { prefs } = usePreferences();
    expect(prefs.favoriteSports).toEqual([]);
  });

  it('toggleFavoriteSport adds a sport when not present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleFavoriteSport } = usePreferences();

    toggleFavoriteSport('golf');

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: [],
      favoriteSports: [],
      onboardingComplete: false,
    });
    expect(result.favoriteSports).toContain('golf');
  });

  it('toggleFavoriteSport removes a sport when already present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleFavoriteSport } = usePreferences();

    toggleFavoriteSport('golf');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: [],
      favoriteSports: ['golf', 'mma'],
      onboardingComplete: false,
    });
    expect(result.favoriteSports).not.toContain('golf');
    expect(result.favoriteSports).toContain('mma');
  });

  it('toggleFavoriteSport handles undefined favoriteSports gracefully', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleFavoriteSport } = usePreferences();

    toggleFavoriteSport('tennis');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: [],
      onboardingComplete: false,
    });
    expect(result.favoriteSports).toEqual(['tennis']);
  });

  it('toggleService saves to localStorage on web', async () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleService } = usePreferences();

    toggleService('peacock');

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      onboardingComplete: false,
    });

    await new Promise((r) => setTimeout(r, 50));

    expect((global as any).localStorage.setItem).toHaveBeenCalledWith(
      'tv-guide-preferences',
      expect.any(String),
    );
  });

  it('loadPreferences reads from localStorage on web', async () => {
    const savedPrefs = {
      selectedServices: ['peacock'],
      selectedSport: 'nba',
      onboardingComplete: true,
    };
    mockLocalStorage['tv-guide-preferences'] = JSON.stringify(savedPrefs);

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    expect(mockEffectCallback).not.toBeNull();
    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedServices: ['peacock'],
        selectedSport: 'nba',
        onboardingComplete: true,
      }),
    );
  });

  it('loadPreferences returns defaults when localStorage is empty', async () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingComplete: false,
        selectedSport: 'all',
      }),
    );
  });

  it('returns default favoriteTeams as empty array', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { prefs } = usePreferences();
    expect(prefs.favoriteTeams).toEqual([]);
  });

  it('toggleTeam adds a team when not present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTeam } = usePreferences();

    toggleTeam('42');

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: [],
      onboardingComplete: false,
    });
    expect(result.favoriteTeams).toContain('42');
  });

  it('toggleTeam removes a team when already present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTeam } = usePreferences();

    toggleTeam('42');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: ['42', '13'],
      onboardingComplete: false,
    });
    expect(result.favoriteTeams).not.toContain('42');
    expect(result.favoriteTeams).toContain('13');
  });

  it('updateTeams replaces the entire teams list', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { updateTeams } = usePreferences();

    updateTeams(['5', '10', '15']);

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      favoriteTeams: ['42'],
      onboardingComplete: false,
    });
    expect(result.favoriteTeams).toEqual(['5', '10', '15']);
  });

  it('toggleTeam handles undefined favoriteTeams gracefully', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTeam } = usePreferences();

    toggleTeam('7');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.favoriteTeams).toContain('7');
  });

  it('returns default tvMarkets as an empty array', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { prefs } = usePreferences();
    expect(prefs.tvMarkets).toEqual([]);
  });

  it('toggleTvMarket adds a market when not present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTvMarket } = usePreferences();

    toggleTvMarket('new-york');

    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      tvMarkets: [],
      onboardingComplete: false,
    });
    expect(result.tvMarkets).toEqual(['new-york']);
  });

  it('toggleTvMarket removes a market when already present', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTvMarket } = usePreferences();

    toggleTvMarket('boston');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      tvMarkets: ['new-york', 'boston'],
      onboardingComplete: false,
    });
    expect(result.tvMarkets).toEqual(['new-york']);
  });

  it('toggleTvMarket handles undefined tvMarkets gracefully', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleTvMarket } = usePreferences();

    toggleTvMarket('seattle');

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      onboardingComplete: false,
    });
    expect(result.tvMarkets).toEqual(['seattle']);
  });

  it('clearTvMarkets removes all selected markets', () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { clearTvMarkets } = usePreferences();

    clearTvMarkets();

    const updater = mockSetState.mock.calls[0][0];
    const result = updater({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      tvMarkets: ['new-york', 'boston'],
      onboardingComplete: false,
    });
    expect(result.tvMarkets).toEqual([]);
  });

  it('loadPreferences migrates legacy tvMarket to tvMarkets', async () => {
    mockLocalStorage['tv-guide-preferences'] = JSON.stringify({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      tvMarket: 'boston',
      onboardingComplete: true,
    });

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        tvMarkets: ['boston'],
      }),
    );
  });

  it('loadPreferences keeps stored tvMarkets over legacy tvMarket', async () => {
    mockLocalStorage['tv-guide-preferences'] = JSON.stringify({
      selectedServices: ['youtube-tv'],
      selectedSport: 'all',
      tvMarket: 'boston',
      tvMarkets: ['new-york', 'seattle'],
      onboardingComplete: true,
    });

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        tvMarkets: ['new-york', 'seattle'],
      }),
    );
  });

  it('loadPreferences handles corrupt JSON gracefully', async () => {
    mockLocalStorage['tv-guide-preferences'] = '{invalid json';

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingComplete: false }),
    );
  });
});
