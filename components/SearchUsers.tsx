import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    getDocs,
    limit,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../config/firebase";
import { Colors } from "../constants/theme";
import CreateGroup from "./CreateGroup";

interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string, otherUserName: string) => void;
  currentUserId: string;
  currentUserName: string;
  isDark: boolean;
}

export default function SearchUsers({
  visible,
  onClose,
  onChatCreated,
  currentUserId,
  currentUserName,
  isDark,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      // Search by email exact match or name prefix
      const q = query(
        usersRef,
        where("email", ">=", text.toLowerCase()),
        where("email", "<=", text.toLowerCase() + "\uf8ff"),
        limit(10),
      );

      const querySnapshot = await getDocs(q);
      const results: User[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) {
          results.push({ id: doc.id, ...doc.data() } as User);
        }
      });
      setUsers(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (selectedUser: User) => {
    setLoading(true);
    try {
      // 1. Check for existing chat
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", currentUserId),
      );

      const querySnapshot = await getDocs(q);
      let existingChatId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(selectedUser.id)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        onChatCreated(existingChatId, selectedUser.name);
        onClose();
        return;
      }

      // 2. Create new chat if not exists
      const newChatDoc = await addDoc(collection(db, "chats"), {
        participants: [currentUserId, selectedUser.id],
        participantNames: {
          [currentUserId]: currentUserName,
          [selectedUser.id]: selectedUser.name,
        },
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });

      onChatCreated(newChatDoc.id, selectedUser.name);
      onClose();
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Pressable
      style={[styles.userItem, isDark && styles.userItemDark]}
      onPress={() => startChat(item)}
    >
      <View style={styles.avatar}>
        {item.profileImage ? (
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isDark && styles.textDark]}>
          {item.name}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Ionicons
        name="chatbubble-outline"
        size={24}
        color={Colors.light.primary}
      />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={isDark ? "#fff" : "#000"} />
          </Pressable>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>
            New Chat
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View
          style={[styles.searchContainer, isDark && styles.searchContainerDark]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? "#8e8e93" : "#999"}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder="Search by name or email..."
            placeholderTextColor={isDark ? "#8e8e93" : "#999"}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <Pressable
                style={[styles.userItem, isDark && styles.userItemDark]}
                onPress={() => setShowCreateGroup(true)}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: Colors.light.primary },
                  ]}
                >
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      { color: Colors.light.primary },
                      isDark && styles.textDark,
                    ]}
                  >
                    New Group
                  </Text>
                  <Text style={styles.userEmail}>
                    Create a chat with multiple people
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>
            }
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              searchQuery.length >= 3 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              ) : (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>
                    Type at least 3 characters to search
                  </Text>
                </View>
              )
            }
          />
        )}

        <CreateGroup
          visible={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(id, name) => {
            onChatCreated(id, name);
            onClose();
          }}
          availableUsers={users}
          isDark={isDark}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerDark: {
    borderBottomColor: "#1c1c1e",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchContainerDark: {
    backgroundColor: "#1c1c1e",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userItemDark: {
    borderBottomColor: "#1c1c1e",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: "#8e8e93",
    fontSize: 16,
  },
  textDark: {
    color: "#fff",
  },
});
