import React, { useState } from 'react';
import { ScrollView, View, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { SettingItem, SectionHeader, settingsStyles } from '../../components/ui/SettingsUI';
import { useAppTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function NotificationSettingsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  const [conversationTones, setConversationTones] = useState(true);
  const [highPriority, setHighPriority] = useState(true);

  return (
    <View style={[settingsStyles.container, isDark && settingsStyles.containerDark]}>
      <Stack.Screen options={{ title: 'Notifications', headerBackTitleVisible: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.contentWrapper}>
          
          <SectionHeader title="Message Notifications" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem 
              title="Conversation tones" 
              subtitle="Play sounds for incoming and outgoing messages."
              rightContent={<Switch value={conversationTones} onValueChange={setConversationTones} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
            <SettingItem title="Notification tone" subtitle="Default (Aurora)" onPress={() => {}} />
            <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} />
            <SettingItem title="Light" subtitle="White" onPress={() => {}} />
            <SettingItem 
              title="Use high priority notifications" 
              subtitle="Show previews of notifications at the top of the screen"
              isLast={true}
              rightContent={<Switch value={highPriority} onValueChange={setHighPriority} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
          </View>

          <SectionHeader title="Group Notifications" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem title="Notification tone" subtitle="Default (Aurora)" onPress={() => {}} />
            <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} />
            <SettingItem title="Light" subtitle="White" onPress={() => {}} />
            <SettingItem 
              title="Use high priority notifications" 
              subtitle="Show previews of notifications at the top of the screen"
              isLast={true}
              rightContent={<Switch value={highPriority} onValueChange={setHighPriority} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
          </View>
          
          <SectionHeader title="Calls" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem title="Ringtone" subtitle="Default" onPress={() => {}} />
            <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} isLast={true} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
