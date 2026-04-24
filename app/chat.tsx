import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { HubConnectionState } from "@microsoft/signalr";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SearchUsers from "../components/SearchUsers";
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { chatHub } from "../services/hub";
import { API_URL } from "../config/api";

type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: any;
  unread: number;
  online: boolean;
  participants: string[];
  isGroup?: boolean;
  avatarUrl?: string | null;
};

export default function ChatScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const { user, token } = useAuth();
  const navigation = useNavigation();

  const toggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const [chats, setChats] = useState<Chat[]>([]);
  const [serverStatus, setServerStatus] = useState<HubConnectionState>(
    chatHub.getConnectionState(),
  );

  useEffect(() => {
    // Sync initial state
    setServerStatus(chatHub.getConnectionState());

    // Listen for changes
    chatHub.onConnectionStateChange((newState) => {
      setServerStatus(newState);
    });
  }, []);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchChats = async () => {
      try {
        const response = await fetch(`${API_URL}/Chats/user/${user.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const mappedChats: Chat[] = data.map((c: any) => {
            const otherParticipant = c.participants.find((p: any) => p.userId !== user.id);
            return {
              id: c.id,
              name: c.isGroup ? c.title : (otherParticipant?.displayName || "Chat"),
              avatar: (c.isGroup ? c.title : (otherParticipant?.displayName || "C")).charAt(0).toUpperCase(),
              avatarUrl: c.isGroup ? c.imageURL : (otherParticipant?.photoURL || null),
              isGroup: c.isGroup,
              lastMessage: c.lastMessage || "",
              timestamp: new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              unread: c.unreadCount || 0,
              online: false,
              participants: c.participants.map((p: any) => p.userId),
            };
          });
          setChats(mappedChats);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Listen for real-time new messages to bump unread count in the list
    chatHub.onReceiveMessage((chatId: string, senderId: string) => {
      if (senderId !== user.id) {
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, unread: chat.unread + 1 }
            : chat
        ));
      }
    });

    // Listen for real-time presence updates
    chatHub.onPresenceUpdate((userId: string, isOnline: boolean) => {
      setChats(prev => prev.map(chat => {
        if (!chat.isGroup && chat.participants.includes(userId)) {
          return { ...chat, online: isOnline };
        }
        return chat;
      }));
    });

    // Refresh every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChatPress = (chat: Chat) => {
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
        <View
          style={[
            styles.avatar,
            item.isGroup && { backgroundColor: "#FF9500" },
            isDark && styles.avatarDark,
          ]}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.avatar}</Text>
          )}
        </View>
        {item.online && !item.isGroup && (
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

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          isDark && styles.containerDark,
          styles.centered,
        ]}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Waiting for network... 🔄</Text>
        </View>
      )}
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.hamburgerBtn}>
            <Ionicons name="menu" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>
            Chats
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addChatBtn}
              onPress={() => fetchChats()}
            >
              <Text style={styles.addChatIcon}>🐛</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addChatBtn}
              onPress={() => setShowSearch(true)}
            >
              <Text style={styles.addChatIcon}>+</Text>
            </TouchableOpacity>
            {/* C# Server Status Indicator */}
            <View style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: serverStatus === HubConnectionState.Connected ? "#4ade80" : "#fb7185",
              marginLeft: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)"
            }} />
          </View>
        </View>
        <View
          style={[styles.searchContainer, isDark && styles.searchContainerDark]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? "#8e8e93" : "#64748b"}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? "#8e8e93" : "#999"}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? "#8e8e93" : "#999"}
              />
            </Pressable>
          )}
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

      <SearchUsers
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onChatCreated={(chatId: string, otherUserName: string) => {
          router.push(
            `/conversation/${chatId}?name=${encodeURIComponent(otherUserName)}`,
          );
        }}
        currentUserId={user?.id || ""}
        currentUserName={user?.displayName || "User"}
        isDark={isDark}
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
    backgroundColor: "#0e1621",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerDark: {
    backgroundColor: "#17212b",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  hamburgerBtn: {
    marginRight: 20,
  },
  addChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  addChatIcon: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "300",
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Glassy elevated effect against blue
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Smooth depth
    elevation: 2,
  },
  searchContainerDark: {
    backgroundColor: "#1c242d", // Deep separation layer for dark mode
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    marginLeft: 8,
    ...(Platform.OS === "web" && ({ outlineStyle: "none" } as any)),
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
    backgroundColor: "#0e1621",
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
    overflow: "hidden", // Added this to clip image to circle
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
  offlineBanner: {
    backgroundColor: "#FF9500",
    paddingVertical: 5,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});
