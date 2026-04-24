import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { Colors } from "../constants/theme";
import { API_URL } from "../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountCents: number;
  type: "send" | "receive";
  status: string;
  timestamp: string;
};

type BalanceData = {
  balanceCents: number;
  balanceFormatted: string;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const { user, token } = useAuth();

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Send Money Modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!token) return;
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`${API_URL}/payments/balance`, { headers }),
        fetch(`${API_URL}/payments/transactions?limit=30`, { headers }),
      ]);

      if (balRes.ok) setBalance(await balRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } catch (e) {
      console.error("Error fetching payment data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // ── Send Money ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!recipientId.trim()) return Alert.alert("Error", "Please enter a Recipient ID.");
    if (isNaN(amountCents) || amountCents <= 0) return Alert.alert("Error", "Please enter a valid amount.");

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/payments/send`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: recipientId.trim(), amountCents, note: note.trim() || undefined }),
      });

      if (res.ok) {
        Alert.alert("✅ Success", `$${(amountCents / 100).toFixed(2)} sent successfully!`);
        setShowSendModal(false);
        setRecipientId(""); setAmount(""); setNote("");
        fetchData(); // Refresh balance & history
      } else {
        const err = await res.json();
        Alert.alert("Failed", err.message || "Payment failed. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setSending(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ── Render Transaction Item ─────────────────────────────────────────────
  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isReceive = item.type === "receive";
    return (
      <View style={[styles.txItem, isDark && styles.txItemDark]}>
        <View style={[styles.txIcon, { backgroundColor: isReceive ? "#e8f5e9" : "#fce4ec" }]}>
          <Ionicons
            name={isReceive ? "arrow-down" : "arrow-up"}
            size={20}
            color={isReceive ? Colors.light.success : Colors.light.error}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, isDark && styles.textDark]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.txSubtitle} numberOfLines={1}>
            {item.subtitle || (isReceive ? "Received" : "Sent")}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isReceive ? Colors.light.success : Colors.light.error }]}>
            {isReceive ? "+" : "-"}{item.amount}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <Stack.Screen options={{ title: "Payments", headerBackTitleVisible: false }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen options={{ title: "Payments", headerBackTitleVisible: false }} />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        onRefresh={() => { setRefreshing(true); fetchData(); }}
        refreshing={refreshing}
        ListHeaderComponent={
          <>
            {/* ── Balance Card ───────────────────────────────────────── */}
            <View style={[styles.balanceCard, isDark && styles.balanceCardDark]}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ${balance?.balanceFormatted ?? "0.00"}
              </Text>
              <Text style={styles.balanceSub}>Available for transfers</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowSendModal(true)}
                >
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="arrow-up" size={22} color="#fff" />
                  </View>
                  <Text style={styles.actionLabel}>Send</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={fetchData}>
                  <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                  </View>
                  <Text style={styles.actionLabel}>Refresh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <Ionicons name="download" size={22} color="#fff" />
                  </View>
                  <Text style={styles.actionLabel}>Request</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Quick Stats ─────────────────────────────────────────── */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="arrow-down-circle" size={22} color={Colors.light.success} />
                <Text style={[styles.statValue, { color: Colors.light.success }]}>
                  +${transactions
                    .filter(t => t.type === "receive")
                    .reduce((s, t) => s + t.amountCents, 0) / 100 | 0}.00
                </Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>Total Received</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="arrow-up-circle" size={22} color={Colors.light.error} />
                <Text style={[styles.statValue, { color: Colors.light.error }]}>
                  -${transactions
                    .filter(t => t.type === "send")
                    .reduce((s, t) => s + t.amountCents, 0) / 100 | 0}.00
                </Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>Total Sent</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="receipt" size={22} color={Colors.light.primary} />
                <Text style={[styles.statValue, { color: Colors.light.primary }]}>
                  {transactions.length}
                </Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>Transactions</Text>
              </View>
            </View>

            {/* ── History Header ──────────────────────────────────────── */}
            <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
              Transaction History
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={isDark ? "#555" : "#ccc"} />
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>No transactions yet</Text>
            <Text style={[styles.emptySubText, isDark && styles.textMuted]}>
              Tap Send to make your first payment
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, isDark && styles.separatorDark]} />
        )}
      />

      {/* ── Send Money FAB ─────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowSendModal(true)}>
        <Ionicons name="send" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ── Send Money Modal ───────────────────────────────────────────── */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSendModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSendModal(false)} />
          <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
            {/* Modal Header */}
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>Send Money</Text>
              <Pressable onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {/* Recipient */}
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Recipient User ID</Text>
              <TextInput
                style={[styles.textInput, isDark && styles.textInputDark]}
                placeholder="Paste recipient's user ID..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                value={recipientId}
                onChangeText={setRecipientId}
                autoCapitalize="none"
              />

              {/* Amount */}
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Amount (USD)</Text>
              <View style={[styles.amountInputRow, isDark && styles.textInputDark]}>
                <Text style={[styles.currencySymbol, isDark && styles.textDark]}>$</Text>
                <TextInput
                  style={[styles.amountInput, isDark && styles.textDark]}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#555" : "#aaa"}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Note */}
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Note (optional)</Text>
              <TextInput
                style={[styles.textInput, isDark && styles.textInputDark]}
                placeholder="e.g. Dinner split, Rent..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                value={note}
                onChangeText={setNote}
              />

              {/* Send Button */}
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.sendBtnText}>Send Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  containerDark: { backgroundColor: "#0e1621" },
  centered: { justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100 },

  // Balance Card
  balanceCard: {
    margin: 16,
    borderRadius: 20,
    padding: 28,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceCardDark: { backgroundColor: "#1a2d45" },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "500" },
  balanceAmount: { color: "#fff", fontSize: 44, fontWeight: "800", marginVertical: 4, letterSpacing: -1 },
  balanceSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 24 },

  // Action Buttons
  actionRow: { flexDirection: "row", justifyContent: "space-around" },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center", alignItems: "center",
  },
  actionLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },

  // Stats Row
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14,
    padding: 14, alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statCardDark: { backgroundColor: "#17212b" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, color: "#8e8e93", textAlign: "center" },

  // Section Title
  sectionTitle: {
    fontSize: 13, fontWeight: "600", textTransform: "uppercase",
    letterSpacing: 0.5, color: "#8e8e93", paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Transaction Items
  txItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff",
  },
  txItemDark: { backgroundColor: "#17212b" },
  txIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  txSubtitle: { fontSize: 13, color: "#8e8e93", marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 16, fontWeight: "700" },
  txDate: { fontSize: 12, color: "#8e8e93", marginTop: 2 },

  // Separator
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#e5e5ea", marginLeft: 74 },
  separatorDark: { backgroundColor: "#0e1621" },

  // Empty State
  emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptySubText: { fontSize: 14, color: "#aaa", marginTop: 6, textAlign: "center" },

  // FAB
  fab: {
    position: "absolute", bottom: 30, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.light.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 12,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40,
  },
  modalSheetDark: { backgroundColor: "#17212b" },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ddd", alignSelf: "center", marginTop: 12, marginBottom: 8,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#000" },

  // Inputs
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#8e8e93", marginTop: 16, marginBottom: 6, textTransform: "uppercase" },
  textInput: {
    backgroundColor: "#f2f2f7", borderRadius: 12, padding: 14,
    fontSize: 16, color: "#000",
  },
  textInputDark: { backgroundColor: "#0e1621", color: "#fff" },
  amountInputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f2f2f7", borderRadius: 12, paddingHorizontal: 14,
  },
  currencySymbol: { fontSize: 24, fontWeight: "700", color: "#000", marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#000", paddingVertical: 10 },

  // Send Button
  sendBtn: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: Colors.light.primary, borderRadius: 14,
    padding: 16, marginTop: 28,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Common
  textDark: { color: "#fff" },
  textMuted: { color: "#8e8e93" },
});
