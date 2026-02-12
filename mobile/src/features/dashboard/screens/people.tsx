import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import personStore from '../../../stores/PersonStore';
import PersonCard from '../../../components/PersonCard';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PeopleScreen = observer(() => {
  const themeColors = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'agents'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    personStore.fetchPersons();
    personStore.fetchAgents();
  }, []);

  const data = activeTab === 'contacts' ? personStore.persons : personStore.agents;

  const filteredData = data.filter(item => {
    const name = item.full_name || item.username || '';
    const phone = item.phone || '';
    const email = item.email || '';
    
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderItem = ({ item }: { item: any }) => (
    <PersonCard
      person={item}
      onPress={() => {
        if (activeTab === 'contacts') {
          router.push(`/person/${item.id}`);
        } else {
          router.push(`/person/user_${item.user_id}`);
        }
      }}
    />
  );

  return (
    <ScreenLayout
      scrollable
      backgroundColor={themeColors.background}
      bottomSpacing={100}
    >
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.premiumTitle, { color: themeColors.text }]}>People Directory</Text>
        <Text style={[styles.premiumSubtitle, { color: themeColors.white }]}>Manage your network and active agents</Text>
      </View>

      <View style={styles.premiumSearchSection}>
        <View style={[styles.premiumSearchBar, { backgroundColor: themeColors.white, borderColor: themeColors.border }]}>
          <Ionicons name="search-outline" size={20} color={themeColors.white} />
          <TextInput
            style={[styles.premiumSearchInput, { color: themeColors.text }]}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={themeColors.white}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={themeColors.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.premiumTabsContainer}>
        <TouchableOpacity
          style={[
            styles.premiumTab, 
            { backgroundColor: themeColors.white, borderColor: themeColors.border },
            activeTab === 'contacts' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
          ]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[
            styles.premiumTabText, 
            { color: themeColors.text },
            activeTab === 'contacts' && { color: '#fff' }
          ]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.premiumTab, 
            { backgroundColor: themeColors.white, borderColor: themeColors.border },
            activeTab === 'agents' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
          ]}
          onPress={() => setActiveTab('agents')}
        >
          <Text style={[
            styles.premiumTabText, 
            { color: themeColors.text },
            activeTab === 'agents' && { color: '#fff' }
          ]}>Agents</Text>
        </TouchableOpacity>
      </View>

      {personStore.loading && data.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id || item.user_id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.white }]}>
                <Ionicons name="people-outline" size={40} color={themeColors.white} />
              </View>
              <Text style={[styles.emptyText, { color: themeColors.text }]}>No {activeTab} found</Text>
              <Text style={[styles.emptySubtext, { color: themeColors.white }]}>Try adjusting your search criteria</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.premiumFab, { backgroundColor: themeColors.primary }]}
        onPress={() => router.push('/person/create')}
        activeOpacity={0.9}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  premiumHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  premiumSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  premiumSearchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  premiumSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
  },
  premiumSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  premiumTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  premiumTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
  },
  premiumTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  premiumFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  }
});

export default PeopleScreen;
