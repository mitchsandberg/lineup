import { Colors, Fonts, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

describe('Theme constants', () => {
  describe('Colors', () => {
    it('has light and dark themes', () => {
      expect(Colors).toHaveProperty('light');
      expect(Colors).toHaveProperty('dark');
    });

    it('light theme has all required color keys', () => {
      const keys = ['text', 'tint', 'background', 'backgroundElement', 'backgroundSelected', 'textSecondary', 'gradientStart', 'gradientEnd'];
      for (const key of keys) {
        expect(Colors.light).toHaveProperty(key);
      }
    });

    it('dark theme has all required color keys', () => {
      const keys = ['text', 'tint', 'background', 'backgroundElement', 'backgroundSelected', 'textSecondary', 'gradientStart', 'gradientEnd'];
      for (const key of keys) {
        expect(Colors.dark).toHaveProperty(key);
      }
    });

    it('light and dark themes have different background colors', () => {
      expect(Colors.light.background).not.toBe(Colors.dark.background);
    });
  });

  describe('Fonts', () => {
    it('is defined with font family keys', () => {
      expect(Fonts).toBeDefined();
      expect(Fonts).toHaveProperty('sans');
      expect(Fonts).toHaveProperty('serif');
      expect(Fonts).toHaveProperty('mono');
    });
  });

  describe('Spacing', () => {
    it('has all spacing levels', () => {
      expect(Spacing.half).toBe(2);
      expect(Spacing.one).toBe(4);
      expect(Spacing.two).toBe(8);
      expect(Spacing.three).toBe(16);
      expect(Spacing.four).toBe(24);
      expect(Spacing.five).toBe(32);
      expect(Spacing.six).toBe(64);
    });

    it('spacing values are strictly increasing', () => {
      const values = [Spacing.half, Spacing.one, Spacing.two, Spacing.three, Spacing.four, Spacing.five, Spacing.six];
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('Layout constants', () => {
    it('BottomTabInset is a number', () => {
      expect(typeof BottomTabInset).toBe('number');
    });

    it('MaxContentWidth is 800', () => {
      expect(MaxContentWidth).toBe(800);
    });
  });
});
