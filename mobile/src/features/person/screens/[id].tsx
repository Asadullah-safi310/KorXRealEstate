import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Platform, ScrollView, FlatList, Dimensions, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import personStore from '../../../stores/PersonStore';
import Avatar from '../../../components/Avatar';
import { getImageUrl } from '../../../utils/mediaUtils';
import PropertyCard from '../../../components/PropertyCard';
import { ParentReelCard } from '../../dashboard/components/ParentReelCard';
import { propertyService } from '../../../services/property.service';
import { userService } from '../../../services/user.service';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { BlurView } from 'expo-blur';


const PersonDetailsScreen = observer(() => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeColor();
  
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<'ALL' | 'SALE' | 'RENT'>('ALL');
  const [selectedBeds, setSelectedBeds] = useState('ALL');
  const [selectedBaths, setSelectedBaths] = useState('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const personId = id as string;
        
        if (personId.startsWith('user_')) {
          setIsUser(true);
          const userId = personId.replace('user_', '');
          const response = await userService.getPublicProfile(userId);
          setPerson(response.data);
        } else {
          setIsUser(false);
          const data = await personStore.fetchPersonById(personId);
          setPerson(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch person details', err);
        setPerson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!person) return;
      setLoadingProperties(true);
      try {
        if (isUser) {
          const agentUserId = person.user_id?.toString();
          if (agentUserId) {
            const res = await propertyService.getPublicPropertiesByUser(agentUserId, 100);
            setProperties(res.data || []);
          } else {
            setProperties([]);
          }
        } else {
          const userId = person.user_id || person.id;
          const res = await propertyService.getPublicPropertiesByUser(userId, 100);
          setProperties(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch profile properties', err);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [person, isUser]);

  // Separate properties into individual units and parent containers
  const { individualProperties, parentProperties } = useMemo(() => {
    const individual: any[] = [];
    const parent: any[] = [];

    properties.forEach((prop: any) => {
      const isSale = !!prop?.forSale || !!prop?.is_available_for_sale || !!prop?.for_sale || !!prop?.isAvailableForSale;
      const isRent = !!prop?.forRent || !!prop?.is_available_for_rent || !!prop?.for_rent || !!prop?.isAvailableForRent;
      const isAvailable = isSale || isRent;
      if (!isAvailable) return;

      const isContainer = ['tower', 'apartment', 'sharak', 'market'].includes(prop.property_category?.toLowerCase());
      
      if (isContainer && !prop.parent_property_id) {
        // Map to format expected by ParentReelCard
        parent.push({
          id: prop.property_id,
          property_id: prop.property_id,
          title: prop.title || prop.property_type || 'Untitled',
          category: prop.property_category?.toLowerCase(),
          images: prop.photos || prop.images || [],
          availableUnits: prop.available_children || prop.total_children || 0,
        });
      } else if (prop.record_kind === 'listing') {
        individual.push(prop);
      }
    });

    return { individualProperties: individual, parentProperties: parent };
  }, [properties]);

  const propertyTypes = useMemo(() => {
    const types = Array.from(new Set(individualProperties.map((p: any) => (p.property_type || '').toUpperCase()).filter(Boolean)));
    return ['ALL', ...types];
  }, [individualProperties]);

  const filteredIndividualProperties = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return individualProperties.filter((p: any) => {
      const type = (p.property_type || '').toUpperCase();
      const isSale = !!p?.forSale || !!p?.is_available_for_sale || !!p?.for_sale || !!p?.isAvailableForSale;
      const isRent = !!p?.forRent || !!p?.is_available_for_rent || !!p?.for_rent || !!p?.isAvailableForRent;
      const beds = Number(p?.bedrooms || 0);
      const baths = Number(p?.bathrooms || 0);
      const price = Number(p?.sale_price || p?.rent_price || p?.price || 0);

      const typeMatch = selectedType === 'ALL' || type === selectedType;
      const purposeMatch =
        selectedPurpose === 'ALL' ||
        (selectedPurpose === 'SALE' && isSale) ||
        (selectedPurpose === 'RENT' && isRent);
      const bedsMatch =
        selectedBeds === 'ALL' ||
        (selectedBeds === '5+' ? beds >= 5 : beds === Number(selectedBeds));
      const bathsMatch =
        selectedBaths === 'ALL' ||
        (selectedBaths === '5+' ? baths >= 5 : baths === Number(selectedBaths));
      const minMatch = min == null || (Number.isFinite(price) && price >= min);
      const maxMatch = max == null || (Number.isFinite(price) && price <= max);

      return typeMatch && purposeMatch && bedsMatch && bathsMatch && minMatch && maxMatch;
    });
  }, [individualProperties, selectedType, selectedPurpose, selectedBeds, selectedBaths, minPrice, maxPrice]);

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!person) {
    return (
      <ScreenLayout scrollable backgroundColor={theme.background}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="account-search-outline" size={80} color={theme.border} />
          <AppText weight="medium" color={theme.subtext} style={styles.errorText}>Profile not found</AppText>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.primary }]} 
            onPress={() => router.back()}
          >
            <AppText weight="bold" color="#fff" style={styles.backButtonText}>Go Back</AppText>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const name = person.full_name || person.username || 'N/A';
  const role = isUser ? (person.role || 'Agent') : 'Contact';
  const profileLocation = [
    person.address,
    person.AreaData?.name || person.area?.name || person.area_name,
    person.DistrictData?.name || person.district?.name || person.district,
    person.ProvinceData?.name || person.province?.name || person.city || person.province_name,
  ].filter(Boolean).join(', ');

  const propertyLocation = (properties || [])
    .map((prop: any) => [
      prop.address || prop.location,
      prop.AreaData?.name || prop.area?.name || prop.area_name,
      prop.DistrictData?.name || prop.district?.name || prop.district,
      prop.ProvinceData?.name || prop.province?.name || prop.city || prop.province_name,
    ].filter(Boolean).join(', '))
    .find((loc: string) => !!loc);

  const locationText = profileLocation || propertyLocation || 'Not provided';

  return (
    <ScreenLayout 
      scrollable 
      backgroundColor={theme.background}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <AppText variant="h2" weight="bold" color={theme.text}>
          {isUser ? 'Professional Profile' : 'Contact Details'}
        </AppText>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.avatarWrapper}>
          <Avatar user={person} size="xl" />
          <View style={[styles.onlineBadge, { backgroundColor: theme.success, borderColor: theme.card }]} />
        </View>
        <AppText variant="h1" weight="black" color={theme.text} style={styles.name}>{name}</AppText>
        <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
          <MaterialCommunityIcons name={isUser ? "shield-check" : "account-circle"} size={14} color={theme.primary} />
          <AppText variant="tiny" weight="black" color={theme.primary} style={styles.roleText}>{role.toUpperCase()}</AppText>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            onPress={() => handleCall(person.phone)} 
            disabled={!person.phone}
            style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border }, !person.phone && styles.disabledBtn]}
          >
            <Ionicons name="call" size={20} color={theme.primary} />
            <AppText variant="tiny" weight="bold" color={theme.text}>Call</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleEmail(person.email)} 
            disabled={!person.email}
            style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border }, !person.email && styles.disabledBtn]}
          >
            <Ionicons name="mail" size={20} color={theme.primary} />
            <AppText variant="tiny" weight="bold" color={theme.text}>Email</AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={theme.primary} />
            <AppText variant="tiny" weight="bold" color={theme.text}>Chat</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Sections */}
      <View style={styles.sectionsContainer}>
        <View style={styles.sectionHeader}>
          <AppText variant="title" weight="bold" color={theme.text}>Contact Information</AppText>
          <MaterialCommunityIcons name="information-outline" size={18} color={theme.subtext} />
        </View>

        <View style={[styles.infoGrid, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <InfoItem icon="phone" label="Mobile Number" value={person.phone || 'Private'} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoItem icon="email" label="Email Address" value={person.email || 'Private'} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoItem icon="map-marker" label="Location" value={locationText} theme={theme} valueStyle={styles.locationValue} />
          
          {!isUser && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <InfoItem icon="card-account-details" label="National Identity" value={person.national_id || 'Not provided'} theme={theme} />
            </>
          )}
        </View>

        {person.id_card_path && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <AppText style={[styles.sectionTitle, { color: theme.text }]}>Verification Document</AppText>
              <MaterialCommunityIcons name="shield-account" size={18} color={theme.success} />
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.idCardWrapper}>
              <Image 
                source={{ uri: getImageUrl(person.id_card_path) ?? undefined }} 
                style={[styles.idCardImage, { backgroundColor: theme.card }]} 
                contentFit="cover"
                transition={300}
              />
              <BlurView intensity={30} style={styles.imageOverlay}>
                <Ionicons name="expand" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </>
        )}

        {/* Parent Properties (Towers, Sharaks, Markets) */}
        {loadingProperties ? (
          <View style={styles.loadingList}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <>
            {parentProperties.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <AppText style={[styles.sectionTitle, { color: theme.text }]}>
                    Buildings & Projects
                  </AppText>
                  <AppText style={[styles.countBadge, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>
                    {parentProperties.length}
                  </AppText>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.parentPropertiesList}
                  style={styles.parentPropertiesScroll}
                >
                  {parentProperties.map((prop: any) => (
                    <ParentReelCard 
                      key={prop.property_id} 
                      item={prop} 
                      onPress={() => router.push(`/property/${prop.property_id}`)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Individual Property Listings */}
            {individualProperties.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <AppText style={[styles.sectionTitle, { color: theme.text }]}>
                    {isUser ? 'Listed Properties' : 'Associated Properties'}
                  </AppText>
                  <AppText style={[styles.countBadge, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>
                    {filteredIndividualProperties.length}
                  </AppText>
                </View>
                <View style={[styles.filtersCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>PROPERTY TYPE</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {propertyTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterChip,
                          { borderColor: theme.border, backgroundColor: theme.background },
                          selectedType === type && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
                        ]}
                        onPress={() => setSelectedType(type)}
                      >
                        <AppText variant="tiny" weight="bold" color={selectedType === type ? theme.primary : theme.subtext}>{type}</AppText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>SALE / RENT</AppText>
                  <View style={styles.filterRowWrap}>
                    {(['ALL', 'SALE', 'RENT'] as const).map((purpose) => (
                      <TouchableOpacity
                        key={purpose}
                        style={[
                          styles.filterChip,
                          { borderColor: theme.border, backgroundColor: theme.background },
                          selectedPurpose === purpose && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
                        ]}
                        onPress={() => setSelectedPurpose(purpose)}
                      >
                        <AppText variant="tiny" weight="bold" color={selectedPurpose === purpose ? theme.primary : theme.subtext}>{purpose}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>PRICE</AppText>
                  <View style={styles.priceRow}>
                    <TextInput
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="numeric"
                      placeholder="Min"
                      placeholderTextColor={theme.subtext}
                      style={[styles.priceInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                    />
                    <TextInput
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      keyboardType="numeric"
                      placeholder="Max"
                      placeholderTextColor={theme.subtext}
                      style={[styles.priceInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                    />
                  </View>

                  <AppText variant="tiny" weight="bold" color={theme.subtext} style={styles.filterLabel}>BEDS & BATHS</AppText>
                  <View style={styles.filterRowWrap}>
                    {['ALL', '1', '2', '3', '4', '5+'].map((value) => (
                      <TouchableOpacity
                        key={`beds-${value}`}
                        style={[
                          styles.filterChip,
                          { borderColor: theme.border, backgroundColor: theme.background },
                          selectedBeds === value && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
                        ]}
                        onPress={() => setSelectedBeds(value)}
                      >
                        <AppText variant="tiny" weight="bold" color={selectedBeds === value ? theme.primary : theme.subtext}>
                          Beds {value}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.filterRowWrap}>
                    {['ALL', '1', '2', '3', '4', '5+'].map((value) => (
                      <TouchableOpacity
                        key={`baths-${value}`}
                        style={[
                          styles.filterChip,
                          { borderColor: theme.border, backgroundColor: theme.background },
                          selectedBaths === value && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
                        ]}
                        onPress={() => setSelectedBaths(value)}
                      >
                        <AppText variant="tiny" weight="bold" color={selectedBaths === value ? theme.primary : theme.subtext}>
                          Baths {value}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <FlatList
                  data={filteredIndividualProperties}
                  numColumns={2}
                  scrollEnabled={false}
                  key="person-listed-grid"
                  columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                  contentContainerStyle={{ paddingBottom: 6 }}
                  keyExtractor={(prop: any) => prop.property_id.toString()}
                  renderItem={({ item: prop, index }) => (
                    <View style={{ width: (Dimensions.get('window').width - 56) / 2 }}>
                      <PropertyCard
                        property={prop}
                        index={index}
                        variant="compact"
                        compactDensity="small"
                        showLocationInSmall={true}
                        smallMetaMode="basic"
                        hideMediaActions={true}
                        onPress={() => router.push(`/property/${prop.property_id}`)}
                      />
                    </View>
                  )}
                />
              </>
            )}

            {properties.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 24 }]}>
                <MaterialCommunityIcons name="home-off" size={40} color={theme.border} />
                <AppText style={[styles.emptyText, { color: theme.subtext }]}>No properties listed</AppText>
              </View>
            )}
          </>
        )}
      </View>
    </ScreenLayout>
  );
});

const InfoItem = ({ icon, label, value, theme, valueStyle }: any) => (
  <View style={styles.infoItem}>
    <View style={[styles.infoIconWrapper, { backgroundColor: theme.background }]}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.primary} />
    </View>
    <View style={styles.infoText}>
      <AppText style={[styles.infoLabel, { color: theme.subtext }]}>{label}</AppText>
      <AppText style={[styles.infoValue, { color: theme.text }, valueStyle]}>{value}</AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1.5,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 70,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  sectionsContainer: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  infoGrid: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  idCardWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  idCardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  propertiesList: {
    gap: 16,
  },
  filtersCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  filterLabel: {
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  filterRow: {
    gap: 8,
    marginBottom: 10,
    paddingRight: 8,
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  parentPropertiesScroll: {
    marginBottom: 16,
  },
  parentPropertiesList: {
    gap: 12,
    paddingRight: 20,
  },
  loadingList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PersonDetailsScreen;
