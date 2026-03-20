import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export const SettingItem = ({
  icon,
  color,
  title,
  subtitle,
  onPress,
  rightContent,
  isLast = false,
}: {
  icon?: string | React.ReactNode;
  color?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  isLast?: boolean;
}) => {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';
  
  return (
    <Pressable
      style={({ pressed }) => [
        settingsStyles.settingItem,
        pressed && onPress && !rightContent && (isDark ? settingsStyles.pressedDark : settingsStyles.pressed),
      ]}
      onPress={onPress}
      disabled={!onPress && !rightContent}
    >
      {typeof icon === 'string' ? (
        <View style={[settingsStyles.iconContainer, { backgroundColor: color || 'transparent' }]}>
          <Ionicons name={icon as any} size={20} color={color ? "#fff" : (isDark ? "#fff" : "#000")} />
        </View>
      ) : icon}
      <View style={[settingsStyles.itemContent, !isLast && [settingsStyles.itemBorder, isDark && settingsStyles.itemBorderDark]]}>
        <View style={settingsStyles.itemTextContainer}>
          <Text style={[settingsStyles.itemTitle, isDark && settingsStyles.textDark]}>
            {title}
          </Text>
          {subtitle && <Text style={settingsStyles.itemSubtitle}>{subtitle}</Text>}
        </View>
        <View style={settingsStyles.rightContainer}>
          {rightContent ? (
            rightContent
          ) : onPress ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#555" : "#c7c7cc"}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export const SectionHeader = ({ title }: { title: string }) => (
  <View style={settingsStyles.sectionHeader}>
    <Text style={settingsStyles.sectionHeaderText}>{title}</Text>
  </View>
);

export const settingsStyles = StyleSheet.create({
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardDark: {
    backgroundColor: "#17212b", // Telegram Dark Surface
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    minHeight: 60,
  },
  pressed: {
    backgroundColor: "#e5e5ea",
  },
  pressedDark: {
    backgroundColor: "#202b36", // Telegram Pressed Dark
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 16,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
  },
  itemBorderDark: {
    borderColor: "#0e1621", // Telegram Border Dark
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  itemTitle: {
    fontSize: 17,
    color: "#000",
  },
  itemSubtitle: {
    fontSize: 15,
    color: "#8e8e93",
    marginTop: 2,
  },
  textDark: {
    color: "#fff",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  containerDark: {
    backgroundColor: "#0e1621", // Telegram Deep Dark Background
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 60,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
});
