import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  RefreshControl,
  FlatList,
  Linking,
  Platform
} from 'react-native';
import { AppText } from '../../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useThemeColor } from '../../../hooks/useThemeColor';
import parentStore from '../../../stores/ParentStore';
import authStore from '../../../stores/AuthStore';
import PropertyCard from '../../../components/PropertyCard';
import Avatar from '../../../components/Avatar';
import { getImageUrl } from '../../../utils/mediaUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import ScreenLayout from '../../../components/ScreenLayout';
import { AMENITY_ICONS } from '../../../constants/Amenities';
import { BlurView } from 'expo-blur';
import { Alert } from 'react-native';
import { userService } from '../../../services/user.service';

// Safe import for react-native-maps
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  console.log('react-native-maps not available');
}

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 350;

const ParentProfileScreen = observer(() => {
  const { category: categoryParam, id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeColor();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'available' | 'allProperties'>('features');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBeds, setSelectedBeds] = useState<string>('ALL');
  const [agentProfile, setAgentProfile] = useState<any>(null);

  const parentId = Number(id);
  const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

  const fetchData = useCallback(async () => {
    if (!parentId) return;
    try {
      await Promise.all([
        parentStore.fetchParentById(parentId),
        parentStore.fetchChildren(parentId)
      ]);
    } catch (error) {
      console.error('Error fetching parent details:', error);
    }
  }, [parentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const parent = parentStore.currentParent;
  const units = parentStore.children;
  const currentUser = authStore.user as any;
  const currentUserId = currentUser?.user_id;
  const currentPersonId = currentUser?.person_id;
  const isAgentUser = authStore.isAuthenticated && authStore.user?.role === 'agent';
  const isParentCreator = !!parent?.created_by_user_id && String(parent.created_by_user_id) === String(currentUserId);
  const isParentListingAgent = !!parent?.agent_id && (
    String(parent.agent_id) === String(currentPersonId) || String(parent.agent_id) === String(currentUserId)
  );
  const canViewAllProperties = !!isAgentUser && (isParentCreator || isParentListingAgent);

  const parentAgentId = parent?.agent_id || parent?.created_by_user_id;

  useEffect(() => {
    const loadAgentProfile = async () => {
      if (!parentAgentId) {
        setAgentProfile(null);
        return;
      }
      try {
        const res = await userService.getPublicProfile(String(parentAgentId));
        setAgentProfile(res.data);
      } catch (err) {
        console.error('Failed to load agent public profile', err);
        setAgentProfile(null);
      }
    };

    loadAgentProfile();
  }, [parentAgentId]);
  const agentAddedUnits = units.filter((u) => {
    const unitAgentId = u?.agent_id || u?.created_by_user_id;
    return !!parentAgentId && String(unitAgentId) === String(parentAgentId);
  });

  const availableUnits = units.filter((u) => {
    const isSale = !!u?.forSale || !!u?.is_available_for_sale || !!u?.for_sale || !!u?.isAvailableForSale;
    const isRent = !!u?.forRent || !!u?.is_available_for_rent || !!u?.for_rent || !!u?.isAvailableForRent;
    return isSale || isRent;
  });

  const unitsForTab =
    activeTab === 'available'
      ? availableUnits
      : activeTab === 'allProperties'
        ? agentAddedUnits
        : units;

  const bedFilters = ['ALL', '2', '3', '4', '5', '6', 'OTHERS'];
  const filteredUnits = unitsForTab.filter((u) => {
    const typeMatch =
      selectedType === 'ALL' || u.property_type?.toUpperCase() === selectedType.toUpperCase();

    if (!typeMatch) return false;

    if (selectedBeds === 'ALL') return true;

    const bedrooms = Number(u?.bedrooms);
    if (selectedBeds === 'OTHERS') {
      return !Number.isFinite(bedrooms) || bedrooms < 2 || bedrooms > 6;
    }

    return bedrooms === Number(selectedBeds);
  });

  useEffect(() => {
    if (!canViewAllProperties && activeTab === 'allProperties') {
      setActiveTab('available');
    }
  }, [canViewAllProperties, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getAddUnitText = () => {
    const cat = category?.toLowerCase() || '';
    switch (cat) {
      case 'market': return 'Add Shop/Office';
      case 'sharak': return 'Add Apartment/Shop/Office/Land/Plot/House';
      case 'tower': 
      case 'apartment': return 'Add Apartment/Shop/Office';
      default: return 'Add Unit';
    }
  };

  const getFilterTypes = () => {
    const cat = category?.toLowerCase() || '';
    switch (cat) {
      case 'market': return ['ALL', 'SHOP', 'OFFICE'];
      case 'sharak': return ['ALL', 'APARTMENT', 'SHOP', 'OFFICE', 'LAND', 'HOUSE'];
      case 'tower': 
      case 'apartment': return ['ALL', 'APARTMENT', 'SHOP', 'OFFICE'];
      default: return ['ALL'];
    }
  };

  if (parentStore.loading && !parentStore.currentParent) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!parent) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <AppText variant="body" color={theme.text}>Property not found</AppText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <AppText variant="body" color={theme.primary}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = authStore.user?.user_id === parent.created_by_user_id || authStore.isAdmin;
  
  const normalizeListingUser = (user: any) => {
    if (!user) return null;
    const nestedUser = user.User || user.user || user.profile;
    return {
      ...user,
      ...nestedUser,
      full_name:
        user.full_name ||
        user.fullName ||
        user.name ||
        nestedUser?.full_name ||
        nestedUser?.fullName ||
        nestedUser?.name,
      profile_picture:
        user.profile_picture ||
        user.profilePicture ||
        user.profile_image ||
        user.avatar ||
        user.photo ||
        nestedUser?.profile_picture ||
        nestedUser?.profilePicture ||
        nestedUser?.profile_image ||
        nestedUser?.avatar ||
        nestedUser?.photo,
      user_id: user.user_id || user.userId || nestedUser?.user_id || nestedUser?.userId,
      person_id: user.person_id || user.personId || nestedUser?.person_id || nestedUser?.personId,
      phone: user.phone || nestedUser?.phone,
      email: user.email || nestedUser?.email,
    };
  };

  const listingUser = normalizeListingUser(agentProfile || parent.Creator || parent.Agent);

  // Debug logging
  console.log('=== PARENT DATA ===');
  console.log('Parent object:', JSON.stringify(parent, null, 2));
  console.log('Creator:', parent.Creator);
  console.log('Agent:', parent.Agent);
  console.log('listingUser:', listingUser);
  if (listingUser) {
    console.log('listingUser.user_id:', listingUser.user_id);
    console.log('listingUser.full_name:', listingUser.full_name);
    console.log('listingUser.profile_picture:', listingUser.profile_picture);
  }

  const handleWhatsApp = (user: any) => {
    if (!user) {
      console.log('handleWhatsApp: No user provided');
      return;
    }
    console.log('handleWhatsApp called with:', user);
    const phone = user.phone;
    const message = `Hello, I'm interested in the ${parent.title || parent.property_category}`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on your device');
      }
    });
  };

  const handleProfilePress = (user: any) => {
    console.log('handleProfilePress called with:', user);
    if (!user) {
      console.log('handleProfilePress: No user provided');
      return;
    }
    if (user.user_id) {
      console.log('Navigating to: /person/user_' + user.user_id);
      router.push(`/person/user_${user.user_id}`);
    } else if (parentAgentId) {
      console.log('Navigating to: /person/user_' + parentAgentId);
      router.push(`/person/user_${parentAgentId}`);
    } else if (user.person_id || user.id) {
      const personId = user.person_id || user.id;
      console.log('Navigating to: /person/' + personId);
      router.push(`/person/${personId}`);
    } else {
      console.log('handleProfilePress: No user_id or id found');
    }
  };

  const parseAmenities = (data: any): string[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.startsWith('[')) {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  };

  const buildParentAddress = () => {
    const street = parent.address || parent.location;
    const area = parent.AreaData?.name || parent.area?.name || parent.area_name;
    const city = parent.DistrictData?.name || parent.city;
    const province = parent.ProvinceData?.name || parent.province_name;

    const parts = street ? [street, area, city, province] : [area, city, province];
    const formatted = parts.filter(Boolean).join(', ');
    return formatted || 'Location not specified';
  };

  const renderFacility = (label: string) => {
    const config = AMENITY_ICONS[label];
    if (!config) return null;
    
    const IconProvider = config.provider === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
    return (
      <View key={label} style={[styles.facilityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <IconProvider name={config.icon as any} size={20} color={theme.primary} />
        <AppText variant="tiny" weight="medium" color={theme.text} style={{ marginTop: 6, textAlign: 'center' }} numberOfLines={1}>{label}</AppText>
      </View>
    );
  };

  const images = parent.photos || [];

  return (
    <ScreenLayout backgroundColor={theme.background} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Image 
                  source={{ uri: getImageUrl(item) || '' }} 
                  style={styles.headerImage} 
                  contentFit="cover" 
                />
              )}
            />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name={
                  (category?.toLowerCase() || '') === 'market' ? 'storefront' : 
                  (category?.toLowerCase() || '') === 'sharak' ? 'account-group' : 
                  'office-building'
                } 
                size={80} color={theme.border} 
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {isOwner && (
            <View style={[styles.headerActions, { top: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => router.push(`/property/create?id=${parent.property_id || parent.id}`)}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <AppText variant="h2" weight="bold" color={theme.text}>{parent.title}</AppText>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={theme.primary} />
              <AppText variant="body" color={theme.subtext} style={{ marginLeft: 4 }}>
                {buildParentAddress()}
              </AppText>
            </View>
          </View>

          <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'features' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('features')}
            >
              <AppText 
                variant="body" 
                weight={activeTab === 'features' ? "bold" : "regular"}
                color={activeTab === 'features' ? theme.primary : theme.subtext}
              >
                Features
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'available' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('available')}
            >
              <AppText 
                variant="small" 
                weight={activeTab === 'available' ? "bold" : "regular"}
                color={activeTab === 'available' ? theme.primary : theme.subtext}
              >
                Available Homes ({availableUnits.length})
              </AppText>
            </TouchableOpacity>
            {canViewAllProperties && (
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'allProperties' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('allProperties')}
              >
                <AppText
                  variant="small"
                  weight={activeTab === 'allProperties' ? "bold" : "regular"}
                  color={activeTab === 'allProperties' ? theme.primary : theme.subtext}
                >
                  All Properties ({agentAddedUnits.length})
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {activeTab === 'features' ? (
            <>
              <View style={styles.section}>
                <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>About</AppText>
                <AppText variant="body" color={theme.text} style={styles.description}>
                  {parent.description || 'No description available.'}
                </AppText>
              </View>

              {(() => {
                const facilitiesList = parseAmenities(parent.facilities);
                const allFacilities = Array.from(new Set([...facilitiesList]));
                
                if (allFacilities.length === 0) return null;

                return (
                  <View style={styles.section}>
                    <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>Facilities</AppText>
                    <View style={styles.facilitiesGrid}>
                      {allFacilities.map(label => renderFacility(label))}
                    </View>
                  </View>
                );
              })()}

              {/* Location & Map Section */}
              {parent.latitude && parent.longitude && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>Location</AppText>
                    <TouchableOpacity 
                      onPress={() => {
                        const label = parent.title || 'Property Location';
                        const url = Platform.select({
                          ios: `maps:0,0?q=${label}@${parent.latitude},${parent.longitude}`,
                          android: `geo:0,0?q=${parent.latitude},${parent.longitude}(${label})`
                        });
                        if (url) Linking.openURL(url);
                      }}
                    >
                      <AppText variant="body" weight="semiBold" color={theme.primary}>Open in Maps</AppText>
                    </TouchableOpacity>
                  </View>
                  <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginBottom: 16 }}>
                    {buildParentAddress()}
                  </AppText>
                  
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => {
                      const label = parent.title || 'Property Location';
                      const url = Platform.select({
                        ios: `maps:0,0?q=${label}@${parent.latitude},${parent.longitude}`,
                        android: `geo:0,0?q=${parent.latitude},${parent.longitude}(${label})`
                      });
                      if (url) Linking.openURL(url);
                    }}
                    style={[styles.mapContainer, { borderColor: theme.border }]}
                  >
                    {MapView ? (
                      <>
                        <MapView
                          provider={PROVIDER_GOOGLE}
                          style={styles.map}
                          initialRegion={{
                            latitude: typeof parent.latitude === 'number' ? parent.latitude : parseFloat(String(parent.latitude)),
                            longitude: typeof parent.longitude === 'number' ? parent.longitude : parseFloat(String(parent.longitude)),
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          pitchEnabled={false}
                          rotateEnabled={false}
                        >
                          {Marker && (
                            <Marker
                              coordinate={{
                                latitude: typeof parent.latitude === 'number' ? parent.latitude : parseFloat(String(parent.latitude)),
                                longitude: typeof parent.longitude === 'number' ? parent.longitude : parseFloat(String(parent.longitude)),
                              }}
                            >
                              <View style={[styles.markerContainer, { backgroundColor: theme.primary }]}>
                                <Ionicons name="business" size={16} color="#fff" />
                              </View>
                            </Marker>
                          )}
                        </MapView>
                        <View style={styles.mapOverlay}>
                          <BlurView intensity={40} style={styles.mapOverlayBlur} tint="dark">
                            <Ionicons name="expand-outline" size={14} color="#fff" />
                            <AppText variant="tiny" weight="bold" color="#fff" style={{ marginLeft: 4 }}>Tap to expand</AppText>
                          </BlurView>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
                        <Ionicons name="map-outline" size={32} color={theme.subtext} />
                        <AppText variant="small" color={theme.subtext}>Map location available</AppText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Agent Information Card */}
              {listingUser && (
                <View style={styles.section}>
                  <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>Agent Information</AppText>
                  <TouchableOpacity 
                    style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    activeOpacity={0.7}
                    onPress={() => handleProfilePress(listingUser)}
                  >
                    <View style={styles.agentInfoRow}>
                      <View style={styles.agentMainInfo}>
                        <Avatar user={listingUser} size="md" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <AppText variant="body" weight="bold" color={theme.text}>
                            {listingUser?.full_name || 'Agent Name'}
                          </AppText>
                          <AppText variant="caption" color={theme.subtext}>
                            Tap to view profile
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.agentActionButtons}>
                        <TouchableOpacity 
                          style={[styles.messageIcon, { backgroundColor: '#25D366', marginRight: 8 }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(listingUser);
                          }}
                        >
                          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.messageIcon, { backgroundColor: '#1e293b' }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            const email = listingUser?.email;
                            if (email) {
                              Linking.openURL(`mailto:${email}?subject=Inquiry: ${parent.title}`);
                            }
                          }}
                        >
                          <Ionicons name="mail" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.unitsHeader}>
                <AppText variant="h3" weight="bold" color={theme.text}>
                  {activeTab === 'available' ? 'Available Homes' : 'All Properties'}
                </AppText>
                {isOwner && (
                  <TouchableOpacity 
                    style={[styles.addUnitBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push({
                      pathname: '/property/create',
                      params: { 
                        parentId: parent.property_id || parent.id, 
                        category: parent.property_category,
                        parentName: parent.title
                      }
                    })}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <AppText variant="caption" weight="bold" color="#fff">{getAddUnitText()}</AppText>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.homesSummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.homesSummaryRow}>
                  <AppText variant="tiny" weight="bold" color={theme.subtext}>Showing</AppText>
                  <AppText variant="small" weight="bold" color={theme.primary}>{filteredUnits.length}</AppText>
                  <AppText variant="tiny" weight="bold" color={theme.subtext}>
                    {activeTab === 'available' ? 'available homes' : 'properties added by agent'}
                  </AppText>
                </View>
              </View>

              <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>PROPERTY TYPE</AppText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {getFilterTypes().map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      selectedType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <AppText 
                      variant="tiny" 
                      weight="bold" 
                      color={selectedType === type ? "#fff" : theme.subtext}
                    >
                      {type}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>BEDROOMS</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {bedFilters.map((bed) => (
                  <TouchableOpacity
                    key={bed}
                    style={[
                      styles.filterChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      selectedBeds === bed && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setSelectedBeds(bed)}
                  >
                    <AppText
                      variant="tiny"
                      weight="bold"
                      color={selectedBeds === bed ? '#fff' : theme.subtext}
                    >
                      {bed === 'ALL' ? 'All Beds' : bed === 'OTHERS' ? 'Others' : `${bed} Beds`}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredUnits.length > 0 ? (
                <FlatList
                  data={filteredUnits}
                  numColumns={2}
                  scrollEnabled={false}
                  key={activeTab === 'available' ? 'available-homes-grid' : 'all-properties-grid'}
                  columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                  contentContainerStyle={{ paddingBottom: 6 }}
                  keyExtractor={(unit) => unit.property_id.toString()}
                  renderItem={({ item: unit, index }) => (
                    <View style={{ width: (width - 56) / 2 }}>
                      <PropertyCard
                        property={unit}
                        index={index}
                        variant="compact"
                        compactDensity="small"
                        hideMediaActions={true}
                        onPress={() => router.push(`/property/${unit.property_id}`)}
                      />
                    </View>
                  )}
                />
              ) : (
                <View style={[styles.emptyUnits, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="home-outline" size={40} color={theme.border} />
                  <AppText variant="body" color={theme.subtext} style={{ marginTop: 10 }}>
                    {activeTab === 'available' ? 'No available homes found.' : 'No properties added by this agent yet.'}
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: HEADER_HEIGHT, width: width, position: 'relative' },
  headerImage: { width: width, height: HEADER_HEIGHT },
  backButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { position: 'absolute', right: 20, flexDirection: 'row', gap: 10 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, minHeight: 500 },
  headerInfo: { marginBottom: 24 },
  titleRow: { marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  description: { lineHeight: 22 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  facilityItem: { width: (width - 64) / 3, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, position: 'relative' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapOverlay: { position: 'absolute', bottom: 16, left: 16 },
  mapOverlayBlur: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  markerContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  agentCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  agentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  homesSummaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  homesSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterLabel: {
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.6,
  },
  addUnitBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  unitsList: { gap: 16 },
  emptyUnits: { padding: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
  filterScroll: { marginBottom: 16 },
  filterContent: { gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 }
});

export default ParentProfileScreen;
