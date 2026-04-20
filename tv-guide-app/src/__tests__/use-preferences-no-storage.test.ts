/**
 * Tests the catch branch in getStorage() when AsyncStorage is not installed.
 * Platform.OS is 'android' so getStorage() attempts a real require() which
 * throws because the module is not present.
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

beforeEach(() => {
  mockState = {};
  mockSetState = jest.fn();
  mockEffectCallback = null;
});

describe('usePreferences (native without AsyncStorage)', () => {
  it('returns defaults when AsyncStorage module is not installed', async () => {
    jest.resetModules();
    const { usePreferences } = require('@/hooks/use-preferences');
    usePreferences();

    mockEffectCallback!();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingComplete: false, selectedSport: 'all' }),
    );
  });
});
