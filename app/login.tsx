import { Ionicons } from "@expo/vector-icons";
import {
    GoogleAuthProvider,
    signInWithRedirect,
} from "@firebase/auth";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth } from "../config/firebase";
import { authService } from "../services/authService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CustomIcon = ({ name, size = 24, color = "#fff" }: any) => (
  <Ionicons name={name} size={size} color={color} />
);

const InputField = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  fieldName,
  isFocused,
  showPassword,
  setShowPassword,
  setFocusedField,
  isValid,
}: any) => {
  return (
    <View style={styles.inputContainer}>
      <Animated.View
        style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
      >
        <View style={styles.iconContainer}>
          <CustomIcon
            name={icon}
            size={24}
            color={
              isValid ? "#10b981" : isFocused ? "#fff" : "rgba(255,255,255,0.4)"
            }
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          selectionColor="#fff"
          underlineColorAndroid="transparent"
          autoComplete={
            Platform.OS === "web"
              ? "one-time-code" // Hack to stop browser from trying to autofill and styling the box white
              : fieldName === "email"
                ? "email"
                : fieldName === "password"
                  ? "current-password"
                  : "off"
          }
          textContentType={
            fieldName === "email"
              ? "emailAddress"
              : fieldName === "password"
                ? "password"
                : "none"
          }
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          spellCheck={false}
          autoCorrect={false}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <CustomIcon
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="rgba(255,255,255,0.4)"
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Aurora movement animations
  const aurora1 = useRef(new Animated.Value(0)).current;
  const aurora2 = useRef(new Animated.Value(0)).current;
  const mainEntry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    };
    createLoop(aurora1, 10000);
    createLoop(aurora2, 12000);

    Animated.spring(mainEntry, {
      toValue: 1,
      tension: 10,
      friction: 8,
      useNativeDriver: false,
    }).start();

    // Handle Google Redirect Result on Web
    if (Platform.OS === "web") {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            router.replace("/(tabs)");
          }
        })
        .catch((error) => {
          console.error("Google Redirect Error:", error);
        });
    }
  }, []);

  const drift1X = aurora1.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50],
  });
  const drift1Y = aurora1.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });
  const drift2X = aurora2.interpolate({
    inputRange: [0, 1],
    outputRange: [50, -50],
  });
  const drift2Y = aurora2.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -30],
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      await signIn(response.user, response.token);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "An error occurred during login.");
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.registerNew({ 
        email, 
        password, 
        displayName: name 
      });
      
      // Auto-login after signup
      await signIn(response.user, response.token); 
      
      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "An error occurred during signup.");
      console.error("Auth Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      if (Platform.OS === "web") {
        await signInWithRedirect(auth, provider);
      } else {
        Alert.alert(
          "Notice",
          "Google Sign-In on Native requires additional configuration. Please use Web for now.",
        );
      }
    } catch (error: any) {
      Alert.alert("Google Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email.includes("@") && email.includes(".");

  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#0f172a", "#1e1b4b", "#0f172a"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.auroraBlob,
            {
              backgroundColor: "#6366f1",
              top: -100,
              right: -100,
              transform: [{ translateX: drift1X }, { translateY: drift1Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.auroraBlob,
            {
              backgroundColor: "#a855f7",
              bottom: -100,
              left: -100,
              width: 500,
              height: 500,
              borderRadius: 250,
              transform: [{ translateX: drift2X }, { translateY: drift2Y }],
            },
          ]}
        />
        <View style={styles.noiseOverlay} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: mainEntry,
                transform: [
                  {
                    translateY: mainEntry.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>
                {isLogin ? "FUTURE\nSPACE" : "CREATE\nREALITY"}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? "AUTHENTICATE YOUR PRESENCE"
                  : "DESIGN YOUR NEW IDENTITY"}
              </Text>
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <InputField
                  icon="person-outline"
                  placeholder="IDENTITY NAME"
                  value={name}
                  onChangeText={setName}
                  fieldName="name"
                  isFocused={focusedField === "name"}
                  setFocusedField={setFocusedField}
                />
              )}

              <InputField
                icon="mail-outline"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                fieldName="email"
                isFocused={focusedField === "email"}
                setFocusedField={setFocusedField}
                isValid={isEmailValid}
              />

              <InputField
                icon="lock-closed-outline"
                placeholder="SECURE ACCESS"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                fieldName="password"
                isFocused={focusedField === "password"}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                setFocusedField={setFocusedField}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { transform: [{ scale: 0.98 }] },
                  loading && { opacity: 0.8 },
                ]}
                onPress={isLogin ? handleLogin : handleSignup}
                disabled={loading}
              >
                <View style={styles.btnContent}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {isLogin ? "INITIALIZE" : "GENERATE"}
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable
                style={styles.switchBtn}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.switchText}>
                  {isLogin ? "UNREGISTERED ENTITY? " : "EXISTING ENTITY? "}
                  <Text style={styles.switchTextBold}>
                    {isLogin ? "JOIN" : "LOGIN"}
                  </Text>
                </Text>
              </Pressable>

              <View style={styles.socialStrip}>
                <Pressable style={styles.socialBtn} onPress={handleGoogleLogin}>
                  <CustomIcon name="logo-google" size={28} color="#fff" />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <CustomIcon name="logo-apple" size={28} color="#fff" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  auroraBlob: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    opacity: 0.4,
    // Add a simulated blur filter if possible, otherwise use opacity
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH > 500 ? 40 : 25,
    paddingTop: SCREEN_WIDTH > 500 ? 100 : 70,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 60,
  },
  title: {
    fontSize: SCREEN_WIDTH > 500 ? 64 : 48,
    fontWeight: "900",
    color: "#fff",
    lineHeight: SCREEN_WIDTH > 500 ? 64 : 48,
    letterSpacing: -2,
    // Modern textShadow standard
    textShadow: "0 10px 20px rgba(99, 102, 241, 0.5)",
  } as any,
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 20,
    letterSpacing: 4,
    fontWeight: "700",
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 40,
    height: SCREEN_WIDTH > 500 ? 80 : 64, // Responsive height
    paddingHorizontal: SCREEN_WIDTH > 500 ? 32 : 24,
    borderWidth: 0,
  },
  inputWrapperFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    // Using modern boxShadow standard for web/native compatibility
    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
    elevation: 20,
  },
  iconContainer: {
    marginRight: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "transparent",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    ...Platform.select({
      web: {
        // silences browser focus outline which is valid for web
        outlineStyle: "none",
        // Force transparency even when browser tries to autofill
        boxShadow: "0 0 0px 1000px rgba(0,0,0,0) inset",
        WebkitTextFillColor: "#fff",
        transition: "background-color 5000s ease-in-out 0s",
        borderWidth: 0,
        borderColor: "transparent",
      } as any,
    }),
  },
  eyeIcon: {
    padding: 10,
  },
  primaryBtn: {
    height: SCREEN_WIDTH > 500 ? 80 : 64,
    borderRadius: SCREEN_WIDTH > 500 ? 40 : 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  btnContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
  },
  footer: {
    marginTop: 60,
    alignItems: "center",
  },
  switchBtn: {
    marginBottom: 40,
  },
  switchText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },
  switchTextBold: {
    color: "#fff",
    fontWeight: "900",
  },
  socialStrip: {
    flexDirection: "row",
    gap: 32,
  },
  socialBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
