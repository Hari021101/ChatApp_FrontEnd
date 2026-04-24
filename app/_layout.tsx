import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Drawer } from "expo-router/drawer";
import CustomDrawer from "../components/CustomDrawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { router, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  registerForPushNotificationsAsync,
  savePushTokenToBackend,
} from "../utils/notifications";
import * as Notifications from "expo-notifications";

import { setupPresenceListener } from "../utils/presence";
import { chatHub } from "../services/hub";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutContent() {
  const { theme } = useAppTheme();
  const { user, loading: initializing, token } = useAuth();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ── Presence + Push Notifications ─────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    // Presence: track online/offline via C# backend
    const cleanup = setupPresenceListener(user, token);

    // Register for push notifications
    registerForPushNotificationsAsync().then(async (pushToken) => {
      if (pushToken && token) {
        savePushTokenToBackend(pushToken, token);
      }
    });

    // Foreground notification listener (native only)
    if (Platform.OS !== "web") {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification Received:", notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const { id, type } = response.notification.request.content.data;
          if (id && type === "chat") {
            router.push(`/conversation/${id}`);
          }
        });
    }

    return () => {
      if (cleanup) cleanup();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, token]);

  // ── SignalR Connection ─────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      chatHub.startConnection(token);
    }
    return () => chatHub.stopConnection();
  }, [token]);

  // ── Auth Guard ─────────────────────────────────────────────────────────
  const segments = useSegments();

  useEffect(() => {
    if (!initializing) {
      const inLogin = segments[0] === "login";
      if (user && inLogin) {
        router.replace("/(tabs)");
      } else if (!user && !inLogin) {
        router.replace("/login");
      }
    }
  }, [user, initializing, segments]);

  if (initializing) return null;

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <NavThemeProvider value={theme === "dark" ? NavDarkTheme : NavLightTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme === "dark" ? "#17212b" : "#3390ec",
            },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
            drawerStyle: { width: "80%" },
            headerShown: false,
          }}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{ title: "Home", headerShown: false }}
          />
          <Drawer.Screen
            name="conversation/[id]"
            options={{ drawerItemStyle: { display: "none" }, headerShown: false }}
          />
          <Drawer.Screen
            name="login"
            options={{
              drawerItemStyle: { display: "none" },
              headerShown: false,
              swipeEnabled: false,
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
      <StatusBar style="light" />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
