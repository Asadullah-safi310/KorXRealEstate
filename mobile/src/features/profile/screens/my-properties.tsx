import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [myListedProperties, setMyListedProperties] = useState<any[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'listed' | 'assigned'>('listed');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'public' | 'private'>('all');

  const themeColors = useThemeColor();
  const isAgent = authStore.isAgent;

  const fetchMyProperties = useCallback(async () => {
    if (!authStore.user) return;
    
    setLoading(true);
    try {
      const listedResponse = await propertyService.getUserProperties({
        created_by_user_id: authStore.user.user_id,
      });
      setMyListedProperties(listedResponse.data || []);

      if (isAgent) {
        const assignedResponse = await propertyService.getUserProperties({
          agent_id: authStore.user.user_id,
          status: 'available',
          availability: 'both',
        });
        
        const filteredAssigned = (assignedResponse.data || []).filter(
          (p: any) => p.created_by_user_id !== authStore.user?.user_id
        );
        setAssignedProperties(filteredAssigned);
      }
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAgent]);

  useEffect(() => {
    fetchMyProperties();
  }, [fetchMyProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProperties();
  };

  const filteredData = () => {
    let data = activeTab === 'listed' ? myListedProperties : assignedProperties;

    if (!isAgent || activeTab === 'listed') {
      if (availabilityFilter === 'public') {
        data = data.filter(p => p.is_available_for_sale || p.is_available_for_rent);
      } else if (availabilityFilter === 'private') {
        data = data.filter(p => !p.is_available_for_sale && !p.is_available_for_rent);
      }
    }
    return data;
  };

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
        {isAgent && (
          <View style={[styles.mainTabs, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'listed' && { backgroundColor: themeColors.primary }]} 
              onPress={() => setActiveTab('listed')}
            >
              <Text style={[styles.mainTabText, { color: activeTab === 'listed' ? '#fff' : themeColors.subtext }]}>My Listed</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'assigned' && { backgroundColor: themeColors.primary }]} 
              onPress={() => setActiveTab('assigned')}
            >
              <Text style={[styles.mainTabText, { color: activeTab === 'assigned' ? '#fff' : themeColors.subtext }]}>Assigned</Text>
            </TouchableOpacity>
          </View>
        )}

        {(!isAgent || activeTab === 'listed') && (
          <View style={styles.subFilterWrapper}>
            {(['all', 'public', 'private'] as const).map((filter) => (
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
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData()}
          keyExtractor={(item) => item.property_id.toString()}
          renderItem={({ item, index }) => (
            <PropertyCard 
              property={item} 
              index={index}
              onPress={() => router.push(`/property/${item.property_id}`)} 
            />
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
                {activeTab === 'listed' ? "You haven't listed any properties yet." : "No properties have been assigned to you."}
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
    gap: 16,
    marginBottom: 16,
  },
  mainTabs: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '800',
  },
  subFilterWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  subFilterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  subFilterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    gap: 16,
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
});

export default MyPropertiesScreen;
