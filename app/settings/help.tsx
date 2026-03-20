import React from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { SettingItem, SectionHeader, settingsStyles } from '../../components/ui/SettingsUI';
import { useAppTheme } from '../../context/ThemeContext';

export default function HelpSettingsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[settingsStyles.container, isDark && settingsStyles.containerDark]}>
      <Stack.Screen options={{ title: 'Help', headerBackTitleVisible: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.contentWrapper}>
          
          <SectionHeader title="Support" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem icon="help-buoy" color="#3498db" title="Help Center" subtitle="Get help, contact us" onPress={() => {}} />
            <SettingItem icon="mail" color="#e67e22" title="Contact Us" subtitle="Questions? Need help?" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Legal" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem icon="document-text" color="#2ecc71" title="Terms and Privacy Policy" onPress={() => {}} />
            <SettingItem icon="information-circle" color="#9b59b6" title="App Info" onPress={() => {}} isLast={true} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
