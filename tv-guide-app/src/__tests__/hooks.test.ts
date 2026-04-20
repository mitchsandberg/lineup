import { useWindowDimensions, useColorScheme as rnUseColorScheme, Platform } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';
import { TV_SIZES } from '@/lib/constants';
import { Colors, Spacing } from '@/constants/theme';

describe('useResponsive', () => {
  it('returns TV sizes for a wide screen', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
    const sizes = useResponsive();
    expect(sizes).toEqual(TV_SIZES);
  });

  it('returns mobile sizes for a narrow screen', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 375, height: 667 });
    const sizes = useResponsive();
    expect(sizes.cardWidth).toBe(260);
  });

  it('returns tablet sizes for a medium screen', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
    const sizes = useResponsive();
    expect(sizes.cardWidth).toBe(300);
  });
});

describe('useColorScheme (native re-export)', () => {
  it('re-exports useColorScheme from react-native', () => {
    const { useColorScheme } = require('@/hooks/use-color-scheme');
    expect(useColorScheme).toBe(rnUseColorScheme);
  });
});

describe('useTheme', () => {
  function freshTheme(scheme: string | null) {
    jest.resetModules();
    const rn = require('react-native');
    rn.useColorScheme.mockReturnValue(scheme);
    const { useTheme } = require('@/hooks/use-theme');
    return useTheme();
  }

  it('returns dark theme colors when scheme is dark', () => {
    expect(freshTheme('dark')).toEqual(Colors.dark);
  });

  it('returns light theme colors when scheme is light', () => {
    expect(freshTheme('light')).toEqual(Colors.light);
  });

  it('maps unspecified to light theme', () => {
    expect(freshTheme('unspecified')).toEqual(Colors.light);
  });
});

describe('useScreenDimensions', () => {
  function freshScreenDimensions(width: number, height: number) {
    jest.resetModules();
    const rn = require('react-native');
    rn.useWindowDimensions.mockReturnValue({ width, height });
    const { useScreenDimensions } = require('@/hooks/use-screen-dimensions');
    return useScreenDimensions();
  }

  it('returns landscape data for wide screen', () => {
    const result = freshScreenDimensions(1920, 1080);

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.landscape).toBe(true);
    expect(result.scale).toBe(1920 / 1000);
  });

  it('scales spacing values', () => {
    const result = freshScreenDimensions(1920, 1080);
    const scale = 1920 / 1000;

    expect(result.spacing.half).toBe(Spacing.half * scale);
    expect(result.spacing.one).toBe(Spacing.one * scale);
    expect(result.spacing.six).toBe(Spacing.six * scale);
  });

  it('returns portrait data for tall screen', () => {
    const result = freshScreenDimensions(375, 812);

    expect(result.width).toBe(375);
    expect(result.height).toBe(812);
    expect(result.landscape).toBe(false);
    expect(result.scale).toBeCloseTo(812 / 1000, 5);
  });
});

describe('useAnimatedIconStyles', () => {
  function freshAnimatedStyles(opts: { os: string; isTV: boolean; width: number; height: number }) {
    jest.resetModules();
    const rn = require('react-native');
    rn.Platform.OS = opts.os;
    rn.Platform.isTV = opts.isTV;
    rn.useWindowDimensions.mockReturnValue({ width: opts.width, height: opts.height });
    const { useAnimatedIconStyles } = require('@/hooks/use-animated-styles');
    return useAnimatedIconStyles();
  }

  it('uses web/TV sizing when Platform.OS is web', () => {
    const styles = freshAnimatedStyles({ os: 'web', isTV: false, width: 1920, height: 1080 });
    const scale = 1080 / 800;

    expect(styles.iconContainer.width).toBe(196 * scale);
    expect(styles.image.width).toBe(160 * scale);
    expect(styles.image.height).toBe(130 * scale);
    expect(styles.background.width).toBe(196 * scale);
  });

  it('uses mobile sizing when Platform.OS is not web and not TV', () => {
    const styles = freshAnimatedStyles({ os: 'android', isTV: false, width: 375, height: 800 });

    expect(styles.iconContainer.width).toBe(128);
    expect(styles.image.width).toBe(76);
    expect(styles.image.height).toBe(71);
    expect(styles.background.width).toBe(128);
  });

  it('uses TV sizing when Platform.isTV is true', () => {
    const styles = freshAnimatedStyles({ os: 'android', isTV: true, width: 1920, height: 1080 });
    const scale = 1080 / 800;

    expect(styles.iconContainer.width).toBe(196 * scale);
    expect(styles.image.width).toBe(160 * scale);
  });

  it('scales glow dimensions to 15% of height', () => {
    const styles = freshAnimatedStyles({ os: 'web', isTV: false, width: 1920, height: 1080 });

    expect(styles.glow.width).toBe(1080 * 0.15);
    expect(styles.glow.height).toBe(1080 * 0.15);
  });

  it('sets background borderRadius to 4% of height', () => {
    const styles = freshAnimatedStyles({ os: 'web', isTV: false, width: 1920, height: 1080 });

    expect(styles.background.borderRadius).toBe(1080 * 0.04);
  });

  it('sets backgroundSolidColor correctly', () => {
    const styles = freshAnimatedStyles({ os: 'web', isTV: false, width: 1920, height: 1080 });

    expect(styles.backgroundSolidColor.backgroundColor).toBe('#208AEF');
    expect(styles.backgroundSolidColor.position).toBe('absolute');
  });
});
