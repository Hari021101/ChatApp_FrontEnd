import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

// Mock messages data
type Message = {
  id: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  isEdited?: boolean;
  editedAt?: string;
};

// Mock data for different conversations
const conversationData: {
  [key: string]: { name: string; messages: Message[] };
} = {
  "1": {
    name: "Priya Kumar",
    messages: [
      {
        id: "1",
        text: "Hey! How are you?",
        timestamp: "10:30 AM",
        isMine: false,
      },
      {
        id: "2",
        text: "I'm good! How about you?",
        timestamp: "10:32 AM",
        isMine: true,
      },
      {
        id: "3",
        text: "Great! Are we meeting tomorrow?",
        timestamp: "10:35 AM",
        isMine: false,
      },
    ],
  },
  "2": {
    name: "Rahul Sharma",
    messages: [
      {
        id: "1",
        text: "Can you help me with the project?",
        timestamp: "Yesterday",
        isMine: false,
      },
      {
        id: "2",
        text: "Sure! What do you need?",
        timestamp: "Yesterday",
        isMine: true,
      },
      {
        id: "3",
        text: "Thanks for the help!",
        timestamp: "2:30 PM",
        isMine: false,
      },
    ],
  },
  "3": {
    name: "Anjali Patel",
    messages: [
      {
        id: "1",
        text: "Hi Hari!",
        timestamp: "9:00 AM",
        isMine: false,
      },
      {
        id: "2",
        text: "Hello! What's up?",
        timestamp: "9:05 AM",
        isMine: true,
      },
      {
        id: "3",
        text: "Can you send me the files?",
        timestamp: "9:10 AM",
        isMine: false,
      },
    ],
  },
  "4": {
    name: "Dev Team",
    messages: [
      {
        id: "1",
        text: "Team standup in 10 minutes",
        timestamp: "9:50 AM",
        isMine: false,
      },
      {
        id: "2",
        text: "Meeting at 3 PM today",
        timestamp: "2:45 PM",
        isMine: false,
      },
    ],
  },
  "5": {
    name: "Neha Singh",
    messages: [
      {
        id: "1",
        text: "See you tomorrow! 👋",
        timestamp: "Yesterday",
        isMine: false,
      },
      {
        id: "2",
        text: "Yes, see you! 😊",
        timestamp: "Yesterday",
        isMine: true,
      },
    ],
  },
  "6": {
    name: "Vikram Reddy",
    messages: [
      {
        id: "1",
        text: "Great presentation today!",
        timestamp: "Yesterday",
        isMine: false,
      },
    ],
  },
  "7": {
    name: "Family Group",
    messages: [
      {
        id: "1",
        text: "Mom: Dinner plans?",
        timestamp: "2 days ago",
        isMine: false,
      },
      {
        id: "2",
        text: "I'll be there at 7 PM",
        timestamp: "2 days ago",
        isMine: true,
      },
    ],
  },
};

export default function ConversationScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const conversation = conversationData[id] || {
    name: name || "Chat",
    messages: [],
  };

  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const handleSend = () => {
    if (newMessage.trim()) {
      if (editingMessage) {
        // Update existing message
        setMessages(
          messages.map((msg) =>
            msg.id === editingMessage.id
              ? {
                  ...msg,
                  text: newMessage.trim(),
                  isEdited: true,
                  editedAt: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : msg,
          ),
        );
        setEditingMessage(null);
      } else {
        // Add new message
        const message: Message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: true,
        };
        setMessages([...messages, message]);
      }
      setNewMessage("");
    }
  };

  const handleLongPress = (message: Message) => {
    if (message.isMine) {
      setSelectedMessage(message);
      setShowActionMenu(true);
    }
  };

  const handleEdit = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setNewMessage(selectedMessage.text);
      setShowActionMenu(false);
      setSelectedMessage(null);
    }
  };

  const handleDelete = () => {
    if (selectedMessage) {
      setMessages(messages.filter((msg) => msg.id !== selectedMessage.id));
      setShowActionMenu(false);
      setSelectedMessage(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Pressable onLongPress={() => handleLongPress(item)} delayLongPress={500}>
      <View
        style={[
          styles.messageBubble,
          item.isMine
            ? styles.myMessage
            : [styles.theirMessage, isDark && styles.theirMessageDark],
          editingMessage?.id === item.id && styles.editingHighlight,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isMine
              ? styles.myMessageText
              : [styles.theirMessageText, isDark && styles.textDark],
          ]}
        >
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.timestamp,
              item.isMine
                ? styles.myTimestamp
                : [styles.theirTimestamp, isDark && styles.textMutedDark],
            ]}
          >
            {item.timestamp}
          </Text>
          {item.isEdited && (
            <Text
              style={[
                styles.editedLabel,
                item.isMine
                  ? styles.myEditedLabel
                  : [styles.theirEditedLabel, isDark && styles.textMutedDark],
              ]}
            >
              {" "}
              (edited)
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={[styles.avatar, isDark && styles.avatarDark]}>
            <Text style={[styles.avatarText, isDark && styles.avatarTextDark]}>
              {conversation.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.headerName, isDark && styles.textDark]}>
              {conversation.name}
            </Text>
            <Text style={[styles.headerStatus, isDark && styles.textMutedDark]}>
              Online
            </Text>
          </View>
        </View>
        <Pressable style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋮</Text>
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />

      {/* Edit Mode Banner */}
      {editingMessage && (
        <View style={[styles.editBanner, isDark && styles.editBannerDark]}>
          <View style={styles.editBannerContent}>
            <Text style={styles.editBannerIcon}>✏️</Text>
            <Text
              style={[
                styles.editBannerText,
                isDark && styles.editBannerTextDark,
              ]}
            >
              Editing message...
            </Text>
          </View>
          <Pressable onPress={handleCancelEdit} style={styles.cancelEditButton}>
            <Text
              style={[
                styles.cancelEditIcon,
                isDark && styles.editBannerTextDark,
              ]}
            >
              ✕
            </Text>
          </Pressable>
        </View>
      )}

      {/* Input Area */}
      <View
        style={[styles.inputContainer, isDark && styles.inputContainerDark]}
      >
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholderTextColor={isDark ? "#8e8e93" : "#999"}
          multiline
        />
        <Pressable
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendIcon}>{editingMessage ? "✓" : "➤"}</Text>
        </Pressable>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenu, isDark && styles.actionMenuDark]}>
            <Pressable style={styles.actionMenuItem} onPress={handleEdit}>
              <Text style={styles.actionMenuIcon}>✏️</Text>
              <Text style={[styles.actionMenuText, isDark && styles.textDark]}>
                Edit Message
              </Text>
            </Pressable>
            <View
              style={[
                styles.actionMenuDivider,
                isDark && styles.actionMenuDividerDark,
              ]}
            />
            <Pressable style={styles.actionMenuItem} onPress={handleDelete}>
              <Text style={styles.actionMenuIcon}>🗑️</Text>
              <Text style={[styles.actionMenuText, styles.deleteText]}>
                Delete Message
              </Text>
            </Pressable>
            <View
              style={[
                styles.actionMenuDivider,
                isDark && styles.actionMenuDividerDark,
              ]}
            />
            <Pressable
              style={styles.actionMenuItem}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={styles.actionMenuIcon}>✕</Text>
              <Text style={[styles.actionMenuText, isDark && styles.textDark]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerDark: {
    backgroundColor: "#1c1c1e",
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: "#2c2c2e",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  avatarTextDark: {
    color: "#ffffff",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerStatus: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },
  moreButton: {
    padding: 5,
  },
  moreIcon: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
  },
  theirMessageDark: {
    backgroundColor: "#1c1c1e",
  },
  editingHighlight: {
    borderWidth: 2,
    borderColor: "#FFD700",
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#ffffff",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  myTimestamp: {
    color: "#ffffff",
    opacity: 0.8,
  },
  theirTimestamp: {
    color: "#666",
  },
  editedLabel: {
    fontSize: 10,
    fontStyle: "italic",
  },
  myEditedLabel: {
    color: "#ffffff",
    opacity: 0.7,
  },
  theirEditedLabel: {
    color: "#999",
  },
  editBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF3CD",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FFD700",
  },
  editBannerDark: {
    backgroundColor: "#2c2c1e",
    borderTopColor: "#FFD700",
  },
  editBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  editBannerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  editBannerText: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
  },
  editBannerTextDark: {
    color: "#ffd700",
  },
  cancelEditButton: {
    padding: 5,
  },
  cancelEditIcon: {
    fontSize: 18,
    color: "#856404",
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  inputContainerDark: {
    backgroundColor: "#1c1c1e",
    borderTopColor: "#38383a",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: "#000000",
  },
  inputDark: {
    backgroundColor: "#2c2c2e",
    color: "#ffffff",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    minWidth: 250,
    overflow: "hidden",
  },
  actionMenuDark: {
    backgroundColor: "#1c1c1e",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  actionMenuIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  actionMenuText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  deleteText: {
    color: "#F44336",
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  actionMenuDividerDark: {
    backgroundColor: "#38383a",
  },
  textDark: {
    color: "#ffffff",
  },
  textMutedDark: {
    color: "#8e8e93",
  },
});
