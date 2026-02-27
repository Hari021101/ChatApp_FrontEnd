/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    text: "#1e293b",
    textMuted: "#64748b",
    background: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    tint: "#6366f1",
    icon: "#64748b",
    tabIconDefault: "#94a3b8",
    tabIconSelected: "#6366f1",
    success: "#10b981",
    error: "#ef4444",
  },
  dark: {
    primary: "#818cf8",
    secondary: "#a78bfa",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    background: "#0f172a",
    surface: "#1e293b",
    border: "#334155",
    tint: "#818cf8",
    icon: "#94a3b8",
    tabIconDefault: "#475569",
    tabIconSelected: "#f1f5f9",
    success: "#34d399",
    error: "#f87171",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
