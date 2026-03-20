import React, { useState } from 'react';
import { ScrollView, View, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { SettingItem, SectionHeader, settingsStyles } from '../../components/ui/SettingsUI';
import { useAppTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function PrivacySettingsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <View style={[settingsStyles.container, isDark && settingsStyles.containerDark]}>
      <Stack.Screen options={{ title: 'Privacy', headerBackTitleVisible: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.contentWrapper}>
          
          <SectionHeader title="Who can see my personal info" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem title="Last Seen & Online" subtitle="Nobody" onPress={() => {}} />
            <SettingItem title="Profile Photo" subtitle="My Contacts" onPress={() => {}} />
            <SettingItem title="About" subtitle="Everyone" onPress={() => {}} />
            <SettingItem title="Status" subtitle="My Contacts" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Messaging" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem 
              title="Read Receipts" 
              subtitle="If turned off, you won't send or receive Read Receipts."
              rightContent={<Switch value={readReceipts} onValueChange={setReadReceipts} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
            <SettingItem title="Default Message Timer" subtitle="Off" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Connections" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem title="Groups" subtitle="Everyone" onPress={() => {}} />
            <SettingItem title="Live Location" subtitle="None" onPress={() => {}} />
            <SettingItem title="Calls" subtitle="Silence Unknown Callers" onPress={() => {}} />
            <SettingItem title="Blocked Contacts" subtitle="0" onPress={() => {}} isLast={true} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
