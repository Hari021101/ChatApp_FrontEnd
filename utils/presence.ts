import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { AppState, AppStateStatus } from "react-native";
import { db } from "../config/firebase";

export const updatePresence = async (uid: string, isOnline: boolean) => {
  if (!uid) return;
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        isOnline,
        lastSeen: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error: any) {
    if (error.code === "permission-denied") {
      // Don't flood console with permission errors. One is enough.
      console.warn("Presence update failed: Permission denied. Please check Firestore rules.");
    } else {
      console.error("Error updating presence:", error);
    }
  }
};

export const setupPresenceListener = (uid: string) => {
  if (!uid) return;

  // Initial update
  updatePresence(uid, true);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      updatePresence(uid, true);
    } else {
      updatePresence(uid, false);
    }
  };

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange,
  );

  return () => {
    subscription.remove();
    updatePresence(uid, false);
  };
};
