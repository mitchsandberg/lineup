import { Linking, Platform } from 'react-native';
import { launchStreamingApp, getServiceDisplayInfo } from '@/lib/deep-links';
import { SERVICE_MAP } from '@/data/services';

beforeEach(() => {
  jest.clearAllMocks();
  (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
});

describe('launchStreamingApp', () => {
  it('returns false for an unknown service ID', async () => {
    expect(await launchStreamingApp('nonexistent-service')).toBe(false);
  });

  it('opens the web deep link on web platform', async () => {
    (Platform as any).OS = 'web';
    const result = await launchStreamingApp('youtube-tv');
    expect(Linking.openURL).toHaveBeenCalledWith(
      SERVICE_MAP['youtube-tv'].deepLinks.web,
    );
    expect(result).toBe(true);
  });

  it('opens the android deep link on android platform', async () => {
    (Platform as any).OS = 'android';
    const result = await launchStreamingApp('youtube-tv');
    expect(Linking.openURL).toHaveBeenCalledWith(
      SERVICE_MAP['youtube-tv'].deepLinks.android,
    );
    expect(result).toBe(true);
  });

  it('opens the ios deep link on ios platform when available', async () => {
    (Platform as any).OS = 'ios';
    const result = await launchStreamingApp('youtube-tv');
    expect(Linking.openURL).toHaveBeenCalledWith(
      SERVICE_MAP['youtube-tv'].deepLinks.ios,
    );
    expect(result).toBe(true);
  });

  it('falls back to web when canOpenURL returns false on native (non-TV)', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const webUrl = SERVICE_MAP['espn-plus'].deepLinks.web;

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).toHaveBeenCalledWith(webUrl);
    expect(result).toBe(true);
  });

  it('returns false when openURL fails and web fallback also fails', async () => {
    (Platform as any).OS = 'web';
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('fail'));

    const result = await launchStreamingApp('youtube-tv');
    expect(result).toBe(false);
  });

  it('falls back to web URL when platform-specific URL is missing', async () => {
    (Platform as any).OS = 'ios';
    const svc = Object.values(SERVICE_MAP).find(
      (s) => !s.deepLinks.tvos && s.deepLinks.web,
    );
    if (!svc) return;

    const result = await launchStreamingApp(svc.id);
    expect(Linking.openURL).toHaveBeenCalledWith(svc.deepLinks.web);
    expect(result).toBe(true);
  });

  it('returns false when no URL exists for the platform and no web fallback', async () => {
    (Platform as any).OS = 'ios';
    const original = { ...SERVICE_MAP };
    const testId = Object.keys(SERVICE_MAP)[0];
    const origService = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...origService,
      deepLinks: { tvos: undefined, android: undefined, web: undefined },
    };

    const result = await launchStreamingApp(testId);
    expect(result).toBe(false);

    (SERVICE_MAP as any)[testId] = origService;
  });

  it('opens intent URLs without requiring canOpenURL to be true', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

    const result = await launchStreamingApp('youtube-tv');

    expect(Linking.openURL).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.android);
    expect(result).toBe(true);
  });

  it('returns false when canOpenURL is false and no web fallback exists', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const testId = Object.keys(SERVICE_MAP)[0];
    const origService = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...origService,
      deepLinks: { android: 'app://test', web: undefined },
    };

    const result = await launchStreamingApp(testId);
    expect(result).toBe(false);

    (SERVICE_MAP as any)[testId] = origService;
  });

  it('uses androidTv for Prime Video on Android TV', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = true;

    const result = await launchStreamingApp('prime-video');

    expect(Linking.openURL).toHaveBeenCalledWith(
      SERVICE_MAP['prime-video'].deepLinks.androidTv,
    );
    expect(result).toBe(true);
  });

  it('falls back to web on android phone when android deep link is missing', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    const testId = 'youtube-tv';
    const original = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...original,
      deepLinks: { ...original.deepLinks, android: undefined, web: 'https://example.com/fallback' },
    };

    const result = await launchStreamingApp(testId);

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/fallback');
    expect(result).toBe(true);
    (SERVICE_MAP as any)[testId] = original;
  });

  it('falls back to web on iOS TV when tvos deep link is missing', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = true;
    const testId = 'youtube-tv';
    const original = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...original,
      deepLinks: { ...original.deepLinks, tvos: undefined, web: 'https://example.com/tvos-fallback' },
    };

    const result = await launchStreamingApp(testId);

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/tvos-fallback');
    expect(result).toBe(true);
    (SERVICE_MAP as any)[testId] = original;
  });

  it('does not fall back to web on TV when canOpenURL is false', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = true;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('uses web URL on unrecognized native OS (e.g. future platform)', async () => {
    (Platform as any).OS = 'windows';
    (Platform as any).isTV = false;

    const result = await launchStreamingApp('youtube-tv');

    expect(Linking.openURL).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.web);
    expect(result).toBe(true);
  });

  it('recovers with web URL when first openURL throws on iOS', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.openURL as jest.Mock)
      .mockRejectedValueOnce(new Error('simulator'))
      .mockResolvedValue(undefined);

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).toHaveBeenCalledTimes(2);
    expect(Linking.openURL).toHaveBeenNthCalledWith(1, SERVICE_MAP['espn-plus'].deepLinks.tvos);
    expect(Linking.openURL).toHaveBeenNthCalledWith(2, SERVICE_MAP['espn-plus'].deepLinks.web);
    expect(result).toBe(true);
  });

  afterEach(() => {
    (Platform as any).OS = 'web';
    (Platform as any).isTV = false;
  });
});

describe('launchStreamingApp on mobile web', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'web';
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true });
    if (!originalWindow) {
      delete (global as any).window;
    }
  });

  function setMobileUserAgent(ua: string) {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: ua },
      writable: true,
    });
  }

  it('uses window.open with app deep link on iPhone (not storefront web)', async () => {
    setMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    const mockOpen = jest.fn();
    (global as any).window = { open: mockOpen };

    const result = await launchStreamingApp('youtube-tv');

    expect(result).toBe(true);
    expect(mockOpen).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.ios, '_blank');
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('uses window.open with Android intent on mobile Chrome (not website)', async () => {
    setMobileUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)');
    const mockOpen = jest.fn();
    (global as any).window = { open: mockOpen };

    const result = await launchStreamingApp('peacock');

    expect(result).toBe(true);
    expect(mockOpen).toHaveBeenCalledWith(SERVICE_MAP['peacock'].deepLinks.android, '_blank');
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('uses app deep link for iPad (tablet) mobile browser', async () => {
    setMobileUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    );
    const mockOpen = jest.fn();
    (global as any).window = { open: mockOpen };

    await launchStreamingApp('hulu-live');

    expect(mockOpen).toHaveBeenCalledWith(SERVICE_MAP['hulu-live'].deepLinks.tvos, '_blank');
  });

  it('uses android or tvos fallback for mobile web UAs without Android or Apple tokens', async () => {
    setMobileUserAgent(
      'Mozilla/5.0 (compatible; BlackBerry 10; Touch) AppleWebKit/537.36',
    );
    const mockOpen = jest.fn();
    (global as any).window = { open: mockOpen };

    await launchStreamingApp('peacock');

    expect(mockOpen).toHaveBeenCalledWith(
      SERVICE_MAP['peacock'].deepLinks.android ?? SERVICE_MAP['peacock'].deepLinks.tvos,
      '_blank',
    );
  });

  it('uses iOS mobile-web fallback when android deep link is missing', async () => {
    setMobileUserAgent(
      'Mozilla/5.0 (compatible; BlackBerry 10; Touch) AppleWebKit/537.36',
    );
    const mockOpen = jest.fn();
    (global as any).window = { open: mockOpen };
    const testId = 'youtube-tv';
    const original = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...original,
      deepLinks: { ...original.deepLinks, android: undefined, ios: 'youtubetv://' },
    };

    await launchStreamingApp(testId);

    expect(mockOpen).toHaveBeenCalledWith('youtubetv://', '_blank');
    (SERVICE_MAP as any)[testId] = original;
  });

  it('uses Linking.openURL when mobile web has no window.open', async () => {
    setMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    (global as any).window = {};

    const result = await launchStreamingApp('youtube-tv');

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.ios);
  });

  it('uses Linking.openURL on desktop web (not mobile)', async () => {
    setMobileUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

    const result = await launchStreamingApp('youtube-tv');

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.web);
  });

  it('returns false when window.open throws on mobile web', async () => {
    setMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    (global as any).window = {
      open: jest.fn(() => { throw new Error('blocked'); }),
    };

    const result = await launchStreamingApp('youtube-tv');
    expect(result).toBe(false);
  });

  it('falls back to Linking.openURL when navigator is undefined', async () => {
    const savedNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', { value: undefined, writable: true });

    const result = await launchStreamingApp('youtube-tv');

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(SERVICE_MAP['youtube-tv'].deepLinks.web);

    Object.defineProperty(global, 'navigator', { value: savedNavigator, writable: true });
  });
});

describe('getServiceDisplayInfo', () => {
  it('returns service info for a valid ID', () => {
    const info = getServiceDisplayInfo('youtube-tv');
    expect(info).not.toBeNull();
    expect(info!.name).toBe('YouTube TV');
    expect(info!.id).toBe('youtube-tv');
  });

  it('returns null for an unknown ID', () => {
    expect(getServiceDisplayInfo('fake-service')).toBeNull();
  });

  it('returns correct info for every service in SERVICE_MAP', () => {
    for (const [id, expected] of Object.entries(SERVICE_MAP)) {
      const result = getServiceDisplayInfo(id);
      expect(result).toEqual(expected);
    }
  });
});
