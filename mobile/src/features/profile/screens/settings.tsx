import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, useColorScheme, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { observer } from 'mobx-react-lite';
import themeStore from '../../../stores/ThemeStore';
import ScreenLayout from '../../../components/ScreenLayout';

const SettingsScreen = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const system = useColorScheme();

  const isDark = themeStore.theme === 'dark' || (themeStore.theme === 'system' && system === 'dark');

  const toggle = () => {
    themeStore.setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ScreenLayout backgroundColor={themeColors.background}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text>
        
        <View style={[styles.settingCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '15' }]}>
              <MaterialCommunityIcons 
                name={isDark ? "weather-night" : "weather-sunny"} 
                size={22} 
                color={themeColors.primary} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSublabel, { color: themeColors.subtext }]}>
                {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
              </Text>
            </View>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={toggle} 
            trackColor={{ false: themeColors.border, true: themeColors.primary + '80' }}
            thumbColor={isDark ? themeColors.primary : '#f4f3f4'}
            ios_backgroundColor={themeColors.border}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 32 }]}>General</Text>
        
        <TouchableOpacity style={[styles.settingCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconContainer, { backgroundColor: '#6366f115' }]}>
              <Ionicons name="notifications-outline" size={22} color="#6366f1" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Notifications</Text>
              <Text style={[styles.settingSublabel, { color: themeColors.subtext }]}>Manage your alerts and updates</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 12 }]}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconContainer, { backgroundColor: '#ec489915' }]}>
              <Ionicons name="shield-outline" size={22} color="#ec4899" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Privacy & Security</Text>
              <Text style={[styles.settingSublabel, { color: themeColors.subtext }]}>Account safety and data usage</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: themeColors.subtext }]}>Version 2.1.0</Text>
        <Text style={[styles.footerBrand, { color: themeColors.primary }]}>Premium Real Estate</Text>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingSublabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  footer: {
    marginTop: 80,
    alignItems: 'center',
    gap: 6,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});

export default SettingsScreen;
