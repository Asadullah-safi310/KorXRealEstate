import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { propertyService } from '../../../services/property.service';
import authStore from '../../../stores/AuthStore';
import PropertyCard from '../../../components/PropertyCard';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';

const MyPropertiesScreen = observer(() => {
  const router = useRouter();
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'public' | 'private'>('public');
  const [searchQuery, setSearchQuery] = useState('');

  const themeColors = useThemeColor();

  const fetchMyProperties = useCallback(async () => {
    if (!authStore.user?.user_id) return;
    
    setLoading(true);
    try {
      const response = await propertyService.getMyProperties();
      setUserProperties(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProperties();
  }, [fetchMyProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProperties();
  };

  const filteredProperties = useMemo(() => {
    let data = userProperties;
    if (availabilityFilter === 'public') {
      data = data.filter((p: any) => p.is_available_for_sale || p.is_available_for_rent);
    } else if (availabilityFilter === 'private') {
      data = data.filter((p: any) => !p.is_available_for_sale && !p.is_available_for_rent);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      data = data.filter((p: any) => {
        const ownerName = (p.owner_name || '').toLowerCase();
        const propertyCode = (p.property_code || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        
        return ownerName.includes(query) || 
               propertyCode.includes(query) || 
               title.includes(query);
      });
    }
    
    return data;
  }, [userProperties, availabilityFilter, searchQuery]);

  const countLabel = `${filteredProperties.length} ${filteredProperties.length === 1 ? 'property' : 'properties'}`;

  return (
    <ScreenLayout backgroundColor={themeColors.background} scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.headerBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>My Properties</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.topContainer}>
        <View style={[styles.searchContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="search-outline" size={20} color={themeColors.subtext} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search by owner, code, or title..."
            placeholderTextColor={themeColors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={themeColors.subtext} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.subFilterWrapper}>
          {(['public', 'private'] as const).map((filter) => (
            <TouchableOpacity 
              key={filter}
              onPress={() => setAvailabilityFilter(filter)}
              style={[
                styles.subFilterChip, 
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                availabilityFilter === filter && { backgroundColor: themeColors.primary + '15', borderColor: themeColors.primary }
              ]}
            >
              <Text style={[
                styles.subFilterText, 
                { color: themeColors.subtext },
                availabilityFilter === filter && { color: themeColors.primary, fontWeight: '800' }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.countText, { color: themeColors.subtext }]}>{countLabel}</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.property_id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.cardItem}>
              {availabilityFilter === 'private' ? (
                <View style={[styles.privatePropertyItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.privatePropertyInfo}>
                    <View style={styles.privatePropertyHeader}>
                      <MaterialCommunityIcons name="home-lock-outline" size={24} color={themeColors.primary} />
                      <View style={styles.privatePropertyTitleContainer}>
                        <Text style={[styles.privatePropertyTitle, { color: themeColors.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.property_code && (
                          <Text style={[styles.privatePropertyCode, { color: themeColors.subtext }]}>
                            {item.property_code}
                          </Text>
                        )}
                      </View>
                    </View>
                    {item.owner_name && (
                      <View style={styles.privatePropertyRow}>
                        <Ionicons name="person-outline" size={16} color={themeColors.subtext} />
                        <Text style={[styles.privatePropertyLabel, { color: themeColors.subtext }]}>Owner:</Text>
                        <Text style={[styles.privatePropertyValue, { color: themeColors.text }]} numberOfLines={1}>
                          {item.owner_name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.privatePropertyRow}>
                      <Ionicons name="location-outline" size={16} color={themeColors.subtext} />
                      <Text style={[styles.privatePropertyLabel, { color: themeColors.subtext }]}>Location:</Text>
                      <Text style={[styles.privatePropertyValue, { color: themeColors.text }]} numberOfLines={1}>
                        {[item.address, item.AreaData?.name, item.DistrictData?.name, item.ProvinceData?.name].filter(Boolean).join(', ') || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.privatePropertyRow}>
                      <Ionicons name="pricetag-outline" size={16} color={themeColors.subtext} />
                      <Text style={[styles.privatePropertyLabel, { color: themeColors.subtext }]}>Type:</Text>
                      <Text style={[styles.privatePropertyValue, { color: themeColors.text }]}>
                        {item.property_type || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => router.push(`/property/${item.property_id}`)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.viewButtonText, { color: themeColors.primary }]}>View</Text>
                    <Ionicons name="arrow-forward" size={14} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <PropertyCard 
                  property={item} 
                  index={index}
                  variant="compact"
                  onPress={() => router.push(`/property/${item.property_id}`)} 
                />
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: themeColors.card }]}>
                <MaterialCommunityIcons name="home-search-outline" size={60} color={themeColors.border} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No properties found</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
                {availabilityFilter === 'private'
                  ? 'No private properties found for this account.'
                  : 'No public properties found for this account.'}
              </Text>
            </View>
          }
        />
      )}
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
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  topContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  subFilterWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  subFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    gap: 10,
  },
  cardItem: {
    marginBottom: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    opacity: 0.7,
  },
  privatePropertyItem: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privatePropertyInfo: {
    flex: 1,
    gap: 6,
  },
  privatePropertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 2,
  },
  privatePropertyTitleContainer: {
    flex: 1,
  },
  privatePropertyTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  privatePropertyCode: {
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.6,
  },
  privatePropertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  privatePropertyLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  privatePropertyValue: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});

export default MyPropertiesScreen;
