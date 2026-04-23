import { Linking, Platform } from 'react-native';
import { launchStreamingApp, getServiceDisplayInfo, probeStreamingLaunch } from '@/lib/deep-links';
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

  it('opens the App Store when canOpenURL is false on iOS and the service has an app id', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const storeUrl = 'https://apps.apple.com/app/id317469184';

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).toHaveBeenCalledWith(storeUrl);
    expect(result).toBe(true);
  });

  it('falls back to web when canOpenURL is false and there is no App Store id', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const testId = 'youtube-tv';
    const original = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...original,
      appStoreId: undefined,
    };
    const webUrl = original.deepLinks.web!;

    const result = await launchStreamingApp(testId);

    expect(Linking.openURL).toHaveBeenCalledWith(webUrl);
    expect(result).toBe(true);
    (SERVICE_MAP as any)[testId] = original;
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

  it('returns false when canOpenURL is false and there is no store or web fallback', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const testId = Object.keys(SERVICE_MAP)[0];
    const origService = SERVICE_MAP[testId];
    (SERVICE_MAP as any)[testId] = {
      ...origService,
      deepLinks: { android: 'app://test', web: undefined },
      appStoreId: undefined,
      playStorePackage: undefined,
      playStorePackageTv: undefined,
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

  it('opens the App Store on iOS TV when canOpenURL is false', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = true;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const storeUrl = 'https://apps.apple.com/app/id317469184';

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).toHaveBeenCalledWith(storeUrl);
    expect(result).toBe(true);
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

describe('launchStreamingApp fallback catch branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    (Platform as any).OS = 'web';
    (Platform as any).isTV = false;
    jest.restoreAllMocks();
  });

  it('iOS: App Store openURL rejects, falls through to web fallback (covers tryOpenStoreListing iOS catch)', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    // App-store openURL rejects; the subsequent web-fallback openURL resolves.
    (Linking.openURL as jest.Mock)
      .mockRejectedValueOnce(new Error('store open failed'))
      .mockResolvedValue(undefined);

    const result = await launchStreamingApp('espn-plus');

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenNthCalledWith(1, 'https://apps.apple.com/app/id317469184');
    expect(Linking.openURL).toHaveBeenNthCalledWith(2, SERVICE_MAP['espn-plus'].deepLinks.web);
  });

  it('Android: intent openURL throws, then Play Store listing opens successfully', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    // Canonical canOpen is skipped for intents; openURL throws once, then Play Store opens.
    (Linking.openURL as jest.Mock)
      .mockRejectedValueOnce(new Error('no app'))
      .mockResolvedValue(undefined);

    const result = await launchStreamingApp('hulu-live');

    expect(result).toBe(true);
    const playStore = `https://play.google.com/store/apps/details?id=${encodeURIComponent(
      SERVICE_MAP['hulu-live'].playStorePackage!,
    )}`;
    expect(Linking.openURL).toHaveBeenNthCalledWith(2, playStore);
  });

  it('Android: every openURL rejects → Play Store catch + web-fallback catch + final console.warn', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('blocked'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await launchStreamingApp('hulu-live');

    expect(result).toBe(false);
    // intent → Play Store → web fallback: 3 openURL attempts, all rejected
    expect(Linking.openURL).toHaveBeenCalledTimes(3);
    expect(warnSpy).toHaveBeenCalledWith(
      `Failed to launch ${SERVICE_MAP['hulu-live'].name}:`,
      expect.any(Error),
    );
  });
});

describe('probeStreamingLaunch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    (Platform as any).OS = 'web';
    (Platform as any).isTV = false;
  });

  it('returns null for an unknown service id', async () => {
    expect(await probeStreamingLaunch('does-not-exist')).toBeNull();
  });

  it('web platform: canOpen is null (OS probe is skipped), no store fallback flagged', async () => {
    (Platform as any).OS = 'web';
    const p = await probeStreamingLaunch('hulu-live');
    expect(p).not.toBeNull();
    expect(p!.canOpen).toBeNull();
    expect(p!.wouldUseStoreFallback).toBe(false);
  });

  it('iOS + canOpen true: resolves the tvos scheme and the App Store listing URL', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

    const p = await probeStreamingLaunch('espn-plus');

    expect(p).toEqual({
      serviceId: 'espn-plus',
      name: 'ESPN+',
      resolvedUrl: SERVICE_MAP['espn-plus'].deepLinks.tvos,
      isIntent: false,
      canOpen: true,
      storeListingUrl: 'https://apps.apple.com/app/id317469184',
      wouldUseStoreFallback: false,
    });
  });

  it('iOS + canOpen false: wouldUseStoreFallback becomes true when appStoreId exists', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

    const p = await probeStreamingLaunch('peacock');

    expect(p!.canOpen).toBe(false);
    expect(p!.wouldUseStoreFallback).toBe(true);
    expect(p!.storeListingUrl).toBe('https://apps.apple.com/app/id1508186374');
  });

  it('Android intent URLs: isIntent true, canOpen null, store fallback not flagged', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = false;

    const p = await probeStreamingLaunch('hulu-live');

    expect(p!.isIntent).toBe(true);
    expect(p!.canOpen).toBeNull();
    expect(p!.wouldUseStoreFallback).toBe(false);
    // On Android the store listing comes from the Play Store package, not an Apple id.
    expect(p!.storeListingUrl).toContain('play.google.com/store/apps/details?id=');
  });

  it('Android TV: resolves the androidTv intent for Prime Video (not the phone intent)', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).isTV = true;

    const p = await probeStreamingLaunch('prime-video');

    expect(p!.resolvedUrl).toBe(SERVICE_MAP['prime-video'].deepLinks.androidTv);
    expect(p!.isIntent).toBe(true);
    // Android TV: playStorePackageTv should drive storeListingUrl.
    expect(p!.storeListingUrl).toContain(
      encodeURIComponent(SERVICE_MAP['prime-video'].playStorePackageTv!),
    );
  });

  it('iOS probe without an appStoreId: storeListingUrl is undefined, no store fallback', async () => {
    (Platform as any).OS = 'ios';
    (Platform as any).isTV = false;
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

    const id = 'espn-plus';
    const original = SERVICE_MAP[id];
    (SERVICE_MAP as any)[id] = { ...original, appStoreId: undefined };

    const p = await probeStreamingLaunch(id);

    expect(p!.storeListingUrl).toBeUndefined();
    expect(p!.wouldUseStoreFallback).toBe(false);
    (SERVICE_MAP as any)[id] = original;
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
