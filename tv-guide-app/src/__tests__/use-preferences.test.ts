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
