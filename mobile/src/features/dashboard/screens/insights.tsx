import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import ScreenLayout from '../../../components/ScreenLayout';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const InsightCard = ({ title, value, icon, color }: any) => {
  const themeColors = useThemeColor();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={[styles.iconBadge, { backgroundColor: color + '15' }]}>
        {React.cloneElement(icon, { size: 22, color: color })}
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={[styles.cardValue, { color: themeColors.text }]}>{value}</Text>
        <Text style={[styles.cardTitle, { color: themeColors.subtext }]}>{title}</Text>
      </View>
    </View>
  );
};

const InsightsScreen = observer(() => {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    totalDeals: 0,
    propertiesForSale: 0,
    propertiesForRent: 0
  });

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await adminService.getStats();
      const data = response.data;
      setStats({
        totalUsers: data.totalUsers || 0,
        totalAgents: data.totalAgents || data.total_agents || 0,
        totalProperties: data.totalProperties || 0,
        totalDeals: data.totalDeals || 0,
        propertiesForSale: data.propertiesForSale || 0,
        propertiesForRent: data.propertiesForRent || 0
      });
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      setError(error.response?.data?.message || 'Failed to fetch platform data.');
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
        <View style={styles.centered}>
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
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />,
        showsVerticalScrollIndicator: false,
      }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Platform Insights</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>Real-time growth and performance metrics</Text>
      </View>

      {error && (
        <View style={[styles.errorBox, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '20' }]}>
          <Ionicons name="alert-circle" size={20} color={themeColors.danger} />
          <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={{ color: themeColors.primary, fontWeight: '700', fontSize: 13 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsGrid}>
        <InsightCard 
          title="Total Users"
          value={stats.totalUsers}
          color="#3b82f6"
          icon={<Ionicons name="people" />}
        />
        <InsightCard 
          title="Agents"
          value={stats.totalAgents}
          color="#8b5cf6"
          icon={<MaterialCommunityIcons name="badge-account" />}
        />
        <InsightCard 
          title="Properties"
          value={stats.totalProperties}
          color="#10b981"
          icon={<Ionicons name="business" />}
        />
        <InsightCard 
          title="Total Deals"
          value={stats.totalDeals}
          color="#f59e0b"
          icon={<MaterialCommunityIcons name="handshake" />}
        />
      </View>

      <View style={styles.detailsSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Property Distribution</Text>
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.breakdownLabel, { color: themeColors.subtext }]}>For Sale</Text>
              <Text style={[styles.breakdownValue, { color: themeColors.text }]}>{stats.propertiesForSale}</Text>
            </View>
          </View>
          <View style={[styles.breakdownItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.breakdownLabel, { color: themeColors.subtext }]}>For Rent</Text>
              <Text style={[styles.breakdownValue, { color: themeColors.text }]}>{stats.propertiesForRent}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={[styles.infoIconContainer, { backgroundColor: themeColors.primary + '15' }]}>
          <Ionicons name="information-circle" size={20} color={themeColors.primary} />
        </View>
        <Text style={[styles.summaryText, { color: themeColors.subtext }]}>
          Metrics are updated in real-time as properties and users are added to the platform.
        </Text>
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
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  detailsSection: {
    marginTop: 36,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryBox: {
    marginTop: 36,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  }
});

export default InsightsScreen;
