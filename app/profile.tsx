import { Ionicons } from "@expo/vector-icons";
import { updateProfile } from "@firebase/auth";
import { doc, getDoc, setDoc } from "@firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { uploadFile } from "../utils/storage";
import DatePickerFinal from "../components/DatePickerFinal";
import { auth, db } from "../config/firebase";
import { API_URL } from "../config/api"; // Add this
import { Colors } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

interface Country {
  name: string;
  code: string;
  flag: string;
  flagUrl: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  dateOfBirth: string;
  profileImage: string | null;
  [key: string]: string | null;
}

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [userData, setUserData] = useState<UserData>({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    dateOfBirth: "",
    profileImage: user?.photoURL || null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<{
    label: string;
    key: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    loadProfile();
    fetchCountries();
  }, [user]);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd",
      );
      const data = await response.json();

      const processed: Country[] = data
        .filter((c: any) => c.idd && c.idd.root)
        .map((c: any) => ({
          name: c.name.common,
          code: c.idd.root + (c.idd.suffixes?.[0] || ""),
          flag: c.cca2, // Used for potential native emoji if needed
          flagUrl: c.flags.png,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      setCountries(processed);

      // Default to India if no country selected
      if (!selectedCountry) {
        const india = processed.find((c) => c.name === "India");
        if (india) setSelectedCountry(india);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleSaveDate = async (newDate: string) => {
    if (user) {
      try {
        setUserData({ ...userData, dateOfBirth: newDate });
        
        // Save to C# Backend
        const token = await user.getIdToken();
        await fetch(`${API_URL}/Users/profile`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            ...userData, 
            email: user.email, 
            displayName: userData.name, 
            photoURL: userData.profileImage,
            dateOfBirth: newDate 
          }),
        });

        // Fallback: Save to Firestore
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { dateOfBirth: newDate }, { merge: true });
      } catch (error: any) {
        console.error("Error saving date:", error);
      }
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      // 1. Try to load from C# Backend first
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/Users/profile/${user.email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const backendData = await response.json();
        setUserData({
          ...userData,
          ...backendData,
          name: backendData.displayName || user.displayName || "",
          email: user.email || "",
          profileImage: backendData.photoURL || user.photoURL || null,
        });
        setLoading(false);
        return;
      }

      // 2. Fallback to Firestore if backend fails/not found
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fireData = docSnap.data();
        setUserData((prev) => ({
          ...prev,
          ...fireData,
          name: user.displayName || (fireData as any).name || "",
          email: user.email || "",
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSaving(true);
      const uri = result.assets[0].uri;
      const uploadPath = `profiles/${user.uid}.jpg`;
      const downloadURL = await uploadFile(uri, uploadPath);

      if (downloadURL) {
        setUserData({ ...userData, profileImage: downloadURL });

        try {
          // Save to Auth
          await updateProfile(user, { photoURL: downloadURL });
          // Save to AsyncStorage
          await AsyncStorage.setItem(`profile_image_${user.uid}`, downloadURL);
          // Save to Firestore
          const docRef = doc(db, "users", user.uid);
          await setDoc(docRef, { profileImage: downloadURL }, { merge: true });
        } catch (error) {
          console.error("Error saving image:", error);
        }
      }
      setSaving(false);
    }
  };

  const openEditModal = (label: string, key: string, value: string) => {
    let initialValue = value;
    if (key === "phone") {
      setShowCountrySelector(false);
      // Try to match current phone start with any country code
      if (value.startsWith("+")) {
        const match = countries.find((c) => value.startsWith(c.code));
        if (match) {
          setSelectedCountry(match);
          initialValue = value.replace(match.code, "");
        }
      }
    }
    setEditingField({ label, key, value: initialValue });
    setEditModalVisible(true);
  };

  const handleSaveField = async () => {
    if (editingField && user) {
      let newValue = editingField.value;
      const key = editingField.key;

      if (key === "phone" && selectedCountry) {
        newValue = `${selectedCountry.code}${newValue}`;
      }

      setSaving(true);
      Keyboard.dismiss();

      try {
        // 1. Update State
        const updatedData = { ...userData, [key]: newValue };
        setUserData(updatedData);

        // 2. Update C# Backend
        const token = await user.getIdToken();
        await fetch(`${API_URL}/Users/profile`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            ...updatedData, 
            email: user.email,
            displayName: updatedData.name, 
            photoURL: updatedData.profileImage 
          }),
        });

        // 3. Fallback: Update Firestore
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { [key]: newValue }, { merge: true });

        // Special case: Update Auth Display Name
        if (key === "name") {
          await updateProfile(user, { displayName: newValue });
        }

        setEditModalVisible(false);
        setEditingField(null);
      } catch (error) {
        Alert.alert("Error", "Could not save changes. Please try again.");
        console.error("Save Error:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    isLast = false,
  }: any) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && styles.settingItemPressed,
        isDark && styles.settingItemDark,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons
          name={icon}
          size={22}
          color={isDark ? "#8e8e93" : Colors.light.textMuted}
        />
      </View>
      <View
        style={[
          styles.settingContent,
          !isLast && styles.settingItemBorder,
          !isLast && isDark && styles.itemBorderDark,
        ]}
      >
        <View style={styles.textContent}>
          <Text style={styles.settingLabel}>{label}</Text>
          <View style={styles.settingValueContainer}>
            {label === "Phone" &&
              value &&
              value.startsWith("+") &&
              (() => {
                const match = countries.find((c) => value.startsWith(c.code));
                return match ? (
                  <Image
                    source={{ uri: match.flagUrl }}
                    style={styles.smallFlag}
                  />
                ) : null;
              })()}
            <Text
              style={[styles.settingValue, isDark && styles.textDark]}
              numberOfLines={1}
            >
              {value || `Set ${label.toLowerCase()}`}
            </Text>
          </View>
        </View>
        <Ionicons name="pencil" size={16} color={Colors.light.primary} />
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Centered Avatar Section (WhatsApp Style) */}
        <View
          style={[styles.avatarSection, isDark && styles.avatarSectionDark]}
        >
          <View style={styles.avatarWrapper}>
            <Pressable onPress={pickImage} style={styles.avatarPressable}>
              {userData.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    isDark && styles.avatarPlaceholderDark,
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {userData.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={20} color="#ffffff" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Settings List */}
        <View style={[styles.settingsGroup, isDark && styles.groupDark]}>
          <SettingItem
            icon="person-outline"
            label="Name"
            value={userData.name}
            onPress={() => openEditModal("Name", "name", userData.name)}
          />
          <SettingItem
            icon="information-circle-outline"
            label="About"
            value={userData.bio}
            onPress={() => openEditModal("About", "bio", userData.bio)}
          />
          <SettingItem
            icon="calendar-outline"
            label="Date of Birth"
            value={userData.dateOfBirth}
            onPress={() => setShowDatePicker(true)}
          />
          <SettingItem
            icon="call-outline"
            label="Phone"
            value={userData.phone || "Set phone"}
            onPress={() => openEditModal("Phone", "phone", userData.phone)}
            isLast={true}
          />
        </View>

        <View style={[styles.settingsGroup, isDark && styles.groupDark]}>
          <SettingItem
            icon="mail-outline"
            label="Email"
            value={userData.email}
            onPress={() => openEditModal("Email", "email", userData.email)}
          />
          <SettingItem
            icon="location-outline"
            label="Location"
            value={userData.location}
            onPress={() =>
              openEditModal("Location", "location", userData.location)
            }
          />
          <SettingItem
            icon="globe-outline"
            label="Website"
            value={userData.website}
            onPress={() =>
              openEditModal("Website", "website", userData.website)
            }
            isLast={true}
          />
        </View>
      </ScrollView>

      {/* Platform-Specific Date Picker */}
      <DatePickerFinal
        visible={showDatePicker}
        value={userData.dateOfBirth}
        onClose={() => setShowDatePicker(false)}
        onChange={handleSaveDate}
        isDark={isDark}
      />

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                Enter {editingField?.label}
              </Text>
            </View>
            {editingField?.key === "phone" ? (
              <View style={styles.phoneInputRow}>
                <Pressable
                  style={[
                    styles.countryPickerTrigger,
                    isDark && styles.countryPickerTriggerDark,
                  ]}
                  onPress={() => setShowCountrySelector(!showCountrySelector)}
                >
                  {selectedCountry ? (
                    <>
                      <Image
                        source={{ uri: selectedCountry.flagUrl }}
                        style={styles.miniFlag}
                      />
                      <Text
                        style={[
                          styles.countryCodeText,
                          isDark && styles.textDark,
                        ]}
                      >
                        {selectedCountry.code}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.countryCodeText,
                        isDark && styles.textDark,
                      ]}
                    >
                      +
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color={isDark ? "#888" : "#666"}
                  />
                </Pressable>
                
                <View style={styles.phoneInputWrapper}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.phoneInput,
                      isDark && styles.textDark,
                    ]}
                    value={editingField?.value}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, "");
                      setEditingField(
                        editingField ? { ...editingField, value: filtered } : null,
                      );
                    }}
                    keyboardType="phone-pad"
                    autoFocus={true}
                    placeholder="Phone number"
                    placeholderTextColor={isDark ? "#7d8b99" : "#a1a1aa"}
                  />
                </View>
              </View>
            ) : (
              <TextInput
                style={[styles.modalInput, isDark && styles.textDark]}
                value={editingField?.value}
                onChangeText={(text) =>
                  setEditingField(
                    editingField ? { ...editingField, value: text } : null,
                  )
                }
                autoFocus={true}
                placeholder={`Enter ${editingField?.label.toLowerCase()}`}
                placeholderTextColor={isDark ? "#7d8b99" : "#a1a1aa"}
              />
            )}

            {editingField?.key === "phone" && (
              <Modal
                animationType="fade"
                transparent={true}
                visible={showCountrySelector}
                onRequestClose={() => setShowCountrySelector(false)}
              >
                <View style={styles.countryModalOverlay}>
                  <View
                    style={[
                      styles.countryModalContent,
                      isDark && styles.countrySelectorOverlayDark,
                    ]}
                  >
                    <View style={styles.modalHeader}>
                      <Text
                        style={[styles.modalTitle, isDark && styles.textDark]}
                      >
                        Select Country
                      </Text>
                      <Pressable onPress={() => setShowCountrySelector(false)}>
                        <Ionicons
                          name="close"
                          size={24}
                          color={isDark ? "#fff" : "#000"}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.searchBar}>
                      <Ionicons name="search" size={16} color="#888" />
                      <TextInput
                        style={[styles.searchInput, isDark && styles.textDark]}
                        placeholder="Search country..."
                        placeholderTextColor="#888"
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                      />
                    </View>

                    <ScrollView
                      style={styles.countryList}
                      showsVerticalScrollIndicator={true}
                    >
                      {countries
                        .filter((c) =>
                          c.name
                            .toLowerCase()
                            .includes(countrySearch.toLowerCase()),
                        )
                        .map((item, idx) => (
                          <Pressable
                            key={`${item.flag}-${idx}`}
                            style={styles.countryItem}
                            onPress={() => {
                              setSelectedCountry(item);
                              setShowCountrySelector(false);
                              setCountrySearch("");
                            }}
                          >
                            <Image
                              source={{ uri: item.flagUrl }}
                              style={styles.listFlag}
                            />
                            <Text
                              style={[
                                styles.countryName,
                                isDark && styles.textDark,
                              ]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.listCode}>{item.code}</Text>
                          </Pressable>
                        ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.cancelBtn,
                  isDark && styles.cancelBtnDark,
                ]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.saveBtn,
                  saving && { opacity: 0.7 },
                ]}
                onPress={handleSaveField}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7", // WhatsApp style light grey background
  },
  containerDark: {
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#ffffff",
  },
  avatarSectionDark: {
    backgroundColor: "#1c1c1e",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarPressable: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  avatarImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderDark: {
    backgroundColor: "#2b3643",
  },
  avatarText: {
    fontSize: 64,
    fontWeight: "600",
    color: "#ffffff",
  },
  cameraIconBadge: {
    position: "absolute",
    right: 0,
    bottom: 5,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    boxShadow: "0 2 4 rgba(0, 0, 0, 0.2)",
    elevation: 4,
  },
  settingsGroup: {
    backgroundColor: "#ffffff",
    marginTop: 20,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#c6c6c8",
  },
  groupDark: {
    backgroundColor: "#17212b",
    borderColor: "#0e1621",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingItemDark: {
    backgroundColor: "#17212b",
  },
  settingItemPressed: {
    backgroundColor: "#f2f2f7",
  },
  settingItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#c6c6c8",
  },
  itemBorderDark: {
    borderBottomColor: "#0e1621",
  },
  settingIconContainer: {
    width: 38,
    alignItems: "flex-start",
  },
  settingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  textContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "400",
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallFlag: {
    width: 20,
    height: 13,
    borderRadius: 2,
  },
  textDark: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 24,
    width: "85%",
    elevation: 8,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
  },
  modalContentDark: {
    backgroundColor: "#17212b",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modalInputWrapper: {
    /* Deprecated but kept to prevent residual crashes */
  },
  modalInputWrapperDark: {
    /* Deprecated */
  },
  phoneInputWrapper: {
    flex: 1,
    marginBottom: 0,
  },
  modalInput: {
    fontSize: 16,
    color: Colors.light.text,
    borderBottomWidth: 2,
    borderBottomColor: "#00A884", // Pure WhatsApp Green!
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 24,
    ...(Platform.OS === 'web' && { outlineStyle: "none" } as any),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  cancelBtn: {
    backgroundColor: "transparent",
  },
  cancelBtnDark: {
    backgroundColor: "transparent",
  },
  saveBtn: {
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    color: "#00A884", // WhatsApp Green!
    fontWeight: "700",
    textTransform: "uppercase",
  },
  saveBtnText: {
    color: "#00A884", // WhatsApp Green!
    fontWeight: "700",
    textTransform: "uppercase",
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  countryPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 90,
    gap: 6,
  },
  countryPickerTriggerDark: {
    backgroundColor: "#2b3643",
  },
  miniFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  countryModalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "80%",
    padding: 20,
    boxShadow: "0 10px 15px rgba(0, 0, 0, 0.25)",
    elevation: 10,
  },
  countrySelectorOverlayDark: {
    backgroundColor: "#17212b",
    borderWidth: 1,
    borderColor: "#0e1621",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  listFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 10,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  listCode: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
    marginLeft: 8,
  },
});
