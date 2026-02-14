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
  Pressable,
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
        type: activeType,
      },
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
    if (level === 'city') return 'Search provinces...';
    if (level === 'district') return `Search in ${selectedCity?.name}...`;
    return `Search in ${selectedDistrict?.name}...`;
  }, [level, selectedCity, selectedDistrict]);

  const filteredData = useMemo(() => {
    const currentList = level === 'city' ? cities : level === 'district' ? districts : areas;
    if (!searchQuery) return currentList;
    return currentList.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [level, cities, districts, areas, searchQuery]);

  const levelTitle = useMemo(() => {
    if (level === 'city') return 'Select Province';
    if (level === 'district') return 'Select District';
    return 'Select Area';
  }, [level]);

  const levelSubtitle = useMemo(() => {
    if (level === 'city') return 'Start by choosing a province';
    if (level === 'district') return `Districts in ${selectedCity?.name || 'selected province'}`;
    return `Areas in ${selectedDistrict?.name || 'selected district'}`;
  }, [level, selectedCity, selectedDistrict]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const itemId = item.id || item._id;
    const isSelected =
      (level === 'city' && (selectedCity?.id === itemId || selectedCity?._id === itemId)) ||
      (level === 'district' && (selectedDistrict?.id === itemId || selectedDistrict?._id === itemId)) ||
      (level === 'area' && (selectedArea?.id === itemId || selectedArea?._id === itemId));

    return (
      <Animated.View entering={FadeInDown.delay(index * 16).duration(260)} layout={Layout.springify()} style={styles.chipItemWrap}>
        <TouchableOpacity
          style={[
            styles.chipItem,
            {
              backgroundColor: theme.card,
              borderColor: isSelected ? theme.primary : theme.border,
            },
          ]}
          onPress={() => {
            if (level === 'city') handleCitySelect(item);
            else if (level === 'district') handleDistrictSelect(item);
            else handleAreaSelect(item);
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.chipIconWrap,
              { backgroundColor: isSelected ? theme.primary + '12' : theme.background },
            ]}
          >
            <MaterialCommunityIcons
              name={level === 'city' ? 'office-building' : level === 'district' ? 'map-marker-radius' : 'map-marker'}
              size={16}
              color={isSelected ? theme.primary : theme.subtext}
            />
          </View>

          <Text style={[styles.chipItemText, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          {isSelected ? (
            <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
          ) : (
            <View style={[styles.chipInactiveDot, { backgroundColor: theme.border }]} />
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

        <View style={[styles.headerWrapper, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={handleBack} style={[styles.headerBtn, { borderColor: theme.border }]}>
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>

              <View style={styles.headerTitleWrap}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Search by Location</Text>
              </View>

              <TouchableOpacity onPress={handleClear} style={[styles.headerBtn, { borderColor: theme.border }]}>
                <Ionicons name="refresh" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabSection}>
              <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {['Buy', 'Rent/PG'].map((type) => (
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
            </View>

            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.primary} style={styles.searchIcon} />
                <View style={styles.inputStack}>
                  {(selectedCity || selectedDistrict || selectedArea) && (
                    <Text style={[styles.breadcrumb, { color: theme.primary }]} numberOfLines={1}>
                      {selectedCity?.name}
                      {selectedDistrict ? ` > ${selectedDistrict.name}` : ''}
                      {selectedArea ? ` > ${selectedArea.name}` : ''}
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

        <View style={styles.listWrapper}>
          <View style={styles.listHeader}>
            <View>
              <Text style={[styles.listTitle, { color: theme.text }]}>{levelTitle}</Text>
              <Text style={[styles.listSubtitle, { color: theme.subtext }]}>{levelSubtitle}</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.resultCountText, { color: theme.subtext }]}>
                {filteredData.length} results
              </Text>
            )}
          </View>

          <FlatList
            data={filteredData}
            renderItem={renderItem}
            key="locations-chip-grid"
            keyExtractor={(item) => (item.id || item._id).toString()}
            numColumns={2}
            columnWrapperStyle={styles.chipGridRow}
            contentContainerStyle={[styles.listScroll, { paddingBottom: 120 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconBox, { backgroundColor: theme.card }]}>
                    <MaterialCommunityIcons name="map-search-outline" size={60} color={theme.border} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No locations found</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>Try a different keyword or clear the search.</Text>
                </View>
              ) : null
            }
          />
        </View>

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
              <Text style={styles.fabText}>Explore {selectedArea?.name || selectedDistrict?.name || selectedCity.name}</Text>
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
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 2 : 8,
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tabSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 56,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  inputStack: {
    flex: 1,
    justifyContent: 'center',
  },
  breadcrumb: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 0,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearIcon: {
    padding: 6,
  },
  listWrapper: {
    flex: 1,
    paddingTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  listTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  listSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chipGridRow: {
    gap: 10,
  },
  chipItemWrap: {
    flex: 1,
    marginBottom: 10,
  },
  chipItem: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chipIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  chipInactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
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
    width,
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
