import React from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { SettingItem, SectionHeader, settingsStyles } from '../../components/ui/SettingsUI';
import { useAppTheme } from '../../context/ThemeContext';

export default function AccountSettingsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[settingsStyles.container, isDark && settingsStyles.containerDark]}>
      <Stack.Screen options={{ title: 'Account', headerBackTitleVisible: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.contentWrapper}>
          
          <SectionHeader title="Security" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem icon="shield-checkmark" color="#27ae60" title="Security notifications" onPress={() => {}} />
            <SettingItem icon="keypad" color="#3498db" title="Two-step verification" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Account Management" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem icon="swap-horizontal" color="#8e44ad" title="Change number" onPress={() => {}} />
            <SettingItem icon="document-text" color="#f39c12" title="Request account info" onPress={() => {}} />
            <SettingItem icon="trash" color="#e74c3c" title="Delete my account" onPress={() => {}} isLast={true} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
