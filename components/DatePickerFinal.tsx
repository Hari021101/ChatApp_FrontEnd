import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { Colors } from "../constants/theme";

// Dynamically load native picker only if NOT on web
const DateTimePicker =
  Platform.OS !== "web"
    ? require("@react-native-community/datetimepicker").default
    : null;

interface Props {
  visible: boolean;
  value: string;
  onClose: () => void;
  onChange: (date: string) => void;
  isDark: boolean;
}

// Safe dimension extraction
const getDimensions = () => {
  try {
    return Dimensions.get("window");
  } catch {
    return { width: 0, height: 0 };
  }
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePickerFinal({
  visible,
  value,
  onClose,
  onChange,
  isDark,
}: Props) {
  // Parsing initial date
  const initialDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setViewDate(new Date(initialDate));
      setShowYearPicker(false);
    }
  }, [visible, initialDate]);

  if (!visible) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handleDaySelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    // Format as YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(currentMonth + offset);
    setViewDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setShowYearPicker(false);
  };

  // WEB RENDER
  if (Platform.OS === "web") {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Create days array with padding for first day
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const years = [];
    const maxYear = new Date().getFullYear();
    for (let y = maxYear; y >= maxYear - 100; y--) {
      years.push(y);
    }

    const isSelected = (day: number) => {
      if (!value) return false;
      const d = new Date(value);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    };

    const isToday = (day: number) => {
      const today = new Date();
      return (
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === day
      );
    };

    return (
      <View style={styles.webOverlay}>
        <Pressable
          style={[
            styles.backdrop,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
            },
          ]}
          onPress={onClose}
        />
        <View style={[styles.webModal, isDark && styles.modalDark]}>
          <View style={styles.modalHeader}>
            <View>
              <Pressable
                onPress={() => setShowYearPicker(!showYearPicker)}
                style={styles.headerTitleContainer}
              >
                <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <Ionicons
                  name={showYearPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={isDark ? "#888" : "#666"}
                  style={{ marginLeft: 6 }}
                />
              </Pressable>
            </View>
            <View style={styles.headerActions}>
              {!showYearPicker && (
                <>
                  <Pressable
                    onPress={() => changeMonth(-1)}
                    style={styles.navBtn}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => changeMonth(1)}
                    style={styles.navBtn}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </Pressable>
                </>
              )}
              <Pressable
                onPress={onClose}
                style={[styles.navBtn, { marginLeft: 10 }]}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
              </Pressable>
            </View>
          </View>

          {showYearPicker ? (
            <View style={styles.yearPickerContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.yearList}
              >
                {years.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => handleYearSelect(y)}
                    style={[
                      styles.yearItem,
                      y === currentYear && styles.yearItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        isDark && styles.textDark,
                        y === currentYear && styles.yearTextActive,
                      ]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.calendarContainer}>
              <View style={styles.weekdaysRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={styles.weekdayText}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {days.map((day, idx) => (
                  <View key={idx} style={styles.dayCell}>
                    {day && (
                      <Pressable
                        onPress={() => handleDaySelect(day)}
                        style={[
                          styles.dayButton,
                          isToday(day) && styles.todayButton,
                          isSelected(day) && styles.selectedDayButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isDark && styles.textDark,
                            isSelected(day) && styles.selectedDayText,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, isDark && styles.textDark]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={styles.todayLink}
              onPress={() => {
                setViewDate(new Date());
                setShowYearPicker(false);
              }}
            >
              <Text style={styles.todayLinkText}>Go to Today</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // NATIVE (iOS / ANDROID) RENDER
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContentNative, isDark && styles.modalContentDark]}
        >
          <View style={styles.modalHeaderNative}>
            <Text style={[styles.modalTitleNative, isDark && styles.textDark]}>
              Select Birthday
            </Text>
            <Pressable onPress={onClose}>
              <Text style={styles.doneTextNative}>Done</Text>
            </Pressable>
          </View>
          {DateTimePicker && (
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: any, date?: Date) => {
                if (Platform.OS === "android") onClose();
                if (date) {
                  const ds = date.toISOString().split("T")[0];
                  onChange(ds);
                }
              }}
              themeVariant={isDark ? "dark" : "light"}
              maximumDate={new Date()}
              textColor={isDark ? "#ffffff" : "#000000"}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  } as ViewStyle,
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  webModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 24,
  } as ViewStyle,
  modalDark: {
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  } as ViewStyle,
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  } as ViewStyle,
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  } as ViewStyle,
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  } as TextStyle,
  textDark: { color: "#fff" } as TextStyle,
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  navBtn: {
    padding: 8,
    borderRadius: 12,
  } as ViewStyle,
  calendarContainer: {
    marginTop: 10,
  } as ViewStyle,
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 10,
  } as ViewStyle,
  weekdayText: {
    flex: 1,
    textAlign: "center",
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  } as TextStyle,
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  } as ViewStyle,
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  } as ViewStyle,
  dayButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  } as ViewStyle,
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  } as TextStyle,
  selectedDayButton: {
    backgroundColor: Colors.light.primary,
  } as ViewStyle,
  selectedDayText: {
    color: "#fff",
    fontWeight: "700",
  } as TextStyle,
  todayButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
  } as ViewStyle,
  yearPickerContainer: {
    height: 280,
    marginTop: 10,
  } as ViewStyle,
  yearList: {
    paddingVertical: 10,
  } as ViewStyle,
  yearItem: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  } as ViewStyle,
  yearItemActive: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  } as ViewStyle,
  yearText: {
    fontSize: 18,
    color: "#333",
  } as TextStyle,
  yearTextActive: {
    color: Colors.light.primary,
    fontWeight: "700",
  } as TextStyle,
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  } as ViewStyle,
  cancelBtn: {
    padding: 8,
  } as ViewStyle,
  cancelBtnText: {
    color: "#666",
    fontWeight: "600",
  } as TextStyle,
  todayLink: {
    padding: 8,
  } as ViewStyle,
  todayLinkText: {
    color: Colors.light.primary,
    fontWeight: "700",
  } as TextStyle,

  // NATIVE STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  } as ViewStyle,
  modalContentNative: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  } as ViewStyle,
  modalContentDark: {
    backgroundColor: "#1c1c1e",
  } as ViewStyle,
  modalHeaderNative: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  } as ViewStyle,
  modalTitleNative: {
    fontSize: 17,
    fontWeight: "600",
  } as TextStyle,
  doneTextNative: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  } as TextStyle,
});
