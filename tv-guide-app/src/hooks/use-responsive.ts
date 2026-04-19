import { useWindowDimensions } from 'react-native';
import { getSizesForWidth, type ResponsiveSizes } from '@/lib/constants';

export function useResponsive(): ResponsiveSizes {
  const { width } = useWindowDimensions();
  return getSizesForWidth(width);
}
