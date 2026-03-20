import React, { useState } from 'react';
import { ScrollView, View, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { SettingItem, SectionHeader, settingsStyles } from '../../components/ui/SettingsUI';
import { useAppTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function ChatSettingsScreen() {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme === 'dark';

  const [enterIsSend, setEnterIsSend] = useState(false);
  const [mediaVisibility, setMediaVisibility] = useState(true);
  const [keepArchived, setKeepArchived] = useState(true);

  return (
    <View style={[settingsStyles.container, isDark && settingsStyles.containerDark]}>
      <Stack.Screen options={{ title: 'Chats', headerBackTitleVisible: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.contentWrapper}>
          
          <SectionHeader title="Display" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem 
              icon="color-palette" color="#3498db" 
              title="Theme" 
              subtitle={isDark ? 'Dark' : 'Light'} 
              rightContent={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
              onPress={() => {}} 
            />
            <SettingItem icon="image" color="#e74c3c" title="Wallpaper" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Chat Settings" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem 
              title="Enter is send" 
              subtitle="Enter key will send your message"
              rightContent={<Switch value={enterIsSend} onValueChange={setEnterIsSend} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
            <SettingItem 
              title="Media visibility" 
              subtitle="Show newly downloaded media in your device's gallery"
              rightContent={<Switch value={mediaVisibility} onValueChange={setMediaVisibility} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
            <SettingItem title="Font size" subtitle="Medium" onPress={() => {}} isLast={true} />
          </View>

          <SectionHeader title="Archived Chats" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem 
              title="Keep chats archived" 
              subtitle="Archived chats will remain archived when you receive a new message"
              isLast={true}
              rightContent={<Switch value={keepArchived} onValueChange={setKeepArchived} trackColor={{ false: "#d1d1d6", true: Colors.light.primary }} />}
            />
          </View>
          
          <SectionHeader title="History & Backup" />
          <View style={[settingsStyles.settingsCard, isDark && settingsStyles.cardDark]}>
            <SettingItem icon="cloud-upload" color="#2ecc71" title="Chat backup" onPress={() => {}} />
            <SettingItem icon="phone-portrait" color="#9b59b6" title="Transfer chats" onPress={() => {}} />
            <SettingItem icon="time" color="#34495e" title="Chat history" onPress={() => {}} isLast={true} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
