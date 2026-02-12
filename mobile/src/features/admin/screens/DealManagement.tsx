import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';

const DealManagement = observer(() => {
  const router = useRouter();
  const { status, agent_id, property_id } = useLocalSearchParams();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState((status as string) || ''); // active, completed, canceled

  const fetchDeals = useCallback(async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = {
        page: pageNum,
        limit: 10,
        status: statusFilter,
      };

      if (agent_id) params.agent_id = agent_id;
      if (property_id) params.property_id = property_id;

      const response = await adminService.getDeals(params);
      const { deals: newDeals, pages } = response.data;
      
      setDeals(prev => shouldAppend ? [...prev, ...newDeals] : newDeals);
      setTotalPages(pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDeals(1);
  }, [fetchDeals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2563eb';
      case 'completed': return '#059669';
      case 'canceled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const renderDealItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.dealCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={() => router.push(`/deal/${item.deal_id}`)}
    >
      <View style={styles.dealHeader}>
        <View style={styles.dealType}>
          <AppText variant="caption" weight="bold" color={themeColors.primary}>
            {item.deal_type}
          </AppText>
          <AppText variant="tiny" color={themeColors.subtext}>
            ID: #{item.deal_id}
          </AppText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '10' }]}>
          <AppText variant="tiny" weight="bold" color={getStatusColor(item.status)}>
            {item.status.toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={styles.dealInfo}>
        <AppText variant="body" weight="bold" numberOfLines={1}>{item.Property?.title}</AppText>
        <AppText variant="caption" color={themeColors.subtext}>Agent: {item.Agent?.full_name}</AppText>
        
        <View style={styles.peopleRow}>
          <View style={styles.personInfo}>
            <AppText variant="tiny" color={themeColors.subtext}>Seller</AppText>
            <AppText variant="caption" weight="medium">{item.Seller?.full_name}</AppText>
          </View>
          <Ionicons name="arrow-forward" size={16} color={themeColors.border} />
          <View style={styles.personInfo}>
            <AppText variant="tiny" color={themeColors.subtext}>Buyer</AppText>
            <AppText variant="caption" weight="medium">{item.Buyer?.full_name}</AppText>
          </View>
        </View>
      </View>

      <View style={[styles.dealFooter, { borderTopColor: themeColors.border }]}>
        <AppText variant="body" weight="bold" color={themeColors.primary}>
          Rs {parseFloat(item.price).toLocaleString()}
        </AppText>
        <AppText variant="tiny" color={themeColors.subtext}>
          {new Date(item.createdAt).toLocaleDateString()}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout backgroundColor={themeColors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <AppText variant="title" weight="bold" style={{ marginLeft: 16 }}>Deal Management</AppText>
        </View>

        <View style={styles.filterRow}>
          <FilterChip label="All" active={statusFilter === ''} onPress={() => setStatusFilter('')} theme={themeColors} />
          <FilterChip label="Active" active={statusFilter === 'active'} onPress={() => setStatusFilter('active')} theme={themeColors} />
          <FilterChip label="Completed" active={statusFilter === 'completed'} onPress={() => setStatusFilter('completed')} theme={themeColors} />
          <FilterChip label="Canceled" active={statusFilter === 'canceled'} onPress={() => setStatusFilter('canceled')} theme={themeColors} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={deals}
            renderItem={renderDealItem}
            keyExtractor={item => item.deal_id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (page < totalPages && !loadingMore) {
                fetchDeals(page + 1, true);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={themeColors.primary} /> : null}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText variant="body" color={themeColors.subtext}>No deals found</AppText>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  );
});

const FilterChip = ({ label, active, onPress, theme }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.filterChip, 
      { borderColor: theme.border },
      active && { backgroundColor: theme.primary, borderColor: theme.primary }
    ]}
  >
    <AppText variant="tiny" weight="bold" color={active ? '#fff' : theme.text}>
      {label}
    </AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  dealCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dealType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealInfo: {
    marginBottom: 16,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 12,
  },
  personInfo: {
    flex: 1,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
});

export default DealManagement;
