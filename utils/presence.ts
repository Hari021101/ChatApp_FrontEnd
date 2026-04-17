import { API_URL } from "../config/api";
import { UserProfile } from "../services/authService";

/**
 * Update presence via C# backend → PUT /api/Users/{id}/presence
 */
export const updatePresence = async (
  userId: string,
  isOnline: boolean,
  token: string
) => {
  if (!userId || !token) return;
  try {
    await fetch(`${API_URL}/Users/${userId}/presence`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isOnline }),
    });
  } catch (error) {
    console.error("Error updating presence:", error);
  }
};

/**
 * Listen to app foreground/background and sync presence to backend.
 * Returns a cleanup function.
 */
export const setupPresenceListener = (user: UserProfile, token: string) => {
  if (!user?.id || !token) return;

  const { AppState, AppStateStatus } = require("react-native");

  // Mark online on start
  updatePresence(user.id, true, token);

  const handleAppStateChange = (nextAppState: string) => {
    updatePresence(user.id, nextAppState === "active", token);
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  return () => {
    subscription.remove();
    updatePresence(user.id, false, token);
  };
};
