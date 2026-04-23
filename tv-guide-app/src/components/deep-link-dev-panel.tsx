import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STREAMING_SERVICES } from '@/data/services';
import { launchStreamingApp, probeStreamingLaunch, type StreamingLaunchProbe } from '@/lib/deep-links';
import { TVFocusGuideView } from './tv-focus-guide';

/**
 * __DEV__ only. On simulator, third-party TV apps are not installed, so `canOpen` is
 * usually false; use this to confirm we fall back to the App/Play store listing.
 */
export function DeepLinkDevPanel() {
  const [probes, setProbes] = useState<StreamingLaunchProbe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLaunch, setLastLaunch] = useState<string | null>(null);
  const isTv = Platform.isTV;

  const runProbe = useCallback(async () => {
    setLoading(true);
    setProbes(null);
    try {
      const rows: StreamingLaunchProbe[] = [];
      for (const s of STREAMING_SERVICES) {
        const p = await probeStreamingLaunch(s.id);
        if (p) rows.push(p);
      }
      setProbes(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  const onTryLaunch = useCallback(async (id: string, name: string) => {
    setLastLaunch(null);
    const ok = await launchStreamingApp(id);
    setLastLaunch(`${name}: launchStreamingApp → ${ok ? 'ok' : 'returned false'}`);
  }, []);

  return (
    <View style={styles.block}>
      <Text style={styles.heading}>Deep links (dev only)</Text>
      <Text style={styles.hint}>
        The simulator has no YouTube, Peacock, etc., so you should see <Text style={styles.hintEm}>canOpen: no</Text> and
        then a store open when you tap <Text style={styles.hintEm}>Try launch</Text>. On a real device with the app
        installed, <Text style={styles.hintEm}>canOpen: yes</Text> and the app should open instead.
      </Text>

      <Pressable
        onPress={runProbe}
        style={({ focused }) => [styles.btn, isTv && focused && styles.btnFocused]}
      >
        <Text style={styles.btnText}>Run probe (all services)</Text>
      </Pressable>

      {loading && <ActivityIndicator color="#5CAAFF" style={styles.spinner} />}

      {probes && (
        /**
         * tvOS: "Run probe" is left-aligned, "Try launch" is right-aligned per card, so the
         * downward focus cone from Run probe misses them. `autoFocus` pulls focus into the
         * guide and lands on the first Try launch button.
         */
        <TVFocusGuideView autoFocus style={styles.list}>
          {probes.map((p) => (
            <View key={p.serviceId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{p.name}</Text>
                <Pressable
                  onPress={() => onTryLaunch(p.serviceId, p.name)}
                  style={({ focused }) => [
                    styles.btnSmall,
                    isTv && focused && styles.btnFocused,
                  ]}
                >
                  <Text style={styles.btnSmallText}>Try launch</Text>
                </Pressable>
              </View>
              <Text style={styles.mono} selectable>
                canOpen: {p.canOpen === null ? '—' : p.canOpen ? 'yes' : 'no'}
                {'\n'}
                {p.resolvedUrl ? `url: ${p.resolvedUrl}` : 'url: (none)'}
                {'\n'}
                {p.wouldUseStoreFallback
                  ? `store fallback: ${p.storeListingUrl ?? 'missing id'}`
                  : 'store fallback: (not used for this path)'}
              </Text>
            </View>
          ))}
        </TVFocusGuideView>
      )}

      {lastLaunch && (
        <Text style={styles.lastLaunch} selectable>
          {lastLaunch}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 8,
  },
  heading: {
    color: '#FFB020',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    color: '#8B95A5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  hintEm: {
    color: '#C8D0DA',
    fontWeight: '600',
  },
  btn: {
    // tvOS: keep the hit region wide so pressing DOWN reliably reaches the cards below.
    alignSelf: Platform.isTV ? 'stretch' : 'flex-start',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnFocused: {
    borderColor: '#FFFFFF',
  },
  btnText: {
    color: '#5CAAFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginVertical: 12,
  },
  list: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#14181F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  btnSmall: {
    backgroundColor: '#1A1F2E',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  btnSmallText: {
    color: '#5CAAFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mono: {
    color: '#9AA5B0',
    fontSize: 11,
    lineHeight: 16,
  },
  lastLaunch: {
    color: '#8B95A5',
    fontSize: 13,
    marginTop: 12,
  },
});
