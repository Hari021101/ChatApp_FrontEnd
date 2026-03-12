import {
    DarkTheme as NavDarkTheme,
    DefaultTheme as NavLightTheme,
    ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { onAuthStateChanged, User } from "@firebase/auth";
import { router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import "../config/firebase";
import { auth } from "../config/firebase";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToFirestore 
} from "../utils/notifications";
import * as Notifications from "expo-notifications";
import { useRef } from "react";
import { Platform } from "react-native";

import { setupPresenceListener } from "../utils/presence";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutContent() {
  const { theme } = useAppTheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const cleanup = setupPresenceListener(user.uid);
      
      // Register for push notifications
      registerForPushNotificationsAsync().then(token => {
        if (token) savePushTokenToFirestore(token);
      });

      // Background/Terminated notification listener
      if (Platform.OS !== "web") {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log("Notification Received:", notification);
        });

        // Notification click listener
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          const { id, type } = response.notification.request.content.data;
          if (id && type === "chat") {
            router.push(`/conversation/${id}`);
          }
        });
      }

      return () => {
        if (cleanup) cleanup();
        if (notificationListener.current) notificationListener.current.remove();
        if (responseListener.current) responseListener.current.remove();
      };
    }
  }, [user]);

  const segments = useSegments();

  useEffect(() => {
    if (!initializing) {
      const inTabs = segments[0] === "(tabs)";
      const inLogin = segments[0] === "login";

      if (user && !inTabs) {
        router.replace("/(tabs)");
      } else if (!user && !inLogin) {
        router.replace("/login");
      }
    }
  }, [user, initializing, segments]);

  if (initializing) return null;

  return (
    <NavThemeProvider value={theme === "dark" ? NavDarkTheme : NavLightTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
