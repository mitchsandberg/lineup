/**
 * Tests for usePreferences on non-web platforms (AsyncStorage code path).
 * Uses jest.resetModules() to re-evaluate use-preferences.ts with Platform.OS='android',
 * and a virtual mock for @react-native-async-storage/async-storage.
 */

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
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

const mockAsyncStorage = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
}), { virtual: true });

beforeEach(() => {
  mockState = {};
  mockSetState = jest.fn();
  mockEffectCallback = null;
  mockAsyncStorage.getItem.mockReset().mockResolvedValue(null);
  mockAsyncStorage.setItem.mockReset().mockResolvedValue(undefined);
  jest.clearAllMocks();
});

describe('usePreferences (native / AsyncStorage)', () => {
  it('loads preferences from AsyncStorage on native', async () => {
    const saved = JSON.stringify({
      selectedServices: ['hulu-live'],
      selectedSport: 'nfl',
      onboardingComplete: true,
    });
    mockAsyncStorage.getItem.mockResolvedValue(saved);

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('tv-guide-preferences');
    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedServices: ['hulu-live'],
        selectedSport: 'nfl',
        onboardingComplete: true,
      }),
    );
  });

  it('returns defaults when AsyncStorage has no data', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingComplete: false, selectedSport: 'all' }),
    );
  });

  it('saves to AsyncStorage when toggling a service', async () => {
    const { usePreferences } = require('@/hooks/use-preferences');
    const { toggleService } = usePreferences();

    toggleService('peacock');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'tv-guide-preferences',
      expect.any(String),
    );
  });

  it('handles AsyncStorage getItem error gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('storage error'));

    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingComplete: false }),
    );
  });
});
