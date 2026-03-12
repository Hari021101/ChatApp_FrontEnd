import { router } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import SearchUsers from "../components/SearchUsers";
import { auth, db } from "../config/firebase";
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

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
};

export default function ChatScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const user = auth.currentUser;

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribeConnection = onSnapshot(doc(db, ".info/connected"), (snapshot) => {
      setIsConnected(snapshot.data()?.connected ?? true);
    });
    return () => unsubscribeConnection();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to chats where the current user is a participant
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatPromises = snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const isGroup = data.isGroup || false;
          let chatName = "Chat";
          let chatAvatar = "C";
          let isOnline = false;

          if (isGroup) {
            chatName = data.groupName || "Group";
            chatAvatar = chatName.charAt(0).toUpperCase();
            // Optional: You could count online members here, but for now we'll leave it false
          } else {
            const otherId = data.participants.find(
              (p: string) => p !== user.uid,
            );
            chatName = data.participantNames?.[otherId] || "Chat";
            chatAvatar = chatName.charAt(0).toUpperCase();

            if (otherId) {
              const userSnap = await getDoc(doc(db, "users", otherId));
              if (userSnap.exists()) {
                const userData = userSnap.data() as { isOnline?: boolean };
                isOnline = userData.isOnline || false;
              }
            }
          }

          return {
            id: chatDoc.id,
            name: chatName,
            avatar: chatAvatar,
            isGroup,
            lastMessage: data.lastMessage || "",
            timestamp: data.updatedAt
              ? data.updatedAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "...",
            unread: data.unreadCounts?.[user.uid] || 0,
            online: isOnline,
            participants: data.participants,
          } as Chat;
        });

        Promise.all(chatPromises).then((chatList) => {
          setChats(chatList);
          setLoading(false);
        });
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

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
          <Text style={styles.avatarText}>{item.avatar}</Text>
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
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>
            Chats
          </Text>
          <TouchableOpacity
            style={styles.addChatBtn}
            onPress={() => setShowSearch(true)}
          >
            <Text style={styles.addChatIcon}>+</Text>
          </TouchableOpacity>
        </View>
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

      <SearchUsers
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onChatCreated={(chatId: string, otherUserName: string) => {
          router.push(
            `/conversation/${chatId}?name=${encodeURIComponent(otherUserName)}`,
          );
        }}
        currentUserId={user?.uid || ""}
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
    backgroundColor: "#000000",
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
    backgroundColor: "#1c1c1e",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
