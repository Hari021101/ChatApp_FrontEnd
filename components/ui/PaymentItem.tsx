import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

interface PaymentItemProps {
  title: string;
  subtitle: string;
  amount: string;
  type: "send" | "receive";
  status: "Completed" | "Pending" | "Failed";
  timestamp: string;
}

export const PaymentItem = ({
  title,
  subtitle,
  amount,
  type,
  status,
  timestamp,
}: PaymentItemProps) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const colors = Colors[theme];

  const getStatusColor = () => {
    switch (status) {
      case "Completed":
        return colors.success;
      case "Failed":
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View
        style={[
          styles.iconBg,
          { backgroundColor: type === "send" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)" },
        ]}
      >
        <Ionicons
          name={type === "send" ? "arrow-up-outline" : "arrow-down-outline"}
          size={18}
          color={type === "send" ? colors.error : colors.success}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.mainRow}>
          <Text style={[styles.title, isDark && styles.textWhite]}>{title}</Text>
          <Text
            style={[
              styles.amount,
              { color: type === "send" ? colors.text : colors.success },
              isDark && type === "send" && styles.textWhite,
            ]}
          >
            {type === "send" ? "-" : "+"}
            {amount}
          </Text>
        </View>

        <View style={styles.subRow}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>{status}</Text>
        </View>

        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  containerDark: {
    borderBottomColor: "#17212b",
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#8e8e93",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
    color: "#8e8e93",
  },
  textWhite: {
    color: "#fff",
  },
});
