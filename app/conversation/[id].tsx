import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { Colors } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { startRecording, stopRecording } from "../../utils/audio";
import { uploadFile } from "../../utils/storage";

// Mock messages data
type Message = {
  id: string;
  text?: string;
  imageUrl?: string;
  timestamp: any;
  isMine: boolean;
  senderId: string;
  read: boolean;
  senderName?: string;
  reactions?: { [uid: string]: string };
  isEdited?: boolean;
  editedAt?: string;
  type?: "text" | "image" | "audio" | "video" | "file";
  mediaUrl?: string; // Generic URL for audio/video/file
  mediaMetadata?: {
    duration?: number;
    filename?: string;
    size?: number;
  };
  isPending?: boolean;
};

export default function ConversationScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const user = auth.currentUser;
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState<{
    isOnline: boolean;
    lastSeen: any;
  } | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Listen to Firestore connection state
    const unsubscribeConnection = onSnapshot(doc(db, ".info/connected"), (snapshot) => {
      setIsConnected(snapshot.data()?.connected ?? true);
    });
    return () => unsubscribeConnection();
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    let unsubscribeUser: () => void = () => {};

    // 1. Get other participant ID and typing status from chat doc
    const chatRef = doc(db, "chats", id);
    const unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const groupStatus = data.isGroup || false;
        setIsGroup(groupStatus);
        setParticipantCount(data.participants?.length || 0);

        const otherId = groupStatus
          ? null
          : data.participants.find((p: string) => p !== user.uid);

        // Show typing indicator if other user is typing
        if (otherId && data.typing) {
          setOtherUserTyping(data.typing[otherId] || false);
        }

        // Reset our unread count if it's > 0
        if (data.unreadCounts?.[user.uid] > 0) {
          try {
            updateDoc(chatRef, {
              [`unreadCounts.${user.uid}`]: 0,
            });
          } catch (e) {
            console.error("Silent error: Could not reset unread count", e);
          }
        }

        if (otherId) {
          // 2. Listen to other user's presence status
          const userRef = doc(db, "users", otherId);
          unsubscribeUser = onSnapshot(userRef, (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setOtherUserStatus({
                isOnline: userData.isOnline || false,
                lastSeen: userData.lastSeen,
              });
            }
          });
        }
      }
    });

    // 3. Listen to messages
    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("timestamp", "asc"),
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const msgList = snapshot.docs.map((doc) => {
          const data = doc.data();
          const isMine = data.senderId === user.uid;

          // Mark as read if it's from the other user and unread
          if (!isMine && data.read === false) {
            try {
              updateDoc(doc.ref, { read: true });
            } catch (e) {
              // Ignore or log once. Don't flood.
            }
          }

          return {
            ...data,
            id: doc.id,
            isMine,
            timestamp: data.timestamp
              ? data.timestamp.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "...",
            isPending: doc.metadata.hasPendingWrites,
          } as Message;
        });
        setMessages(msgList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      },
    );
    return () => {
      unsubscribeChat();
      unsubscribeUser();
      unsubscribeMessages();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [id, user]);

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return "Offline";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const handlePickMedia = async (type: "video" | "document") => {
    if (!user || !id) return;
    setShowAttachmentMenu(false);

    try {
      let result: any;
      let uploadPath = "";
      let metadata: any = {};

      if (type === "video") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
       const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType.Videos,
        allowsEditing: true,
        quality: 0.7,
      });
        if (result.canceled) return;
        uploadPath = `chats/${id}/${Date.now()}.mp4`;
        metadata = { type: "video" };
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "application/msword", "image/*"],
        });
        if (result.canceled) return;
        uploadPath = `chats/${id}/${Date.now()}_${result.assets[0].name}`;
        metadata = {
          type: "file",
          filename: result.assets[0].name,
          size: result.assets[0].size,
        };
      }

      setLoading(true);
      const uri = result.assets[0].uri;
      const downloadURL = await uploadFile(uri, uploadPath);

      if (downloadURL) {
        await addDoc(collection(db, "chats", id, "messages"), {
          mediaUrl: downloadURL,
          type: type === "video" ? "video" : "file",
          mediaMetadata: metadata,
          senderId: user.uid,
          senderName: user.displayName || "User",
          timestamp: serverTimestamp(),
          read: false,
        });

        const chatRef = doc(db, "chats", id);
        const chatSnap = await getDoc(chatRef);
        const updates: any = {
          lastMessage:
            type === "video" ? "📽️ Video" : `📄 ${metadata.filename || "File"}`,
          updatedAt: serverTimestamp(),
        };

        if (chatSnap.exists()) {
          chatSnap.data().participants.forEach((p: string) => {
            if (p !== user.uid) updates[`unreadCounts.${p}`] = increment(1);
          });
        }
        await updateDoc(chatRef, updates);
      }
      setLoading(false);
    } catch (error) {
      console.error(`Error picking ${type}:`, error);
      setLoading(false);
    }
  };

  const handleVoiceNote = async () => {
    if (isRecording) {
      if (!recording) return;
      setIsRecording(false);
      const uri = await stopRecording(recording);
      setRecording(null);

      if (uri) {
        setLoading(true);
        const uploadPath = `chats/${id}/${Date.now()}.m4a`;
        const downloadURL = await uploadFile(uri, uploadPath);
        if (downloadURL) {
          await addDoc(collection(db, "chats", id, "messages"), {
            mediaUrl: downloadURL,
            type: "audio",
            senderId: user?.uid,
            senderName: user?.displayName || "User",
            timestamp: serverTimestamp(),
            read: false,
          });
          // Update chat doc... similar to image/video
        }
        setLoading(false);
      }
    } else {
      const rec = await startRecording();
      if (rec) {
        setRecording(rec);
        setIsRecording(true);
      }
    }
  };

  const handlePickImage = async () => {
    if (!user || !id) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access gallery is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setLoading(true);
        const uri = result.assets[0].uri;
        const uploadPath = `chats/${id}/${Date.now()}.jpg`;
        const downloadURL = await uploadFile(uri, uploadPath);

        if (downloadURL) {
          // Send image message
          await addDoc(collection(db, "chats", id, "messages"), {
            imageUrl: downloadURL,
            senderId: user?.uid,
            timestamp: serverTimestamp(),
            read: false,
          });

          // Update chat doc
          const chatSnap = await getDoc(doc(db, "chats", id));
          let otherId = null;
          if (chatSnap.exists()) {
            otherId = chatSnap
              .data()
              .participants.find((p: string) => p !== user.uid);
          }

          await updateDoc(doc(db, "chats", id), {
            lastMessage: "📷 Photo",
            updatedAt: serverTimestamp(),
            ...(otherId && {
              [`unreadCounts.${otherId}`]: increment(1),
            }),
          });
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setLoading(false);
    }
  };

  const handleTyping = async (text: string) => {
    setNewMessage(text);
    if (!id || !user) return;

    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set typing to true
    const chatRef = doc(db, "chats", id);
    await updateDoc(chatRef, {
      [`typing.${user.uid}`]: true,
    });

    // Set timeout to clear typing status
    const timeout = setTimeout(async () => {
      await updateDoc(chatRef, {
        [`typing.${user.uid}`]: false,
      });
    }, 3000);

    setTypingTimeout(timeout);
  };

  const handleSend = async () => {
    if (newMessage && newMessage.trim() && user && id) {
      const text = newMessage.trim();
      setNewMessage(""); // Clear input early for better UX

      // Clear typing status immediately on send
      if (typingTimeout) clearTimeout(typingTimeout);
      const chatRef = doc(db, "chats", id);
      await updateDoc(chatRef, {
        [`typing.${user.uid}`]: false,
      });

      try {
        if (editingMessage) {
          // Update existing message
          const msgRef = doc(db, "chats", id, "messages", editingMessage.id);
          await updateDoc(msgRef, {
            text,
            isEdited: true,
            editedAt: serverTimestamp(),
          });
          setEditingMessage(null);
        } else {
          // Add new message to Firestore
          await addDoc(collection(db, "chats", id, "messages"), {
            text,
            senderId: user.uid,
            senderName: user.displayName || "User",
            timestamp: serverTimestamp(),
            read: false,
          });

          // Update parent chat's last message and timestamp
          const chatRef = doc(db, "chats", id);
          const chatSnap = await getDoc(chatRef);

          const updates: any = {
            lastMessage: text,
            updatedAt: serverTimestamp(),
          };

          if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            chatData.participants.forEach((p: string) => {
              if (p !== user.uid) {
                updates[`unreadCounts.${p}`] = increment(1);
              }
            });
          }

          await updateDoc(chatRef, updates);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Could add an alert here
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user || !id) return;
    const msgRef = doc(db, "chats", id, "messages", messageId);
    try {
      await updateDoc(msgRef, {
        [`reactions.${user.uid}`]: emoji,
      });
      setShowActionMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowActionMenu(true);
  };

  const handleEdit = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setNewMessage(selectedMessage.text || "");
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.isMine;

    return (
      <Pressable
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        style={[
          styles.messageContainer,
          isMine ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine
              ? [styles.myBubble, isDark && styles.myBubbleDark]
              : [styles.theirBubble, isDark && styles.theirBubbleDark],
            editingMessage?.id === item.id && styles.editingHighlight,
          ]}
        >
          {isGroup && !isMine && (
            <Text style={[styles.senderName, { color: Colors.light.primary }]}>
              {item.senderName || "User"}
            </Text>
          )}
          {item.imageUrl && item.type === "image" && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {item.type === "audio" && (
            <View style={styles.audioContainer}>
              <Ionicons
                name="play-circle" // Should be dynamic based on playing state
                size={36}
                color={isMine ? "#fff" : Colors.light.primary}
              />
              <View style={styles.audioWaveform}>
                <View style={[styles.audioProgress, { width: "40%" }]} />
              </View>
              <Text style={[styles.audioDuration, isMine && { color: "#fff" }]}>
                0:12
              </Text>
            </View>
          )}

          {item.type === "video" && (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: item.mediaUrl }} // Cloudinary returns thumbnail for videos usually
                style={styles.messageVideoThumbnail}
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
            </View>
          )}

          {item.type === "file" && (
            <View
              style={[styles.fileContainer, isMine && styles.fileContainerMine]}
            >
              <View style={styles.fileInfo}>
                <Ionicons
                  name="document"
                  size={24}
                  color={isMine ? "#fff" : Colors.light.primary}
                />
                <View style={styles.fileTextInfo}>
                  <Text
                    style={[styles.fileName, isMine && { color: "#fff" }]}
                    numberOfLines={1}
                  >
                    {item.mediaMetadata?.filename || "Document"}
                  </Text>
                  <Text
                    style={[
                      styles.fileSize,
                      isMine && { color: "rgba(255,255,255,0.7)" },
                    ]}
                  >
                    {item.mediaMetadata?.size
                      ? `${(item.mediaMetadata.size / 1024).toFixed(1)} KB`
                      : "File"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="download-outline"
                size={20}
                color={isMine ? "#fff" : "#666"}
              />
            </View>
          )}

          {item.text && (
            <Text
              style={[
                styles.messageText,
                isMine ? styles.myMessageText : styles.theirMessageText,
                isDark && styles.textDark,
              ]}
            >
              {item.text}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isMine ? styles.myTimestamp : styles.theirTimestamp,
                isDark && !isMine && styles.textMutedDark,
              ]}
            >
              {item.timestamp}
              {item.isEdited && " (edited)"}
            </Text>
            {isMine && item.timestamp !== "..." && (
              <Ionicons
                name={item.isPending ? "time-outline" : (item.read ? "checkmark-done" : "checkmark")}
                size={16}
                color={item.isPending ? "#999" : (item.read ? "#34B7F1" : (isDark ? "#8e8e93" : "#666"))}
                style={styles.readStatusIcon}
              />
            )}
          </View>
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(item.reactions).map(([uid, emoji]) => (
                <View key={uid} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

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
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Connection lost... Waiting to sync 🔄</Text>
        </View>
      )}
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <View
            style={[
              styles.avatar,
              isGroup && { backgroundColor: "#FF9500" },
              isDark && styles.avatarDark,
            ]}
          >
            {isGroup ? (
              <Ionicons
                name="people"
                size={24}
                color={isDark ? "#fff" : Colors.light.primary}
              />
            ) : (
              <Text
                style={[styles.avatarText, isDark && styles.avatarTextDark]}
              >
                {(name || "Chat").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.headerName, isDark && styles.textDark]}>
              {name || "Chat"}
            </Text>
            <View style={styles.statusRow}>
              {isGroup ? (
                <Text
                  style={[styles.headerStatus, isDark && styles.textMutedDark]}
                >
                  {participantCount} members
                </Text>
              ) : (
                <>
                  {otherUserTyping ? (
                    <Text
                      style={[
                        styles.typingText,
                        isDark && styles.typingTextDark,
                      ]}
                    >
                      typing...
                    </Text>
                  ) : (
                    <>
                      {otherUserStatus?.isOnline && (
                        <View style={styles.onlineDot} />
                      )}
                      <Text
                        style={[
                          styles.headerStatus,
                          isDark && styles.textMutedDark,
                        ]}
                      >
                        {otherUserStatus?.isOnline
                          ? "Online"
                          : otherUserStatus?.lastSeen
                            ? `Last seen ${formatLastSeen(otherUserStatus.lastSeen)}`
                            : "Offline"}
                      </Text>
                    </>
                  )}
                </>
              )}
            </View>
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
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowAttachmentMenu(true)}
        >
          <Ionicons
            name="add"
            size={28}
            color={isDark ? "#fff" : Colors.light.primary}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Type a message..."
          value={newMessage || ""}
          onChangeText={handleTyping}
          multiline
          placeholderTextColor={isDark ? "#8e8e93" : "#999"}
        />
        {newMessage.trim() || editingMessage ? (
          <Pressable style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>{editingMessage ? "✓" : "➤"}</Text>
          </Pressable>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              isRecording && { backgroundColor: "#F44336" },
            ]}
            onPress={handleVoiceNote}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Attachment Menu */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View
            style={[styles.attachmentMenu, isDark && styles.attachmentMenuDark]}
          >
            <View style={styles.attachmentTitleContainer}>
              <Text style={[styles.attachmentTitle, isDark && styles.textDark]}>
                Share Content
              </Text>
            </View>
            <View style={styles.attachmentGrid}>
              {[
                {
                  label: "Camera",
                  icon: "camera",
                  color: "#4A90E2",
                  action: handlePickImage,
                },
                {
                  label: "Gallery",
                  icon: "image",
                  color: "#50E3C2",
                  action: handlePickImage,
                },
                {
                  label: "Video",
                  icon: "videocam",
                  color: "#BD10E0",
                  action: () => handlePickMedia("video"),
                },
                {
                  label: "Document",
                  icon: "document-text",
                  color: "#F5A623",
                  action: () => handlePickMedia("document"),
                },
                {
                  label: "Location",
                  icon: "location",
                  color: "#7ED321",
                  action: () => {},
                },
                {
                  label: "Contact",
                  icon: "person",
                  color: "#D0021B",
                  action: () => {},
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachmentItem}
                  onPress={item.action}
                >
                  <View
                    style={[
                      styles.attachmentIconBox,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Ionicons name={item.icon as any} size={28} color="#fff" />
                  </View>
                  <Text
                    style={[styles.attachmentLabel, isDark && styles.textDark]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

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
            {/* Reaction Bar */}
            <View style={styles.reactionPicker}>
              {["❤️", "😂", "😮", "😢", "👍", "🔥"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionPickerItem}
                  onPress={() =>
                    selectedMessage && handleReaction(selectedMessage.id, emoji)
                  }
                >
                  <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedMessage?.isMine && (
              <>
                <Pressable style={styles.actionMenuItem} onPress={handleEdit}>
                  <Ionicons
                    name="pencil-outline"
                    size={22}
                    color={isDark ? "#ffffff" : "#000000"}
                  />
                  <Text
                    style={[styles.actionMenuText, isDark && styles.textDark]}
                  >
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
                  <Ionicons name="trash-outline" size={22} color="#F44336" />
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
              </>
            )}
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 5,
  },
  typingText: {
    fontSize: 12,
    color: "#ffffff",
    fontStyle: "italic",
    fontWeight: "500",
  },
  typingTextDark: {
    color: Colors.light.primary,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
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
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 15,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  myBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  myBubbleDark: {
    backgroundColor: Colors.light.primary,
  },
  theirBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
  },
  theirBubbleDark: {
    backgroundColor: "#1c1c1e",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 5,
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
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
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
  attachButton: {
    padding: 10,
    marginRight: 5,
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
    marginLeft: 15,
  },
  reactionPicker: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  reactionPickerItem: {
    padding: 10,
  },
  reactionPickerEmoji: {
    fontSize: 24,
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
  readStatusIcon: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    position: "absolute",
    bottom: -15,
    right: 10,
  },
  reactionBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  reactionEmoji: {
    fontSize: 12,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    minWidth: 150,
  },
  audioWaveform: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 10,
    borderRadius: 2,
    overflow: "hidden",
  },
  audioProgress: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },
  audioDuration: {
    fontSize: 12,
    color: "#666",
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  messageVideoThumbnail: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  videoPlayOverlay: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 12,
    width: 220,
  },
  fileContainerMine: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileTextInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  fileSize: {
    fontSize: 12,
    color: "#888",
  },
  attachmentMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    width: "100%",
    position: "absolute",
    bottom: 0,
    boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.2)",
  },
  attachmentMenuDark: {
    backgroundColor: "#1c1c1e",
  },
  attachmentTitleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  attachmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  attachmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  attachmentItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 20,
  },
  attachmentIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  attachmentLabel: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  offlineBanner: {
    backgroundColor: "#FF9500",
    paddingVertical: 4,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
