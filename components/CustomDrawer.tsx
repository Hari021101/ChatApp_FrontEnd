import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { auth } from "../config/firebase";
import { router } from "expo-router";

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const user = auth.currentUser;

  const menuItems = [
    { icon: "person-outline", label: "My Profile", route: "/profile" },
    { icon: "chatbubble-outline", label: "New Group", action: () => {} },
    { icon: "people-outline", label: "Contacts", action: () => {} },
    { icon: "call-outline", label: "Calls", route: "/calls" },
    { icon: "bookmark-outline", label: "Saved Messages", action: () => {} },
    { icon: "settings-outline", label: "Settings", route: "/settings" },
  ];

  const handleNavigation = (item: any) => {
    if (item.route) {
      router.push(item.route);
      props.navigation.closeDrawer();
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Drawer Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0) || "U"}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.themeToggle}>
             {/* This could be a theme switch icon */}
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.displayName || "User"}</Text>
        <Text style={styles.userPhone}>{user?.email || "No email"}</Text>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleNavigation(item)}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={isDark ? "#b1b3b5" : "#707579"}
              style={styles.menuIcon}
            />
            <Text style={[styles.menuLabel, isDark && styles.textDark]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={[styles.separator, isDark && styles.separatorDark]} />
        
        <TouchableOpacity style={styles.menuItem} onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={24} color="#eb3b5a" style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: "#eb3b5a" }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Telegram for React Native</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerDark: {
    backgroundColor: "#17212b",
  },
  header: {
    backgroundColor: "#3390ec",
    padding: 20,
    paddingTop: 50,
  },
  headerDark: {
    backgroundColor: "#242f3d",
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  themeToggle: {
    padding: 5,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userPhone: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 25,
    width: 24,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  textDark: {
    color: "#fff",
  },
  separator: {
    height: 1,
    backgroundColor: "#f4f4f4",
    marginVertical: 10,
  },
  separatorDark: {
    backgroundColor: "#0e1621",
  },
  footer: {
    padding: 20,
    borderTopWidth: 0,
  },
  footerText: {
    color: "#707579",
    fontSize: 12,
  },
  versionText: {
    color: "#707579",
    fontSize: 10,
    marginTop: 2,
  },
});
