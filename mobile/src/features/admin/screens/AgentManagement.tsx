import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import Avatar from '../../../components/Avatar';

const AgentManagement = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        role: 'agent',
        search,
      };
      const response = await adminService.getUsers(params);
      setAgents(response.data.users);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const renderAgentItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.agentCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={() => router.push(`/admin/users?id=${item.user_id}`)}
    >
      <View style={styles.agentMain}>
        <Avatar user={item} size="lg" />
        <View style={styles.agentInfo}>
          <AppText variant="body" weight="bold">{item.full_name}</AppText>
          <AppText variant="caption" color={themeColors.subtext}>{item.email}</AppText>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="business-outline" size={14} color={themeColors.primary} />
              <AppText variant="tiny" weight="bold" style={{ marginLeft: 4 }}>{item.property_count || 0} Properties</AppText>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="handshake" size={14} color="#10b981" />
              <AppText variant="tiny" weight="bold" style={{ marginLeft: 4 }}>{item.deal_count || 0} Deals</AppText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={14} color="#f59e0b" />
              <AppText variant="tiny" weight="bold" style={{ marginLeft: 4 }}>
                ${(Number(item.total_volume) || 0).toLocaleString()}
              </AppText>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={themeColors.border} />
      </View>

      <View style={[styles.cardActions, { borderTopColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/admin/properties?agent_id=${item.user_id}`)}
        >
          <Ionicons name="business-outline" size={16} color={themeColors.primary} />
          <AppText variant="tiny" weight="bold" color={themeColors.primary} style={{ marginLeft: 4 }}>Properties</AppText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/admin/deals?agent_id=${item.user_id}`)}
        >
          <MaterialCommunityIcons name="handshake" size={16} color="#10b981" />
          <AppText variant="tiny" weight="bold" color="#10b981" style={{ marginLeft: 4 }}>Deals</AppText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/admin/users?id=${item.user_id}`)}
        >
          <Ionicons name="person-outline" size={16} color={themeColors.text} />
          <AppText variant="tiny" weight="bold" style={{ marginLeft: 4 }}>Profile</AppText>
        </TouchableOpacity>
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
          <AppText variant="title" weight="bold" style={{ marginLeft: 16 }}>Agent Management</AppText>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subtext} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search agents..."
              placeholderTextColor={themeColors.subtext}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={agents}
            renderItem={renderAgentItem}
            keyExtractor={item => item.user_id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText variant="body" color={themeColors.subtext}>No agents found</AppText>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
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
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  agentCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  agentMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  agentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
});

export default AgentManagement;
