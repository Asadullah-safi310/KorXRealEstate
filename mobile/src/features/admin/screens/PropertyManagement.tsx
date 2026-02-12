import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import { locationService } from '../../../services/location.service';

const PropertyManagement = observer(() => {
  const router = useRouter();
  const { purpose, status, agent_id } = useLocalSearchParams();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  // Filters
  const [filters, setFilters] = useState({
    city: '',
    purpose: (purpose as string) || '', // SALE, RENT
    status: (status as string) || '', // available, sold, rented
    is_promoted: undefined,
    agent_id: (agent_id as string) || '',
  });

  const fetchProperties = useCallback(async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: 10,
        search,
        ...filters,
      };

      const response = await adminService.getProperties(params);
      const { properties: newProps, pages } = response.data;
      
      setProperties(prev => shouldAppend ? [...prev, ...newProps] : newProps);
      setTotalPages(pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchProperties(page + 1, true);
    }
  };

  const renderPropertyItem = ({ item }: { item: any }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity 
          style={[styles.propertyListItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => router.push(`/property/${item.property_id}`)}
        >
          <View style={styles.listMain}>
            <View style={styles.listTitleContainer}>
              <AppText variant="body" weight="bold" numberOfLines={1}>{item.title}</AppText>
              <AppText variant="tiny" color={themeColors.subtext} numberOfLines={1}>{item.city}</AppText>
            </View>
            <View style={[styles.statusBadgeSmall, { backgroundColor: item.status === 'available' ? '#ecfdf5' : '#fef2f2' }]}>
              <AppText variant="tiny" weight="bold" color={item.status === 'available' ? '#059669' : '#dc2626'}>
                {item.status.toUpperCase()}
              </AppText>
            </View>
          </View>
          <View style={styles.listSub}>
            <AppText variant="caption" color={themeColors.primary} weight="bold">
              {item.is_available_for_sale ? 'SALE' : 'RENT'}
            </AppText>
            <View style={[styles.listDivider, { backgroundColor: themeColors.border }]} />
            <AppText variant="caption" color={themeColors.subtext}>
              By: {item.Agent?.full_name || 'Unassigned'}
            </AppText>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.propertyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.propertyHeader}>
          <View style={styles.titleInfo}>
            <AppText variant="body" weight="bold">{item.title}</AppText>
            <AppText variant="caption" color={themeColors.subtext}>{item.location}, {item.city}</AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'available' ? '#ecfdf5' : '#fef2f2' }]}>
            <AppText variant="tiny" weight="bold" color={item.status === 'available' ? '#059669' : '#dc2626'}>
              {item.status.toUpperCase()}
            </AppText>
          </View>
        </View>

        <View style={styles.propertyDetails}>
          <DetailItem icon="person-outline" text={item.Owner?.full_name || 'No Owner'} theme={themeColors} />
          <DetailItem icon="shield-checkmark-outline" text={item.Agent?.full_name || 'Unassigned'} theme={themeColors} />
          <DetailItem icon="pricetag-outline" text={item.is_available_for_sale ? 'Sale' : 'Rent'} theme={themeColors} />
        </View>

        <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push(`/property/${item.property_id}`)}
          >
            <Ionicons name="eye-outline" size={18} color={themeColors.primary} />
            <AppText variant="caption" weight="bold" color={themeColors.primary} style={{ marginLeft: 4 }}>View</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push(`/property/edit/${item.property_id}`)}
          >
            <Ionicons name="create-outline" size={18} color={themeColors.text} />
            <AppText variant="caption" weight="bold" style={{ marginLeft: 4 }}>Edit</AppText>
          </TouchableOpacity>
          {item.is_promoted ? (
               <View style={styles.promotedBadge}>
                   <Ionicons name="star" size={12} color="#f59e0b" />
                   <AppText variant="tiny" weight="bold" color="#f59e0b" style={{ marginLeft: 2 }}>VIP</AppText>
               </View>
          ) : (
              <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="star-outline" size={18} color="#f59e0b" />
                  <AppText variant="caption" weight="bold" color="#f59e0b" style={{ marginLeft: 4 }}>Promote</AppText>
              </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout backgroundColor={themeColors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <AppText variant="title" weight="bold" style={{ marginLeft: 16 }}>Property Management</AppText>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.viewToggle, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
            >
              <Ionicons name={viewMode === 'card' ? 'list-outline' : 'grid-outline'} size={20} color={themeColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => router.push('/property/create')}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subtext} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search properties..."
              placeholderTextColor={themeColors.subtext}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, { borderColor: themeColors.border }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={item => item.property_id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={themeColors.primary} /> : null}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText variant="body" color={themeColors.subtext}>No properties found</AppText>
              </View>
            }
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.modalHeader}>
              <AppText variant="title" weight="bold">Filters</AppText>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterOptions}>
              <FilterSection title="Purpose" options={['SALE', 'RENT']} selected={filters.purpose} onSelect={(val) => setFilters({...filters, purpose: val})} theme={themeColors} />
              <FilterSection title="Status" options={['available', 'sold', 'rented']} selected={filters.status} onSelect={(val) => setFilters({...filters, status: val})} theme={themeColors} />
              <FilterSection title="Promoted" options={['true', 'false']} selected={filters.is_promoted?.toString()} onSelect={(val) => setFilters({...filters, is_promoted: val === 'true' as any})} theme={themeColors} />
            </ScrollView>

            <TouchableOpacity 
              style={[styles.applyBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => {
                setShowFilters(false);
                fetchProperties(1);
              }}
            >
              <AppText variant="body" weight="bold" color="#fff">Apply Filters</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => {
                setFilters({ city: '', purpose: '', status: '', is_promoted: undefined, agent_id: '' });
                setSearch('');
              }}
            >
              <AppText variant="body" color={themeColors.subtext}>Reset All</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
});

const DetailItem = ({ icon, text, theme }: any) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={14} color={theme.subtext} />
    <AppText variant="caption" color={theme.subtext} style={{ marginLeft: 4 }}>{text}</AppText>
  </View>
);

const FilterSection = ({ title, options, selected, onSelect, theme }: any) => (
  <View style={styles.filterSection}>
    <AppText variant="body" weight="bold" style={{ marginBottom: 8 }}>{title}</AppText>
    <View style={styles.optionRow}>
      {options.map((opt: string) => (
        <TouchableOpacity 
          key={opt}
          style={[
            styles.optionChip, 
            { borderColor: theme.border },
            selected === opt && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => onSelect(selected === opt ? '' : opt)}
        >
          <AppText variant="tiny" weight="bold" color={selected === opt ? '#fff' : theme.text}>
            {opt.toUpperCase()}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  propertyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propertyListItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  listMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listSub: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterOptions: {
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  applyBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetBtn: {
    alignItems: 'center',
    padding: 12,
  },
});

export default PropertyManagement;
