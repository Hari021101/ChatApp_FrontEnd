import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../constants/theme";
import DatePickerNative from "./DatePickerNative";

interface Props {
  visible: boolean;
  value: string;
  onClose: () => void;
  onChange: (date: string) => void;
  isDark: boolean;
}

export default function CustomDatePicker({
  visible,
  value,
  onClose,
  onChange,
  isDark,
}: Props) {
  useEffect(() => {
    if (visible) {
      console.log("[CustomDatePicker] Visible:", visible);
    }
  }, [visible]);

  if (!visible) return null;

  // WEB IMPLEMENTATION
  if (Platform.OS === "web") {
    return (
      <View style={styles.webOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.webModal, isDark && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              Select Birthday
            </Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : Colors.light.text}
              />
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.helperText, isDark && styles.textDarkMuted]}>
              Choose your date of birth:
            </Text>
            <TextInput
              // @ts-ignore
              type="date"
              value={value}
              onChange={(e: any) => {
                const val = e.target.value;
                if (val) onChange(val);
              }}
              style={[styles.modalInput, isDark && styles.textDark]}
            />
          </View>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButton, styles.saveBtn]}
              onPress={onClose}
            >
              <Text style={styles.saveBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // IOS / NATIVE IMPLEMENTATION
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
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
          <DatePickerNative
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Web Styles
  webOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  webModal: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    padding: 20,
    boxShadow: "0 10px 10px rgba(0, 0, 0, 0.25)",
    elevation: 5,
  },
  modalContentDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
  },
  inputContainer: {
    marginBottom: 32,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  textDarkMuted: {
    color: "#888",
  },
  modalInput: {
    fontSize: 18,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
    paddingVertical: 12,
    color: Colors.light.text,
    backgroundColor: "transparent",
  },
  textDark: {
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },

  // Native (iOS) Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContentNative: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeaderNative: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  modalTitleNative: {
    fontSize: 17,
    fontWeight: "600",
  },
  doneText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
