import { useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

// Mock call history data
type CallType = "incoming" | "outgoing" | "missed";

type Call = {
  id: string;
  name: string;
  avatar: string;
  type: CallType;
  timestamp: string;
  duration: string;
  isVideo: boolean;
};

const callHistory: Call[] = [
  {
    id: "1",
    name: "Priya Kumar",
    avatar: "P",
    type: "incoming",
    timestamp: "Today, 2:30 PM",
    duration: "12:34",
    isVideo: false,
  },
  {
    id: "2",
    name: "Rahul Sharma",
    avatar: "R",
    type: "outgoing",
    timestamp: "Today, 11:15 AM",
    duration: "05:22",
    isVideo: true,
  },
  {
    id: "3",
    name: "Anjali Patel",
    avatar: "A",
    type: "missed",
    timestamp: "Yesterday, 9:45 PM",
    duration: "Missed",
    isVideo: false,
  },
  {
    id: "4",
    name: "Dev Team",
    avatar: "D",
    type: "incoming",
    timestamp: "Yesterday, 3:20 PM",
    duration: "45:12",
    isVideo: true,
  },
  {
    id: "5",
    name: "Neha Singh",
    avatar: "N",
    type: "outgoing",
    timestamp: "Yesterday, 1:00 PM",
    duration: "08:56",
    isVideo: false,
  },
  {
    id: "6",
    name: "Vikram Reddy",
    avatar: "V",
    type: "missed",
    timestamp: "2 days ago, 7:30 PM",
    duration: "Missed",
    isVideo: false,
  },
  {
    id: "7",
    name: "Mom",
    avatar: "M",
    type: "incoming",
    timestamp: "2 days ago, 6:15 PM",
    duration: "23:45",
    isVideo: true,
  },
  {
    id: "8",
    name: "Office",
    avatar: "O",
    type: "outgoing",
    timestamp: "3 days ago, 10:00 AM",
    duration: "15:30",
    isVideo: false,
  },
];

export default function CallsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [calls] = useState(callHistory);

  const getCallIcon = (type: CallType) => {
    switch (type) {
      case "incoming":
        return "📞";
      case "outgoing":
        return "📱";
      case "missed":
        return "📵";
      default:
        return "📞";
    }
  };

  const getCallColor = (type: CallType) => {
    switch (type) {
      case "incoming":
        return "#4CAF50";
      case "outgoing":
        return "#2196F3";
      case "missed":
        return "#F44336";
      default:
        return isDark ? "#8e8e93" : "#666";
    }
  };

  const handleCallPress = (call: Call) => {
    Alert.alert("Call Action", `Call ${call.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: call.isVideo ? "Video Call" : "Voice Call",
        onPress: () => Alert.alert("Calling", `Calling ${call.name}...`),
      },
    ]);
  };

  const renderCallItem = ({ item }: { item: Call }) => (
    <Pressable
      style={[styles.callItem, isDark && styles.callItemDark]}
      onPress={() => handleCallPress(item)}
      android_ripple={{ color: isDark ? "#333" : "#e0e0e0" }}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
      </View>

      <View style={styles.callContent}>
        <View style={styles.callHeader}>
          <View style={styles.nameRow}>
            <Text style={[styles.callName, isDark && styles.textDark]}>
              {item.name}
            </Text>
            {item.isVideo && <Text style={styles.videoIcon}>📹</Text>}
          </View>
        </View>
        <View style={styles.callDetails}>
          <Text style={[styles.callType, { color: getCallColor(item.type) }]}>
            {getCallIcon(item.type)}{" "}
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={[styles.dot, isDark && styles.textMutedDark]}>•</Text>
          <Text style={[styles.timestamp, isDark && styles.textMutedDark]}>
            {item.timestamp}
          </Text>
        </View>
      </View>

      <View style={styles.callActions}>
        <Text
          style={[
            styles.duration,
            item.type === "missed" && styles.missedDuration,
            isDark && item.type !== "missed" && styles.textMutedDark,
          ]}
        >
          {item.duration}
        </Text>
        <Pressable
          style={[styles.callButton, isDark && styles.callButtonDark]}
          onPress={() => handleCallPress(item)}
        >
          <Text style={styles.callButtonIcon}>📞</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          Calls
        </Text>
        <Text style={[styles.headerSubtitle, isDark && styles.textMutedDark]}>
          {calls.filter((c) => c.type === "missed").length} missed calls
        </Text>
      </View>

      {/* Call History List */}
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, isDark && styles.separatorDark]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerDark: {
    backgroundColor: "#1c1c1e",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  listContainer: {
    paddingBottom: 20,
  },
  callItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  callItemDark: {
    backgroundColor: "#000000",
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarDark: {
    backgroundColor: Colors.light.primary,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  callContent: {
    flex: 1,
  },
  callHeader: {
    marginBottom: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  videoIcon: {
    fontSize: 16,
  },
  callDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callType: {
    fontSize: 14,
    fontWeight: "500",
  },
  dot: {
    fontSize: 12,
    color: "#999",
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  callActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  duration: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  missedDuration: {
    color: "#F44336",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  callButtonDark: {
    backgroundColor: Colors.light.primary,
  },
  callButtonIcon: {
    fontSize: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginLeft: 80,
  },
  separatorDark: {
    backgroundColor: "#1c1c1e",
  },
  textDark: {
    color: "#ffffff",
  },
  textMutedDark: {
    color: "#8e8e93",
  },
});
