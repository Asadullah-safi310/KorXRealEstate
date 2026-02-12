import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Platform, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
  Pressable
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../theme';
import { locationService } from '../../../services/location.service';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type SelectionLevel = 'city' | 'district' | 'area';

const SearchScreen = () => {
  const router = useRouter();
  const { colors: theme, theme: themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State
  const [activeType, setActiveType] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel] = useState<SelectionLevel>('city');
  const [loading, setLoading] = useState(false);
  
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  // Initial fetch
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await locationService.getProvinces();
      setCities(res.data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (cityId: string | number) => {
    try {
      setLoading(true);
      const res = await locationService.getDistricts(cityId);
      setDistricts(res.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async (districtId: string | number) => {
    try {
      setLoading(true);
      const res = await locationService.getAreas(districtId);
      setAreas(res.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: any) => {
    const cityId = city.id || city._id;
    setSelectedCity(city);
    setSelectedDistrict(null);
    setSelectedArea(null);
    setLevel('district');
    fetchDistricts(cityId);
  };

  const handleDistrictSelect = (district: any) => {
    const districtId = district.id || district._id;
    setSelectedDistrict(district);
    setSelectedArea(null);
    setLevel('area');
    fetchAreas(districtId);
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
  };

  const handleSearch = () => {
    if (!selectedCity) return;

    router.push({
      pathname: '/(tabs)/properties',
      params: { 
        province_id: selectedCity.id || selectedCity._id, 
        district_id: selectedDistrict?.id || selectedDistrict?._id, 
        area_id: selectedArea?.id || selectedArea?._id,
        province_name: selectedCity.name,
        district_name: selectedDistrict?.name || '',
        area_name: selectedArea?.name || '',
        type: activeType 
      }
    });
  };

  const handleBack = () => {
    if (level === 'area') {
      setLevel('district');
      setSelectedArea(null);
      setAreas([]);
    } else if (level === 'district') {
      setLevel('city');
      setSelectedDistrict(null);
      setSelectedCity(null);
      setDistricts([]);
    } else {
      router.back();
    }
  };

  const handleClear = () => {
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedArea(null);
    setLevel('city');
    setSearchQuery('');
    setDistricts([]);
    setAreas([]);
  };

  const searchPlaceholder = useMemo(() => {
    if (level === 'city') return "Search provinces...";
    if (level === 'district') return `Search in ${selectedCity?.name}...`;
    return `Search in ${selectedDistrict?.name}...`;
  }, [level, selectedCity, selectedDistrict]);

  const filteredData = useMemo(() => {
    const currentList = level === 'city' ? cities : level === 'district' ? districts : areas;
    if (!searchQuery) return currentList;
    return currentList.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [level, cities, districts, areas, searchQuery]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const itemId = item.id || item._id;
    const isSelected = 
      (level === 'city' && (selectedCity?.id === itemId || selectedCity?._id === itemId)) ||
      (level === 'district' && (selectedDistrict?.id === itemId || selectedDistrict?._id === itemId)) ||
      (level === 'area' && (selectedArea?.id === itemId || selectedArea?._id === itemId));

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 30).duration(400)}
        layout={Layout.springify()}
      >
        <TouchableOpacity 
          style={[
            styles.listItem, 
            { 
              backgroundColor: theme.card, 
              borderColor: isSelected ? theme.primary : theme.border,
              borderWidth: isSelected ? 2 : 1.5 
            }
          ]}
          onPress={() => {
            if (level === 'city') handleCitySelect(item);
            else if (level === 'district') handleDistrictSelect(item);
            else handleAreaSelect(item);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: isSelected ? theme.primary + '10' : theme.background }]}>
            <MaterialCommunityIcons 
              name={level === 'city' ? "office-building" : level === 'district' ? "map-marker-radius" : "map-marker"} 
              size={22} 
              color={isSelected ? theme.primary : theme.subtext} 
            />
          </View>
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemText, { color: theme.text, fontWeight: isSelected ? '800' : '600' }]}>
              {item.name}
            </Text>
            <Text style={[styles.listItemSubtext, { color: theme.subtext }]}>
              {level === 'city' ? 'Province' : level === 'district' ? `District in ${selectedCity?.name}` : `Area in ${selectedDistrict?.name}`}
            </Text>
          </View>
          {isSelected ? (
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
               <Ionicons name="checkmark" size={14} color={theme.white} />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={theme.border} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={{ flex: 1 }}>
        <ExpoStatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        
        {/* Modern Premium Header */}
        <View style={[styles.headerWrapper, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={handleBack} style={[styles.headerBtn, { borderColor: theme.border }]}>
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
              
              <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {['Buy', 'Rent/PG', 'Commercial'].map((type) => (
                  <Pressable 
                    key={type} 
                    onPress={() => setActiveType(type)}
                    style={[styles.tab, activeType === type && { backgroundColor: theme.primary }]}
                  >
                    <Text style={[styles.tabText, { color: activeType === type ? theme.black : theme.subtext }]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TouchableOpacity onPress={handleClear} style={[styles.headerBtn, { borderColor: theme.border }]}>
                <Ionicons name="refresh" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Premium Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.primary} style={styles.searchIcon} />
                <View style={styles.inputStack}>
                  {(selectedCity || selectedDistrict || selectedArea) && (
                    <Text style={[styles.breadcrumb, { color: theme.primary }]} numberOfLines={1}>
                      {selectedCity?.name}
                      {selectedDistrict ? ` • ${selectedDistrict.name}` : ''}
                      {selectedArea ? ` • ${selectedArea.name}` : ''}
                    </Text>
                  )}
                  <TextInput 
                    style={[styles.input, { color: theme.text }]}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={theme.subtext + '80'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={level === 'city'}
                  />
                </View>
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                    <Ionicons name="close-circle" size={20} color={theme.border} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* List Content */}
        <View style={styles.listWrapper}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              {level === 'city' ? 'Select Province' : level === 'district' ? 'Select District' : 'Refine Location'}
            </Text>
            {loading && <ActivityIndicator size="small" color={theme.primary} />}
          </View>

          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => (item.id || item._id).toString()}
            contentContainerStyle={[styles.listScroll, { paddingBottom: 120 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconBox, { backgroundColor: theme.card }]}>
                     <MaterialCommunityIcons name="map-search-outline" size={60} color={theme.border} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No locations found</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>We couldn&apos;t find any results matching your search.</Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Floating Action Button */}
        {selectedCity && (
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={[styles.fabContainer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity 
              style={[styles.fab, { backgroundColor: theme.primary }]} 
              onPress={handleSearch}
              activeOpacity={0.9}
            >
              <View style={styles.fabIcon}>
                <Ionicons name="location" size={20} color={theme.white} />
              </View>
              <Text style={styles.fabText}>
                Explore {selectedArea?.name || selectedDistrict?.name || selectedCity.name}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={theme.white + 'B3'} />
            </TouchableOpacity>
          </BlurView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    height: 60,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  inputStack: {
    flex: 1,
    justifyContent: 'center',
  },
  breadcrumb: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: -2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearIcon: {
    padding: 4,
  },
  listWrapper: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  listScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    gap: 12,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    marginBottom: 2,
  },
  listItemSubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fab: {
    height: 56,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
});

export default SearchScreen;
