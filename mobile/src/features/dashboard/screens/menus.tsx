import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, useColorScheme, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { observer } from 'mobx-react-lite';
import themeStore from '../../../stores/ThemeStore';
import ScreenLayout from '../../../components/ScreenLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useLanguage } from '../../../contexts/LanguageContext';

const MenusScreen = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const system = useColorScheme();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const isDark = themeStore.theme === 'dark' || (themeStore.theme === 'system' && system === 'dark');

  const toggleTheme = () => {
    themeStore.setTheme(isDark ? 'light' : 'dark');
  };

  const menuItems = [
    {
      id: 'favorites',
      label: t('profile.myFavorites'),
      sublabel: 'Your saved properties',
      icon: 'heart',
      color: '#ec4899',
      action: () => router.push('/profile/favorites'),
    },
    {
      id: 'support',
      label: t('profile.help'),
      sublabel: 'Get help and support',
      icon: 'help-circle-outline',
      color: '#10b981',
      action: () => router.push('/profile/help'),
    },
    {
      id: 'about',
      label: t('profile.about'),
      sublabel: 'Learn more about our app',
      icon: 'information-circle-outline',
      color: '#f59e0b',
      action: () => {
        // Navigate to about page when implemented
      },
    },
  ];

  return (
    <ScreenLayout backgroundColor={themeColors.background} bottomSpacing={100}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Explore{"\n"}More</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('profile.settings')}</Text>
        
        <View style={[styles.menuCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.menuInfo}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '15' }]}>
              <MaterialCommunityIcons 
                name={isDark ? "weather-night" : "weather-sunny"} 
                size={22} 
                color={themeColors.primary} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.menuLabel, { color: themeColors.text }]}>{t('profile.darkMode')}</Text>
              <Text style={[styles.menuSublabel, { color: themeColors.subtext }]}>
                {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
              </Text>
            </View>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme} 
            trackColor={{ false: themeColors.border, true: themeColors.primary + '80' }}
            thumbColor={isDark ? themeColors.primary : '#f4f3f4'}
            ios_backgroundColor={themeColors.border}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <LanguageSwitcher />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 32 }]}>My Content</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.menuCard, 
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              index > 0 && { marginTop: 12 }
            ]}
            onPress={item.action}
          >
            <View style={styles.menuInfo}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.menuLabel, { color: themeColors.text }]}>{item.label}</Text>
                <Text style={[styles.menuSublabel, { color: themeColors.subtext }]}>{item.sublabel}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
          </TouchableOpacity>
        ))}

        <View style={styles.loginPrompt}>
          <View style={[styles.loginCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.menuInfo}>
              <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '15' }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={themeColors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.loginTitle, { color: themeColors.text }]}>{t('auth.signIn')}</Text>
                <Text style={[styles.loginSubtitle, { color: themeColors.subtext }]}>
                  Create an account to list properties, save favorites, and access exclusive features
                </Text>
              </View>
            </View>

            <View style={styles.loginActions}>
              <TouchableOpacity 
                style={[styles.loginBtn, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.loginBtnText}>{t('auth.signIn')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.registerBtn, { borderColor: themeColors.primary + '40', backgroundColor: themeColors.primary + '08' }]}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={[styles.registerText, { color: themeColors.primary }]}>
                  {t('auth.dontHaveAccount')} <Text style={{ fontWeight: '800' }}>{t('auth.register')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: themeColors.subtext }]}>Version 2.1.0</Text>
          <Text style={[styles.footerBrand, { color: themeColors.primary }]}>KorX Real Estate</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -1,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  menuCard: {
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
  menuInfo: {
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
  menuLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  menuSublabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  loginPrompt: {
    marginTop: 32,
    marginBottom: 20,
  },
  loginCard: {
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
  loginTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  loginSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '500',
  },
  loginActions: {
    marginTop: 16,
    gap: 10,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  registerBtn: {
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  registerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
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

export default MenusScreen;
