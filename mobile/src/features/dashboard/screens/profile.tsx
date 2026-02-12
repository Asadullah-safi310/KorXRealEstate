import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, RefreshControl, useColorScheme } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import authStore from '../../../stores/AuthStore';
import propertyStore from '../../../stores/PropertyStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import dealStore from '../../../stores/DealStore';
import Avatar from '../../../components/Avatar';
import ScreenLayout from '../../../components/ScreenLayout';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useLanguage } from '../../../contexts/LanguageContext';
import themeStore from '../../../stores/ThemeStore';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, label, value, color, index = 0 }: any) => {
  const themeColors = useThemeColor();
  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500)}
      style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
    >
      <View style={[styles.statIconBadge, { backgroundColor: color + '12' }]}>
        {React.cloneElement(icon, { size: 18, color: color })}
      </View>
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: themeColors.subtext }]}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const ProfileScreen = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const system = useColorScheme();
  const { t } = useLanguage();
  const user = authStore.user;
  const userId = user?.user_id;
  const isAuthenticated = authStore.isAuthenticated;
  const isAgent = authStore.isAgent;
  const isAdmin = authStore.isAdmin;
  const [refreshing, setRefreshing] = useState(false);
  const isDark = themeStore.theme === 'dark' || (themeStore.theme === 'system' && system === 'dark');

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    const promises: Promise<any>[] = [];
    promises.push(propertyStore.fetchDashboardStats());
    if (isAgent) promises.push(dealStore.fetchDeals());

    if (userId) {
      promises.push(propertyStore.fetchUserProperties(userId, 5));
    }

    await Promise.all(promises);
  }, [isAuthenticated, isAgent, userId]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Sign Out", 
        style: "destructive",
        onPress: async () => {
          await authStore.logout();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const toggleTheme = () => {
    themeStore.setTheme(isDark ? 'light' : 'dark');
  };

  if (!isAuthenticated) {
    return (
      <ScreenLayout backgroundColor={themeColors.background}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconContainer}>
            <View style={[styles.guestIconBg, { backgroundColor: themeColors.primary + '10' }]}>
              <Ionicons name="person" size={60} color={themeColors.primary} />
            </View>
          </View>
          <Text style={[styles.guestTitle, { color: themeColors.text }]}>Premium Real Estate</Text>
          <Text style={[styles.guestSubtitle, { color: themeColors.subtext }]}>Sign in to access your portfolio, track deals, and manage listings.</Text>
          
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: themeColors.primary }]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.loginButtonText, { color: '#fff' }]}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const stats = propertyStore.dashboardStats || {
    total_managed: 0, total_assigned: 0, total_listed: 0,
    public_listings: 0, for_sale: 0, for_rent: 0, active_deals: 0
  };

  return (
    <ScreenLayout 
      backgroundColor={themeColors.background}
      scrollable={true}
      bottomSpacing={10}
      edges={['top', 'left', 'right']}
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        )
      }}
    >
      {/* Profile Header Card */}
      <View style={[styles.premiumHeaderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.headerBackground}>
          <View style={[styles.bgCircle, { backgroundColor: themeColors.primary + '08', top: -50, right: -50 }]} />
          <View style={[styles.bgCircle, { backgroundColor: themeColors.primary + '05', bottom: -80, left: -20, width: 200, height: 200 }]} />
        </View>

        <View style={styles.profileMain}>
          <View style={styles.avatarContainer}>
            <Avatar user={user} size="xl" />
            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: themeColors.primary, borderColor: themeColors.card }]}
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: themeColors.text }]}>{user?.full_name}</Text>
              {isAgent && <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} style={{ marginLeft: 4 }} />}
            </View>
            <Text style={[styles.roleLabel, { color: themeColors.primary }]}>{user?.role?.toUpperCase()} PARTNER</Text>
            
            <View style={styles.contactChips}>
              <View style={[styles.chip, { backgroundColor: themeColors.background }]}>
                <Ionicons name="mail" size={12} color={themeColors.subtext} />
                <Text style={[styles.chipText, { color: themeColors.subtext }]} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.quickActionRow}>
          {authStore.hasPermission('ADD_PROPERTY') && (
            <TouchableOpacity 
              style={[styles.quickActionBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => router.push('/property/create')}
            >
              <View style={styles.btnIcon}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>Add Property</Text>
            </TouchableOpacity>
          )}
          {authStore.hasPermission('TRANSACTION_HISTORY') ? (
            <TouchableOpacity 
              style={[styles.quickActionBtn, { backgroundColor: themeColors.text }]}
              onPress={() => router.push('/deal/create')}
            >
              <View style={styles.btnIcon}>
                <MaterialCommunityIcons name="handshake" size={18} color={themeColors.card} />
              </View>
              <Text style={[styles.quickActionLabel, { color: themeColors.card }]}>New Transaction</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.quickActionBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
              onPress={() => router.push('/(tabs)/properties')}
            >
              <View style={styles.btnIcon}>
                <MaterialCommunityIcons name="search" size={18} color={themeColors.primary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: themeColors.text }]}>Discover</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dashboard Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Portfolio Insights</Text>
        <View style={styles.statsGrid}>
          {isAgent ? (
            <>
              <StatCard index={0} label="Managed" value={stats.total_managed} color="#3b82f6" icon={<Ionicons name="business" />} />
              <StatCard index={1} label="Active Deals" value={stats.active_deals} color="#f59e0b" icon={<Ionicons name="swap-horizontal" />} />
              <StatCard index={2} label="Public" value={stats.public_listings} color="#10b981" icon={<Ionicons name="globe" />} />
              <StatCard index={3} label="Listed" value={stats.total_listed} color="#8b5cf6" icon={<Ionicons name="list" />} />
            </>
          ) : (
            <>
              <StatCard index={0} label="My Properties" value={stats.total_listed} color="#3b82f6" icon={<Ionicons name="home" />} />
              <StatCard index={1} label="Public" value={stats.public_listings} color="#10b981" icon={<Ionicons name="globe" />} />
              <StatCard index={2} label="Favorites" value={0} color="#ef4444" icon={<Ionicons name="heart" />} />
              <StatCard index={3} label="Inquiries" value={0} color="#8b5cf6" icon={<Ionicons name="chatbubbles" />} />
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {isAdmin && (
            <MenuLink 
              index={0}
              icon="shield-checkmark-outline" 
              title="Admin Dashboard" 
              onPress={() => router.push('/admin')} 
              theme={themeColors}
            />
          )}
          {authStore.hasPermission('MY_PROPERTIES') && (
            <MenuLink 
              index={1}
              icon="home-outline" 
              title="My Properties" 
              onPress={() => router.push('/profile/my-properties')} 
              theme={themeColors}
            />
          )}
          {authStore.hasPermission('MY_TOWERS') && (
            <MenuLink 
              index={2}
              icon="business-outline" 
              title="My Towers" 
              onPress={() => router.push('/profile/my-apartments')} 
              theme={themeColors}
            />
          )}
          {authStore.hasPermission('MY_MARKETS') && (
            <MenuLink 
              index={3}
              icon="storefront-outline" 
              title="My Markets" 
              onPress={() => router.push('/profile/my-markets')} 
              theme={themeColors}
            />
          )}
          {authStore.hasPermission('MY_SHARAKS') && (
            <MenuLink 
              index={4}
              icon="people-outline" 
              title="My Sharaks" 
              onPress={() => router.push('/profile/my-sharaks')} 
              theme={themeColors}
            />
          )}
          {authStore.hasPermission('TRANSACTION_HISTORY') && (
            <MenuLink 
              index={5}
              icon="handshake" 
              iconFamily="MaterialCommunityIcons"
              title="Transaction History" 
              onPress={() => router.push('/deal')} 
              theme={themeColors}
            />
          )}
          <MenuLink 
            index={6}
            icon="heart-outline" 
            title="Saved Favorites" 
            onPress={() => router.push('/profile/favorites')} 
            theme={themeColors}
          />
          <MenuLink 
            index={7}
            icon={isDark ? "sunny-outline" : "moon-outline"}
            title={t('profile.darkMode')}
            onPress={toggleTheme}
            theme={themeColors}
          />
          <MenuLink 
            index={8}
            icon="information-circle-outline"
            title={t('profile.about')}
            onPress={() => Alert.alert(t('profile.about'), 'Coming soon')}
            theme={themeColors}
          />
          <MenuLink 
            index={9}
            icon="settings-outline" 
            title="Account Settings" 
            onPress={() => router.push('/profile/settings')} 
            theme={themeColors}
          />
          <MenuLink 
            index={10}
            icon="help-circle-outline" 
            title="Support Center" 
            onPress={() => router.push('/profile/help')} 
            theme={themeColors}
            isLast
          />
        </View>

        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <LanguageSwitcher />
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: themeColors.danger + '40' }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={themeColors.danger} />
          <Text style={[styles.logoutBtnText, { color: themeColors.danger }]}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: themeColors.subtext }]}>Real Estate Pro • Version 1.0.0</Text>
        </View>
      </View>
    </ScreenLayout>
  );
});

const MenuLink = ({ icon, iconFamily = 'Ionicons', title, onPress, theme, isLast, index = 0 }: any) => (
  <Animated.View entering={FadeInRight.delay(index * 50 + 400).duration(400)}>
    <TouchableOpacity 
      style={[styles.menuLink, !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 }]} 
      onPress={onPress}
    >
      <View style={[styles.menuIconBox, { backgroundColor: theme.background }]}>
        {iconFamily === 'Ionicons' ? (
          <Ionicons name={icon} size={20} color={theme.primary} />
        ) : (
          <MaterialCommunityIcons name={icon} size={20} color={theme.primary} />
        )}
      </View>
      <Text style={[styles.menuLinkText, { color: theme.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.border} />
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  premiumHeaderCard: {
    margin: 20,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  contactChips: {
    flexDirection: 'row',
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  menuCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 8,
    marginBottom: 24,
  },
  menuLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  guestIconContainer: {
    marginBottom: 32,
  },
  guestIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  guestSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.7,
  },
  loginButton: {
    width: '100%',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ProfileScreen;
