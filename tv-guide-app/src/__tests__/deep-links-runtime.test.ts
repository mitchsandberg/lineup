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

  it('opens the tvos deep link on ios platform', async () => {
    (Platform as any).OS = 'ios';
    const result = await launchStreamingApp('youtube-tv');
    expect(Linking.openURL).toHaveBeenCalledWith(
      SERVICE_MAP['youtube-tv'].deepLinks.tvos,
    );
    expect(result).toBe(true);
  });

  it('falls back to web deep link when canOpenURL returns false', async () => {
    (Platform as any).OS = 'web';
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const webUrl = SERVICE_MAP['espn-plus'].deepLinks.web;

    const result = await launchStreamingApp('espn-plus');

    expect(Linking.openURL).toHaveBeenCalledWith(webUrl);
    expect(result).toBe(true);
  });

  it('returns false when openURL throws and no web fallback', async () => {
    (Platform as any).OS = 'web';
    (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('fail'));

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

  it('returns false when canOpenURL is false and no web fallback exists', async () => {
    (Platform as any).OS = 'android';
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

  afterEach(() => {
    (Platform as any).OS = 'web';
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
