import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

export default function AppTabs() {
  const { width, height } = useWindowDimensions();
  const isLandscapeMobile = width > height && height < 500;

  if (isLandscapeMobile) {
    return (
      <Tabs>
        <TabList asChild>
          <CustomTabList compact>
            <TabTrigger name="index" href="/" asChild>
              <TabButton>Guide</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href="/settings" asChild>
              <TabButton>Settings</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
        <TabSlot style={{ flex: 1 }} />
      </Tabs>
    );
  }

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Guide</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed, focused, hovered }) => [
        styles.tabButton,
        isFocused && styles.tabButtonActive,
        (pressed || focused || hovered) && styles.tabButtonHover,
      ]}
    >
      <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps & { compact?: boolean }) {
  const { compact, ...rest } = props;
  return (
    <View {...rest} style={compact ? styles.tabListCompact : styles.tabListContainer}>
      <View style={compact ? styles.innerCompact : styles.innerContainer}>
        <Text style={compact ? styles.brandTextCompact : styles.brandText}>Lineup</Text>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabListCompact: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#0D1117',
  },
  innerContainer: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    gap: 8,
  },
  innerCompact: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    gap: 6,
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginRight: 16,
  },
  brandTextCompact: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#2D3548',
  },
  tabButtonHover: {
    opacity: 0.8,
  },
  tabText: {
    color: '#8B95A5',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
