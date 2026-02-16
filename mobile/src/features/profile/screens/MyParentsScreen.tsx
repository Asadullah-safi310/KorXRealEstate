import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import parentStore from '../../../stores/ParentStore';
import authStore from '../../../stores/AuthStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';

interface Props {
  category: 'tower' | 'market' | 'sharak';
}

const MyParentsScreen = observer(({ category }: Props) => {
  const router = useRouter();
  const themeColors = useThemeColor();

  const title = category === 'tower' ? 'My Towers' : 
                category === 'market' ? 'My Markets' : 'My Sharaks';
  
  const icon = category === 'tower' ? 'office-building' : 
               category === 'market' ? 'storefront' : 'account-group';

  const fetchParents = useCallback(async () => {
    if (!authStore.user) return;
    await parentStore.fetchAgentParents(category);
  }, [category]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const onRefresh = () => {
    fetchParents();
  };

  const getAvailableUnitsCount = (parent: any) => {
    const candidates = [
      parent?.availableUnits,
      parent?.available_units,
      parent?.availableUnitsCount,
      parent?.available_units_count,
      parent?.available_children,
    ];

    const apiCount = candidates.find((v) => Number.isFinite(Number(v)));
    if (apiCount !== undefined) return Number(apiCount);

    const children = Array.isArray(parent?.Children) ? parent.Children : [];
    if (!children.length) return 0;

    return children.filter((u: any) => {
      const isSale = !!u?.forSale || !!u?.is_available_for_sale || !!u?.for_sale || !!u?.isAvailableForSale;
      const isRent = !!u?.forRent || !!u?.is_available_for_rent || !!u?.for_rent || !!u?.isAvailableForRent;
      const status = String(u?.status || '').toLowerCase();
      const hasAllowedStatus = !status || status === 'available' || status === 'active';
      return hasAllowedStatus && (isSale || isRent);
    }).length;
  };

  const renderItem = ({ item }: any) => {
    if (!item) return null;
    const availableUnits = getAvailableUnitsCount(item);
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => router.push(`/parent/${category}/${item.id}`)}
      >
        <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.background }]}>
          <MaterialCommunityIcons name={icon as any} size={32} color={themeColors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={themeColors.subtext} />
            <Text style={[styles.locationText, { color: themeColors.subtext }]} numberOfLines={1}>
              {item.DistrictData?.name}, {item.ProvinceData?.name}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: themeColors.infoSubtle }]}>
            <Text style={[styles.badgeText, { color: themeColors.infoText }]}>
              {availableUnits} {availableUnits === 1 ? 'Unit' : 'Units'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={themeColors.border} />
      </TouchableOpacity>
    );
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
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>
        <TouchableOpacity 
          onPress={() => router.push(`/parent/create?category=${category}`)} 
          style={[styles.headerBtn, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}
        >
          <Ionicons name="add" size={24} color={themeColors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.topContainer}>
        <Text style={[styles.description, { color: themeColors.subtext }]}>
          Manage your {category === 'sharak' ? 'sharaks' : category + 's'} and add units inside them.
        </Text>
      </View>

      {parentStore.loading && !parentStore.parents.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={parentStore.parents || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={parentStore.loading} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: themeColors.card }]}>
                <MaterialCommunityIcons name={(icon + '-marker-outline') as any} size={60} color={themeColors.border} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No {category}s listed</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
                You haven&apos;t listed any {category}s yet. Click the + button to add your first one.
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
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 16,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
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

export default MyParentsScreen;
