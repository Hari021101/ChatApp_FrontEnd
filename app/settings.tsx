import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme === "dark";

  const handleAction = (action: string) => {
    Alert.alert(action, `${action} functionality will be implemented here.`);
  };

  const SettingItem = ({
    icon,
    color,
    title,
    subtitle,
    onPress,
    rightContent,
    isLast = false,
  }: {
    icon: string;
    color: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightContent?: React.ReactNode;
    isLast?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && !rightContent && styles.pressed,
        !isLast && styles.itemBorder,
      ]}
      onPress={onPress}
      disabled={!!rightContent}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, isDark && styles.textDark]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightContent ? (
        rightContent
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#555" : "#ccc"}
        />
      )}
    </Pressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          Settings
        </Text>
      </View>

      <View style={[styles.settingsCard, isDark && styles.cardDark]}>
        <SettingItem
          icon="moon"
          color="#34495e"
          title="Dark Mode"
          subtitle={isDark ? "On" : "Off"}
          rightContent={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ccc", true: Colors.light.primary }}
              thumbColor="#fff"
            />
          }
        />
      </View>

      <SectionHeader title="Account & Security" />
      <View style={[styles.settingsCard, isDark && styles.cardDark]}>
        <SettingItem
          icon="key"
          color="#3498db"
          title="Account"
          subtitle="Privacy, security, change number"
          onPress={() => handleAction("Account Settings")}
        />
        <SettingItem
          icon="lock-closed"
          color="#e67e22"
          title="Privacy"
          subtitle="Last seen, profile photo, status"
          onPress={() => handleAction("Privacy Settings")}
          isLast={true}
        />
      </View>

      <SectionHeader title="Messages & Notifications" />
      <View style={[styles.settingsCard, isDark && styles.cardDark]}>
        <SettingItem
          icon="chatbubbles"
          color="#27ae60"
          title="Chats"
          subtitle="Theme, wallpapers, chat history"
          onPress={() => handleAction("Chat Settings")}
        />
        <SettingItem
          icon="notifications"
          color="#e74c3c"
          title="Notifications"
          subtitle="Message, group & call tones"
          onPress={() => handleAction("Notification Settings")}
          isLast={true}
        />
      </View>

      <SectionHeader title="Other" />
      <View style={[styles.settingsCard, isDark && styles.cardDark]}>
        <SettingItem
          icon="help-circle"
          color="#9b59b6"
          title="Help"
          subtitle="Help center, contact us, privacy policy"
          onPress={() => handleAction("Help")}
        />
        <SettingItem
          icon="people"
          color="#f1c40f"
          title="Invite a friend"
          onPress={() => handleAction("Invite Friend")}
          isLast={true}
        />
      </View>

      <View
        style={[
          styles.settingsCard,
          isDark && styles.cardDark,
          { marginTop: 30, marginBottom: 50 },
        ]}
      >
        <SettingItem
          icon="log-out"
          color="#d63031"
          title="Logout"
          onPress={() => Alert.alert("Logout", "Are you sure?")}
          isLast={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerDark: {
    backgroundColor: "#1c1c1e",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
  },
  cardDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#38383a",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  pressed: {
    backgroundColor: "#f2f2f7",
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
    marginLeft: 52,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    color: "#000",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 2,
  },
  textDark: {
    color: "#fff",
  },
});
