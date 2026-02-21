import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, ScrollView, StatusBar as RNStatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import authStore from '../../../stores/AuthStore';
import { adminService } from '../../../services/admin.service';
import { locationService } from '../../../services/location.service';
import { personService } from '../../../services/person.service';

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
  const [agents, setAgents] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    province_id: '',
    district_id: '',
    area_id: '',
    purpose: (purpose as string) || '', // SALE, RENT
    status: (status as string) || '', // draft, active, inactive
    is_promoted: undefined as undefined | boolean,
    agent_id: (agent_id as string) || '',
    property_type: '',
    property_category: '',
    owner_name: '',
    created_by_user_id: '',
    bedrooms: '',
    bathrooms: '',
    min_price: '',
    max_price: '',
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

  useEffect(() => {
    RNStatusBar.setHidden(false, 'fade');
    RNStatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('rgba(0,0,0,0.36)');
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      RNStatusBar.setHidden(false, 'fade');
      RNStatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        RNStatusBar.setTranslucent(true);
        RNStatusBar.setBackgroundColor('rgba(0,0,0,0.36)');
      }
    }, [])
  );

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [agentsRes, provincesRes] = await Promise.all([
          personService.getAgents(),
          locationService.getProvinces(),
        ]);
        const users = agentsRes?.data || [];
        setAgents(users.filter((u: any) => u?.role !== 'admin'));
        setProvinces(provincesRes?.data || []);
      } catch (error) {
        console.error('Failed to load filter metadata:', error);
      }
    };

    loadFilterData();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!filters.province_id) {
        setDistricts([]);
        setAreas([]);
        return;
      }
      try {
        const res = await locationService.getDistricts(filters.province_id);
        setDistricts(res?.data || []);
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    };
    loadDistricts();
  }, [filters.province_id]);

  useEffect(() => {
    const loadAreas = async () => {
      if (!filters.district_id) {
        setAreas([]);
        return;
      }
      try {
        const res = await locationService.getAreas(filters.district_id);
        setAreas(res?.data || []);
      } catch (error) {
        console.error('Failed to load areas:', error);
      }
    };
    loadAreas();
  }, [filters.district_id]);

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
              <AppText variant="tiny" color={themeColors.subtext} numberOfLines={1}>
                {[item.DistrictData?.name, item.ProvinceData?.name].filter(Boolean).join(', ') || 'N/A'}
              </AppText>
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
            <AppText variant="caption" color={themeColors.subtext}>
              {[item.address, item.AreaData?.name, item.DistrictData?.name, item.ProvinceData?.name].filter(Boolean).join(', ') || 'N/A'}
            </AppText>
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
            onPress={() => router.push(`/property/create?id=${item.property_id}`)}
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
      <StatusBar style="light" translucent backgroundColor="rgba(0,0,0,0.36)" hidden={false} />
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
            {authStore.user?.role === 'agent' && (
              <TouchableOpacity 
                style={[styles.addBtn, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/property/create')}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            )}
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
              <View>
                <AppText variant="title" weight="bold">Filters</AppText>
                <AppText variant="tiny" color={themeColors.subtext}>Advanced filters: agent, type, province, district, area, beds, baths, purpose, status</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterOptions} showsVerticalScrollIndicator contentContainerStyle={styles.filterOptionsContent}>
              <FilterSection
                title="Agent"
                options={[
                  { label: 'Unassigned', value: 'none' },
                  ...agents.map((a: any) => ({ label: a.full_name || `Agent ${a.user_id}`, value: String(a.user_id) }))
                ]}
                selected={filters.agent_id}
                onSelect={(val) => setFilters({ ...filters, agent_id: val })}
                theme={themeColors}
              />
              <FilterSection
                title="Property Type"
                options={[
                  { label: 'House', value: 'house' },
                  { label: 'Apartment', value: 'apartment' },
                  { label: 'Shop', value: 'shop' },
                  { label: 'Office', value: 'office' },
                  { label: 'Land', value: 'land' },
                  { label: 'Plot', value: 'plot' },
                ]}
                selected={filters.property_type}
                onSelect={(val) => setFilters({ ...filters, property_type: val })}
                theme={themeColors}
              />
              <FilterSection
                title="Property Category"
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Apartment', value: 'apartment' },
                  { label: 'Tower', value: 'tower' },
                  { label: 'Market', value: 'market' },
                  { label: 'Sharak', value: 'sharak' },
                ]}
                selected={filters.property_category}
                onSelect={(val) => setFilters({ ...filters, property_category: val })}
                theme={themeColors}
              />
              <FilterSection
                title="Province"
                options={provinces.map((p: any) => ({ label: p.name, value: String(p.id) }))}
                selected={filters.province_id}
                onSelect={(val) =>
                  setFilters({
                    ...filters,
                    province_id: val,
                    district_id: '',
                    area_id: '',
                  })
                }
                theme={themeColors}
              />
              <FilterSection
                title="District"
                options={districts.map((d: any) => ({ label: d.name, value: String(d.id) }))}
                selected={filters.district_id}
                onSelect={(val) =>
                  setFilters({
                    ...filters,
                    district_id: val,
                    area_id: '',
                  })
                }
                theme={themeColors}
              />
              <FilterSection
                title="Area"
                options={areas.map((a: any) => ({ label: a.name, value: String(a.id) }))}
                selected={filters.area_id}
                onSelect={(val) => setFilters({ ...filters, area_id: val })}
                theme={themeColors}
              />
              <FilterSection title="Purpose" options={['SALE', 'RENT']} selected={filters.purpose} onSelect={(val) => setFilters({...filters, purpose: val})} theme={themeColors} />
              <FilterSection title="Status" options={['active', 'inactive', 'draft']} selected={filters.status} onSelect={(val) => setFilters({...filters, status: val})} theme={themeColors} />
              <FilterSection
                title="Promoted"
                options={['true', 'false']}
                selected={filters.is_promoted?.toString()}
                onSelect={(val) => setFilters({ ...filters, is_promoted: val ? val === 'true' : undefined })}
                theme={themeColors}
              />

              <View style={styles.filterSection}>
                <AppText variant="body" weight="bold" style={{ marginBottom: 8 }}>Owner Name</AppText>
                <TextInput
                  style={[styles.filterInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                  placeholder="Enter owner name"
                  placeholderTextColor={themeColors.subtext}
                  value={filters.owner_name}
                  onChangeText={(text) => setFilters({ ...filters, owner_name: text })}
                />
              </View>

              <View style={styles.filterSection}>
                <AppText variant="body" weight="bold" style={{ marginBottom: 8 }}>Created By User ID</AppText>
                <TextInput
                  style={[styles.filterInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                  placeholder="e.g. 12"
                  placeholderTextColor={themeColors.subtext}
                  keyboardType="numeric"
                  value={filters.created_by_user_id}
                  onChangeText={(text) => setFilters({ ...filters, created_by_user_id: text.replace(/[^0-9]/g, '') })}
                />
              </View>

              <View style={styles.filterSection}>
                <AppText variant="body" weight="bold" style={{ marginBottom: 8 }}>Price Range</AppText>
                <View style={styles.numericRow}>
                  <TextInput
                    style={[styles.filterInput, styles.numericInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                    placeholder="Min price"
                    placeholderTextColor={themeColors.subtext}
                    keyboardType="numeric"
                    value={filters.min_price}
                    onChangeText={(text) => setFilters({ ...filters, min_price: text.replace(/[^0-9]/g, '') })}
                  />
                  <TextInput
                    style={[styles.filterInput, styles.numericInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                    placeholder="Max price"
                    placeholderTextColor={themeColors.subtext}
                    keyboardType="numeric"
                    value={filters.max_price}
                    onChangeText={(text) => setFilters({ ...filters, max_price: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <AppText variant="body" weight="bold" style={{ marginBottom: 8 }}>Bedrooms / Bathrooms</AppText>
                <View style={styles.numericRow}>
                  <TextInput
                    style={[styles.filterInput, styles.numericInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                    placeholder="Bedrooms"
                    placeholderTextColor={themeColors.subtext}
                    keyboardType="numeric"
                    value={filters.bedrooms}
                    onChangeText={(text) => setFilters({ ...filters, bedrooms: text.replace(/[^0-9]/g, '') })}
                  />
                  <TextInput
                    style={[styles.filterInput, styles.numericInput, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.card }]}
                    placeholder="Bathrooms"
                    placeholderTextColor={themeColors.subtext}
                    keyboardType="numeric"
                    value={filters.bathrooms}
                    onChangeText={(text) => setFilters({ ...filters, bathrooms: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>
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
                setFilters({
                  province_id: '',
                  district_id: '',
                  area_id: '',
                  purpose: '',
                  status: '',
                  is_promoted: undefined,
                  agent_id: '',
                  property_type: '',
                  property_category: '',
                  owner_name: '',
                  created_by_user_id: '',
                  bedrooms: '',
                  bathrooms: '',
                  min_price: '',
                  max_price: '',
                });
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
      {options.map((opt: any) => {
        const value = typeof opt === 'string' ? opt : String(opt.value);
        const label = typeof opt === 'string' ? opt.toUpperCase() : String(opt.label);
        return (
        <TouchableOpacity 
          key={value}
          style={[
            styles.optionChip, 
            { borderColor: theme.border },
            selected === value && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => onSelect(selected === value ? '' : value)}
        >
          <AppText variant="tiny" weight="bold" color={selected === value ? '#fff' : theme.text}>
            {label}
          </AppText>
        </TouchableOpacity>
      )})}
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
    maxHeight: '92%',
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
  filterOptionsContent: {
    paddingBottom: 16,
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
  filterInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  numericRow: {
    flexDirection: 'row',
    gap: 10,
  },
  numericInput: {
    flex: 1,
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
