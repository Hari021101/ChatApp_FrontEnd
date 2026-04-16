import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PaymentItem } from "../../components/ui/PaymentItem";
import { Colors } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    title: "John Doe",
    subtitle: "Sent for dinner",
    amount: "$42.50",
    type: "send" as const,
    status: "Completed" as const,
    timestamp: "Today, 8:30 PM",
  },
  {
    id: "2",
    title: "Refund: Amazon",
    subtitle: "Item returned",
    amount: "$120.00",
    type: "receive" as const,
    status: "Completed" as const,
    timestamp: "Yesterday, 2:15 PM",
  },
  {
    id: "3",
    title: "Sarah Wilson",
    subtitle: "Pending verification",
    amount: "$15.00",
    type: "send" as const,
    status: "Pending" as const,
    timestamp: "Yesterday, 10:05 AM",
  },
  {
    id: "4",
    title: "Starbucks Coffee",
    subtitle: "Payment failed",
    amount: "$5.75",
    type: "send" as const,
    status: "Failed" as const,
    timestamp: "12 Oct, 4:20 PM",
  },
];

export default function PaymentsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const colors = Colors[theme];

  const ActionButton = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
    <Pressable style={styles.actionButton}>
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={[styles.actionLabel, isDark && styles.textWhite]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Custom Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>
        <Text style={[styles.headerTitle, isDark && styles.textWhite]}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <LinearGradient
          colors={isDark ? ["#1e293b", "#0f172a"] : ["#3390ec", "#54a9eb"]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>$1,240.50</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardStatus}>Primary Account Active</Text>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ActionButton icon="scan-outline" label="Scan QR" color="#4ade80" />
          <ActionButton icon="send-outline" label="Send" color="#6366f1" />
          <ActionButton icon="add-outline" label="Add Bank" color="#f59e0b" />
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Pressable style={styles.methodItem}>
              <View style={[styles.methodIcon, { backgroundColor: "#3b82f6" }]}>
                <Ionicons name="card" size={20} color="#fff" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodTitle, isDark && styles.textWhite]}>Visa •••• 4242</Text>
                <Text style={styles.methodSubtitle}>Primary Method</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </Pressable>
          </View>
        </View>

        {/* Transaction History Heading */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <Pressable>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>View All</Text>
          </Pressable>
        </View>

        {/* Transactions List */}
        <View style={[styles.card, isDark && styles.cardDark, { paddingHorizontal: 0 }]}>
          {MOCK_TRANSACTIONS.map((tx, index) => (
            <React.Fragment key={tx.id}>
              <PaymentItem {...tx} />
              {index < MOCK_TRANSACTIONS.length - 1 && (
                <View style={[styles.separator, isDark && styles.separatorDark]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  containerDark: {
    backgroundColor: "#0e1621",
  },
  header: {
    height: Platform.OS === "web" ? 70 : 100,
    paddingTop: Platform.OS === "web" ? 20 : 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f2f2f7",
  },
  headerDark: {
    backgroundColor: "#17212b",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardStatus: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginRight: 6,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  actionButton: {
    alignItems: "center",
    width: 80,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  cardDark: {
    backgroundColor: "#17212b",
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  methodSubtitle: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#c6c6c8",
    marginLeft: 70,
  },
  separatorDark: {
    backgroundColor: "#2b3643",
  },
  textWhite: {
    color: "#fff",
  },
});
