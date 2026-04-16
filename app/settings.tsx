import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Platform,
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
    switch (action) {
      case "Account Settings":
        router.push("/settings/account");
        break;
      case "Privacy Settings":
        router.push("/settings/privacy");
        break;
      case "Chat Settings":
        router.push("/settings/chats");
        break;
      case "Notification Settings":
        router.push("/settings/notifications");
        break;
      case "Payments":
        router.push("/settings/payments");
        break;
      case "Help":
        router.push("/settings/help");
        break;
      case "Invite Friend":
        Alert.alert("Invite Friend", "Share link functionality will be here.");
        break;
      default:
        break;
    }
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
        pressed && !rightContent && (isDark ? styles.pressedDark : styles.pressed),
      ]}
      onPress={onPress}
      disabled={!!rightContent}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <View style={[styles.itemContent, !isLast && [styles.itemBorder, isDark && styles.itemBorderDark]]}>
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemTitle, isDark && styles.textDark]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.rightContainer}>
          {rightContent ? (
            rightContent
          ) : (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#555" : "#c7c7cc"}
            />
          )}
        </View>
      </View>
    </Pressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.navBar, isDark && styles.navBarDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color="#fff" />
          {Platform.OS === 'ios' && <Text style={[styles.backText, { color: "#fff" }]}>Back</Text>}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <Text style={[styles.largeTitle, isDark && styles.textDark]}>
            Settings
          </Text>

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
                  trackColor={{ false: "#d1d1d6", true: Colors.light.primary }}
                  thumbColor="#fff"
                />
              }
              isLast={true}
            />
          </View>

          <SectionHeader title="Account & Security" />
          <View style={[styles.settingsCard, isDark && styles.cardDark]}>
            <SettingItem
              icon="person"
              color="#34495e"
              title="Profile Settings"
              subtitle="Edit name, about, phone, photo"
              onPress={() => router.push("/profile")}
            />
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
              icon="notifications"
              color="#ff3b30"
              title="Notification Settings"
              onPress={() => handleAction("Notification Settings")}
            />
            <SettingItem
              icon="card"
              color="#4ade80"
              title="Payments"
              onPress={() => handleAction("Payments")}
              isLast={true}
            />
          </View>

          <View
            style={[
              styles.settingsCard,
              isDark && styles.cardDark,
              { marginTop: 35, marginBottom: 50 },
            ]}
          >
            <SettingItem
              icon="log-out"
              color="#ff3b30"
              title="Logout"
              onPress={() => Alert.alert("Logout", "Are you sure?")}
              isLast={true}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  containerDark: {
    backgroundColor: "#0e1621", // Telegram Deep Dark Background
  },
  navBar: {
    height: Platform.OS === "web" ? 70 : 100,
    paddingTop: Platform.OS === "web" ? 20 : 50,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
  },
  navBarDark: {
    backgroundColor: "#0e1621", // Telegram Deep Dark Background
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    fontSize: 17,
    marginLeft: -4,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    marginLeft: 16,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardDark: {
    backgroundColor: "#17212b", // Telegram Dark Surface
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    minHeight: 60,
  },
  pressed: {
    backgroundColor: "#e5e5ea",
  },
  pressedDark: {
    backgroundColor: "#202b36", // Telegram Pressed Dark
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 16,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
  },
  itemBorderDark: {
    borderColor: "#0e1621", // Telegram Border Dark
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  itemTitle: {
    fontSize: 17,
    color: "#000",
  },
  itemSubtitle: {
    fontSize: 15,
    color: "#8e8e93",
    marginTop: 2,
  },
  textDark: {
    color: "#fff",
  },
});
