import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textDark]}>
        Welcome, Hari!
      </Text>
      <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
        Navigate to any section:
      </Text>

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, isDark && styles.buttonDark]}
          onPress={() => router.push("/profile")}
        >
          <Text style={[styles.buttonText, isDark && styles.textDark]}>
            👤 Profile
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, isDark && styles.buttonDark]}
          onPress={() => router.push("/chat")}
        >
          <Text style={[styles.buttonText, isDark && styles.textDark]}>
            💬 Chat
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, isDark && styles.buttonDark]}
          onPress={() => router.push("/calls")}
        >
          <Text style={[styles.buttonText, isDark && styles.textDark]}>
            📞 Calls
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, isDark && styles.buttonDark]}
          onPress={() => router.push("/settings")}
        >
          <Text style={[styles.buttonText, isDark && styles.textDark]}>
            ⚙️ Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    padding: 20,
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 40,
    opacity: 0.9,
  },
  textDark: {
    color: "#ffffff",
  },
  textMutedDark: {
    color: "#8e8e93",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    gap: 15,
  },
  button: {
    padding: 18,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    alignItems: "center",
    boxShadow: "0 2 3.84 rgba(0, 0, 0, 0.25)",
    elevation: 5,
  },
  buttonDark: {
    backgroundColor: "#1c1c1e",
    boxShadow: "0 2 3.84 rgba(0, 0, 0, 0.5)",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.primary,
  },
});
