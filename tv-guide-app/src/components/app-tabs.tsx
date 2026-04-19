import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform } from 'react-native';
import WebTabs from './app-tabs.web';

export default function AppTabs() {
  if (Platform.OS === 'android' && Platform.isTV) {
    return <WebTabs />;
  }

  return (
    <NativeTabs
      backgroundColor="#0D1117"
      indicatorColor="#FFFFFF"
      tintColor="#FFFFFF"
      iconColor="#8B95A5"
      labelStyle={{
        selected: { color: '#FFFFFF' },
        default: { color: '#8B95A5' },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Guide</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/tv.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
