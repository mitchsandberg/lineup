import { Linking, Platform } from 'react-native';
import { SERVICE_MAP } from '@/data/services';

function isMobileWeb(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function launchStreamingApp(serviceId: string): Promise<boolean> {
  const service = SERVICE_MAP[serviceId];
  if (!service) return false;

  const platform = Platform.OS === 'ios' ? 'tvos' : Platform.OS === 'android' ? 'android' : 'web';
  const url = service.deepLinks[platform] ?? service.deepLinks.web;

  if (!url) return false;

  try {
    if (isMobileWeb()) {
      window.open(url, '_blank');
      return true;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }

    if (service.deepLinks.web) {
      await Linking.openURL(service.deepLinks.web);
      return true;
    }
  } catch (err) {
    console.warn(`Failed to launch ${service.name}:`, err);
  }

  return false;
}

export function getServiceDisplayInfo(serviceId: string) {
  return SERVICE_MAP[serviceId] ?? null;
}
