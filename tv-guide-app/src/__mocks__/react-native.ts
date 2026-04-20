export const Platform = {
  OS: 'web',
  select: (obj: Record<string, unknown>) => obj.web ?? obj.default,
  isTV: false,
};

export const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

export const Alert = {
  alert: jest.fn(),
};

export const useWindowDimensions = jest.fn(() => ({ width: 1920, height: 1080 }));

export const useColorScheme = jest.fn(() => 'dark');

export const StyleSheet = {
  create: (styles: Record<string, any>) => styles,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};
