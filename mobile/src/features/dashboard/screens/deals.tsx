import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dealStore from '../../../stores/DealStore';
import authStore from '../../../stores/AuthStore';
import { DealCard } from '../../../components/DealCard';

import { useThemeColor } from '../../../hooks/useThemeColor';

import ScreenLayout from '../../../components/ScreenLayout';

const DealsScreen = observer(() => {
  const themeColors = useThemeColor();
  const router = useRouter();
  const canViewDeals = authStore.isAuthenticated && (authStore.isAgent || authStore.isAdmin);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!canViewDeals) {
      router.replace('/(auth)/login');
      return;
    }

    dealStore.fetchDeals();
  }, [canViewDeals, router]);

  const filteredDeals = dealStore.deals.filter(deal => {
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesSearch =
      deal.buyer_name_snapshot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.seller_name_snapshot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.property_id.toString().includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  const renderItem = ({ item }: { item: any }) => (
    <DealCard
      deal={item}
      onPress={() => router.push(`/deal/${item.deal_id}`)}
    />
  );

  return (
    <ScreenLayout
      backgroundColor={themeColors.background}
    >
      <View style={styles.premiumHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: themeColors.text }]}>Deal Center</Text>
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>Manage your property transactions</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/deal/create')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subtext} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search by ID or client name..."
              placeholderTextColor={themeColors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={themeColors.subtext} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {['all', 'active', 'completed', 'canceled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.tab,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  statusFilter === status && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.tabText,
                  { color: themeColors.text },
                  statusFilter === status && { color: '#fff' }
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {dealStore.loading && dealStore.deals.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          renderItem={renderItem}
          keyExtractor={(item) => item.deal_id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={64} color={themeColors.border} />
              <Text style={[styles.emptyText, { color: themeColors.subtext }]}>No transactions found</Text>
              <Text style={[styles.emptySubtext, { color: themeColors.subtext + '80' }]}>Try adjusting your filters or search</Text>
            </View>
          }
        />
      )}
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  premiumHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  filtersWrapper: {
    marginBottom: 5,
  },
  tabs: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DealsScreen;
