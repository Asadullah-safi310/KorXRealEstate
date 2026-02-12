import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import AdminStatCard from '../components/AdminStatCard';

const AdminDashboard = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <ScreenLayout 
      backgroundColor={themeColors.background} 
      scrollable 
      scrollProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <AppText variant="h1" weight="bold">Admin Panel</AppText>
            <AppText variant="body" color={themeColors.subtext}>System Insights & Management</AppText>
          </View>
          <TouchableOpacity 
            style={[styles.profileBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <AdminStatCard 
            title="Total Users" 
            value={stats?.totalUsers || 0} 
            icon="people" 
            color="#3b82f6" 
            onPress={() => router.push('/admin/users')}
          />
          <AdminStatCard 
            title="Total Agents" 
            value={stats?.totalAgents || 0} 
            icon="shield-checkmark" 
            color="#10b981" 
            onPress={() => router.push('/admin/agents')}
          />
          <AdminStatCard 
            title="Properties" 
            value={stats?.totalProperties || 0} 
            icon="business" 
            color="#f59e0b" 
            onPress={() => router.push('/admin/properties')}
          />
          <AdminStatCard 
            title="Total Deals" 
            value={stats?.totalDeals || 0} 
            icon="handshake" 
            iconFamily="MaterialCommunityIcons"
            color="#8b5cf6" 
            onPress={() => router.push('/admin/deals')}
          />
        </View>

        {/* Listing Insights */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={styles.sectionTitle}>Listing Type</AppText>
          <View style={styles.dealStats}>
            <TouchableOpacity 
              style={styles.dealStatItem}
              onPress={() => router.push('/admin/properties?purpose=SALE')}
            >
              <AppText variant="h3" weight="bold" color="#f59e0b">{stats?.propertiesForSale || 0}</AppText>
              <AppText variant="small" color={themeColors.subtext}>For Sale</AppText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity 
              style={styles.dealStatItem}
              onPress={() => router.push('/admin/properties?purpose=RENT')}
            >
              <AppText variant="h3" weight="bold" color="#8b5cf6">{stats?.propertiesForRent || 0}</AppText>
              <AppText variant="small" color={themeColors.subtext}>For Rent</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deal Insights */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={styles.sectionTitle}>Deal Status</AppText>
          <View style={styles.dealStats}>
            <View style={styles.dealStatItem}>
              <AppText variant="h3" weight="bold" color="#3b82f6">{stats?.activeDeals || 0}</AppText>
              <AppText variant="small" color={themeColors.subtext}>Active</AppText>
            </View>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <View style={styles.dealStatItem}>
              <AppText variant="h3" weight="bold" color="#10b981">{stats?.completedDeals || 0}</AppText>
              <AppText variant="small" color={themeColors.subtext}>Completed</AppText>
            </View>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <View style={styles.dealStatItem}>
              <AppText variant="h3" weight="bold" color="#ef4444">{stats?.canceledDeals || 0}</AppText>
              <AppText variant="small" color={themeColors.subtext}>Canceled</AppText>
            </View>
          </View>
        </View>

        {/* Recent Properties */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <AppText variant="title" weight="bold">Recent Properties</AppText>
            <TouchableOpacity onPress={() => router.push('/admin/properties')}>
              <AppText variant="small" color={themeColors.primary}>View All</AppText>
            </TouchableOpacity>
          </View>
          {stats?.recentProperties?.map((prop: any) => (
            <TouchableOpacity 
              key={prop.property_id} 
              style={[styles.listItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push(`/property/${prop.property_id}`)}
            >
              <View style={styles.listItemInfo}>
                <AppText variant="body" weight="bold" numberOfLines={1}>{prop.title}</AppText>
                <AppText variant="caption" color={themeColors.subtext}>
                  {prop.ProvinceData?.name} • Owned by {prop.Owner?.full_name}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Users */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <AppText variant="title" weight="bold">Recent Users</AppText>
            <TouchableOpacity onPress={() => router.push('/admin/users')}>
              <AppText variant="small" color={themeColors.primary}>View All</AppText>
            </TouchableOpacity>
          </View>
          {stats?.recentUsers?.map((user: any) => (
            <TouchableOpacity 
              key={user.user_id} 
              style={[styles.listItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push(`/admin/users?id=${user.user_id}`)}
            >
              <View style={styles.listItemInfo}>
                <AppText variant="body" weight="bold">{user.full_name}</AppText>
                <AppText variant="caption" color={themeColors.subtext}>
                  {user.email} • {user.role.toUpperCase()}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Management Quick Links */}
        <View style={styles.listSection}>
          <AppText variant="title" weight="bold" style={{ marginBottom: 12 }}>Management</AppText>
          <View style={styles.quickLinks}>
            <QuickLink 
              title="User Control" 
              icon="person-add" 
              onPress={() => router.push('/admin/users')} 
              theme={themeColors} 
            />
            <QuickLink 
              title="Property Audit" 
              icon="business" 
              onPress={() => router.push('/admin/properties')} 
              theme={themeColors} 
            />
            <QuickLink 
              title="Transaction Log" 
              icon="list" 
              onPress={() => router.push('/admin/deals')} 
              theme={themeColors} 
            />
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
});

const QuickLink = ({ title, icon, onPress, theme }: any) => (
  <TouchableOpacity 
    style={[styles.quickLink, { backgroundColor: theme.card, borderColor: theme.border }]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color={theme.primary} />
    <AppText variant="tiny" weight="bold" style={{ marginTop: 8 }}>{title}</AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  dealStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dealStatItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
  },
  listSection: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  listItemInfo: {
    flex: 1,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
});

export default AdminDashboard;
