import {
    DarkTheme as NavDarkTheme,
    DefaultTheme as NavLightTheme,
    ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { Drawer } from "expo-router/drawer";
import CustomDrawer from "../components/CustomDrawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { chatHub } from "../services/hub";

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

  // Handle SignalR Connection Lifecycle
  useEffect(() => {
    chatHub.startConnection();
    return () => {
      chatHub.stopConnection();
    };
  }, []);

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
            headerTitleStyle: {
              fontWeight: "bold",
            },
            drawerStyle: {
              width: "80%",
            },
            headerShown: false, // We'll handle headers in screens or Stack
          }}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{
              title: "Home",
              headerShown: false,
            }}
          />
          {/* We keep other screens in Stack for better navigation flow */}
          <Drawer.Screen
            name="conversation/[id]"
            options={{
              drawerItemStyle: { display: "none" },
              headerShown: false,
            }}
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
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
