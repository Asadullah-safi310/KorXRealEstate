import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import { useLanguage } from '../../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, label, value, color }: any) => {
  const themeColors = useThemeColor();
  return (
    <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={[styles.statIconBadge, { backgroundColor: color + '15' }]}>
        {React.cloneElement(icon, { size: 20, color })}
      </View>
      <View style={styles.statInfo}>
        <AppText variant="title" weight="bold">{value}</AppText>
        <AppText variant="caption" weight="medium" color={themeColors.subtext}>{label}</AppText>
      </View>
    </View>
  );
};

const AdminDashboard = observer(() => {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalProperties: 0,
    totalDeals: 0,
    propertiesForSale: 0,
    propertiesForRent: 0,
    totalAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColor();
  const { t } = useLanguage();

  const fetchStats = async () => {
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <ScreenLayout backgroundColor={themeColors.background}>
        <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      scrollable
      backgroundColor={themeColors.background}
      bottomSpacing={100}
      scrollProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
        showsVerticalScrollIndicator: false,
      }}
    >
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.premiumHeaderTop}>
          <View>
            <AppText variant="h1" weight="bold" color={themeColors.text}>{t('dashboard.adminConsole')}</AppText>
            <AppText variant="small" weight="medium" color={themeColors.subtext}>{t('dashboard.systemStatus')}</AppText>
          </View>
          <TouchableOpacity
            style={[styles.premiumProfileBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="shield-checkmark" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.premiumStatsRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.premiumMetaItem}>
            <AppText variant="h3" weight="bold" color={themeColors.text}>{stats.totalUsers}</AppText>
            <AppText variant="caption" weight="semiBold" color={themeColors.subtext} style={{ textTransform: 'uppercase' }}>{t('dashboard.users')}</AppText>
          </View>
          <View style={[styles.premiumMetaDivider, { backgroundColor: themeColors.border }]} />
          <View style={styles.premiumMetaItem}>
            <AppText variant="h3" weight="bold" color={themeColors.text}>{stats.totalAgents || 0}</AppText>
            <AppText variant="caption" weight="semiBold" color={themeColors.subtext} style={{ textTransform: 'uppercase' }}>{t('dashboard.agents')}</AppText>
          </View>
          <View style={[styles.premiumMetaDivider, { backgroundColor: themeColors.border }]} />
          <View style={styles.premiumMetaItem}>
            <AppText variant="h3" weight="bold" color={themeColors.text}>{stats.totalDeals}</AppText>
            <AppText variant="caption" weight="semiBold" color={themeColors.subtext} style={{ textTransform: 'uppercase' }}>{t('deals.deals')}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.sectionHeaderRow}>
          <AppText variant="title" weight="bold" color={themeColors.text}>{t('dashboard.globalStatistics')}</AppText>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label={t('dashboard.totalProperties')}
            value={stats.totalProperties}
            color={themeColors.info}
            icon={<Ionicons name="business" />}
          />
          <StatCard
            label={t('dashboard.activeDeals')}
            value={stats.totalDeals}
            color={themeColors.warning}
            icon={<MaterialCommunityIcons name="handshake" />}
          />
          <StatCard
            label={t('property.forSale')}
            value={stats.propertiesForSale}
            color={themeColors.success}
            icon={<Ionicons name="pricetag" />}
          />
          <StatCard
            label={t('property.forRent')}
            value={stats.propertiesForRent}
            color={themeColors.primary}
            icon={<Ionicons name="key" />}
          />
        </View>

        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <AppText variant="title" weight="bold" color={themeColors.text}>{t('dashboard.managementTools')}</AppText>
        </View>

        <View style={styles.adminToolGrid}>
          <TouchableOpacity
            style={[styles.premiumToolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/admin/users')}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: themeColors.infoSubtle }]}>
              <Ionicons name="people" size={24} color={themeColors.info} />
            </View>
            <AppText variant="body" weight="bold" color={themeColors.text}>{t('dashboard.users')}</AppText>
            <AppText variant="caption" color={themeColors.subtext}>{t('dashboard.rolesPermissions')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.premiumToolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/admin/properties')}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: themeColors.successSubtle }]}>
              <Ionicons name="business" size={24} color={themeColors.success} />
            </View>
            <AppText variant="body" weight="bold" color={themeColors.text}>{t('property.properties')}</AppText>
            <AppText variant="caption" color={themeColors.subtext}>{t('dashboard.reviewAllListings')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.premiumToolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/admin/agents')}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: themeColors.warningSubtle }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={themeColors.warning} />
            </View>
            <AppText variant="body" weight="bold" color={themeColors.text}>{t('dashboard.agents')}</AppText>
            <AppText variant="caption" color={themeColors.subtext}>{t('dashboard.analyzeGrowth')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.premiumToolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/admin/deals')}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: '#8b5cf615' }]}>
              <MaterialCommunityIcons name="handshake" size={24} color="#8b5cf6" />
            </View>
            <AppText variant="body" weight="bold" color={themeColors.text}>{t('deals.deals')}</AppText>
            <AppText variant="caption" color={themeColors.subtext}>{t('dashboard.systemPlatform')}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  premiumHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumProfileBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  premiumStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  premiumMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  premiumMetaDivider: {
    width: 1,
    height: 24,
  },
  mainContent: {
    padding: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  adminToolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  premiumToolCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
});

export default AdminDashboard;
