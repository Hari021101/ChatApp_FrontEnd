import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

// Mock chat data
type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
};

const chatData: Chat[] = [
  {
    id: "1",
    name: "Priya Kumar",
    avatar: "P",
    lastMessage: "Hey! Are we meeting tomorrow?",
    timestamp: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Rahul Sharma",
    avatar: "R",
    lastMessage: "Thanks for the help!",
    timestamp: "1h ago",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Anjali Patel",
    avatar: "A",
    lastMessage: "Can you send me the files?",
    timestamp: "3h ago",
    unread: 5,
    online: false,
  },
  {
    id: "4",
    name: "Dev Team",
    avatar: "D",
    lastMessage: "Meeting at 3 PM today",
    timestamp: "5h ago",
    unread: 0,
    online: false,
  },
  {
    id: "5",
    name: "Neha Singh",
    avatar: "N",
    lastMessage: "See you tomorrow! 👋",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "6",
    name: "Vikram Reddy",
    avatar: "V",
    lastMessage: "Great presentation today!",
    timestamp: "Yesterday",
    unread: 1,
    online: true,
  },
  {
    id: "7",
    name: "Family Group",
    avatar: "F",
    lastMessage: "Mom: Dinner plans?",
    timestamp: "2 days ago",
    unread: 0,
    online: false,
  },
];

export default function ChatScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [chats, setChats] = useState(chatData);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChatPress = (chat: Chat) => {
    // Mark as read
    setChats(chats.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
    // Navigate to conversation
    router.push(
      `/conversation/${chat.id}?name=${encodeURIComponent(chat.name)}`,
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <Pressable
      style={[styles.chatItem, isDark && styles.chatItemDark]}
      onPress={() => handleChatPress(item)}
      android_ripple={{ color: isDark ? "#333" : "#e0e0e0" }}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        {item.online && (
          <View
            style={[
              styles.onlineIndicator,
              isDark && styles.onlineIndicatorDark,
            ]}
          />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, isDark && styles.textDark]}>
            {item.name}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.unreadMessage,
              isDark && item.unread > 0 && styles.unreadTextDark,
              isDark && item.unread === 0 && styles.textMutedDark,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View
              style={[styles.unreadBadge, isDark && styles.unreadBadgeDark]}
            >
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          Chats
        </Text>
        <View
          style={[styles.searchContainer, isDark && styles.searchContainerDark]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? "#8e8e93" : "#999"}
          />
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, isDark && styles.separatorDark]} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
              No chats found
            </Text>
          </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerDark: {
    backgroundColor: "#1c1c1e",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchContainerDark: {
    backgroundColor: "#2c2c2e",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  chatItemDark: {
    backgroundColor: "#000000",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarDark: {
    backgroundColor: Colors.light.primary,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  onlineIndicatorDark: {
    borderColor: "#000000",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  timestamp: {
    fontSize: 12,
    color: "#8e8e93",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: 15,
    color: "#666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#000000",
  },
  unreadTextDark: {
    color: "#ffffff",
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadBadgeDark: {
    backgroundColor: Colors.light.primary,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginLeft: 85,
  },
  separatorDark: {
    backgroundColor: "#1c1c1e",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  textDark: {
    color: "#ffffff",
  },
  textMutedDark: {
    color: "#8e8e93",
  },
});
