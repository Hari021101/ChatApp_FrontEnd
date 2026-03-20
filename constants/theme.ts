/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    primary: "#3390ec", // Telegram Blue
    secondary: "#54a9eb", // Telegram Light Blue
    text: "#000000",
    textMuted: "#707579",
    background: "#ffffff",
    surface: "#ffffff",
    border: "#dfdfe5",
    tint: "#3390ec",
    icon: "#707579",
    tabIconDefault: "#b0b3b8",
    tabIconSelected: "#3390ec",
    success: "#42B72A",
    error: "#e53935",
  },
  dark: {
    primary: "#2AABEE", // Telegram Dark Blue Accent
    secondary: "#54a9eb",
    text: "#ffffff",
    textMuted: "#7d8b99",
    background: "#0e1621", // Telegram Deep Dark Background
    surface: "#17212b", // Telegram Dark Surface Header/Cards
    border: "#2b3643",
    tint: "#2AABEE",
    icon: "#7d8b99",
    tabIconDefault: "#6e7c87",
    tabIconSelected: "#2AABEE",
    success: "#50a747",
    error: "#e53935",
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
