import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { db, auth } from "../config/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

// Show notifications even when the app is in foreground
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    
    // Learn more about projectId:
    // https://docs.expo.dev/versions/latest/sdk/notifications/
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.log("No Project ID found. Skipping push token registration.");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Expo Push Token:", token);
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

export async function savePushTokenToFirestore(token: string) {
  const user = auth.currentUser;
  if (!user || !token) return;

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      pushTokens: arrayUnion(token),
      updatedAt: new Date(),
    });
    console.log("Push token saved to Firestore");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}
