import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Linking, Alert, Platform, Modal, FlatList, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppText } from '../../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useThemeColor, useCurrentTheme } from '../../../hooks/useThemeColor';
import { propertyService } from '../../../services/property.service';
import propertyStore from '../../../stores/PropertyStore';
import authStore from '../../../stores/AuthStore';
import favoriteStore from '../../../stores/FavoriteStore';
import Avatar from '../../../components/Avatar';
import PropertyCard from '../../../components/PropertyCard';
import NearbyPlaces from '../../../components/property/NearbyPlaces';
import { getImageUrl } from '../../../utils/mediaUtils';
import { shareProperty } from '../../../utils/shareUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import ScreenLayout from '../../../components/ScreenLayout';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolation,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { AMENITY_ICONS } from '../../../constants/Amenities';
import { useLanguage } from '../../../contexts/LanguageContext';
import { toWhatsAppPhone } from '../../../utils/phoneUtils';

// Safe import for react-native-maps to prevent crash on environments without native module
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

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 420;
const FOOTER_SAFE_HEIGHT = 96;

const FullscreenViewer = ({ 
  visible, 
  images, 
  initialIndex, 
  onClose 
}: { 
  visible: boolean; 
  images: string[]; 
  initialIndex: number; 
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(200)}
        style={styles.fullscreenContainer}
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View 
          entering={ZoomIn.duration(400)}
          exiting={ZoomOut.duration(300)}
          style={{ flex: 1 }}
        >
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.fullscreenImageWrapper}>
                <Image 
                  source={{ uri: getImageUrl(item) ?? undefined }} 
                  style={styles.fullscreenImage}
                  contentFit="contain"
                />
              </View>
            )}
          />
        </Animated.View>

        {/* Fullscreen UI */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top + 10 }]} 
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={[styles.fullscreenBadge, { bottom: insets.bottom + 40 }]}>
          <AppText variant="body" weight="bold" color="#fff">
            {currentIndex + 1} / {images.length}
          </AppText>
        </View>
      </Animated.View>
    </Modal>
  );
};

const ProfileSection = observer(({ title, user, type }: { title: string; user: any; type: string }) => {
  const router = useRouter();
  const theme = useThemeColor();
  const { t } = useLanguage();

  if (!user) return null;

  const handleProfilePress = () => {
    if (user.user_id) {
      router.push(`/person/user_${user.user_id}`);
    } else if (user.id) {
      router.push(`/person/${user.id}`);
    }
  };

  const handleWhatsApp = () => {
    if (user.phone) {
      const message = 'Hello, I am interested in your property listing.';
      const whatsappPhone = toWhatsAppPhone(user.phone);
      const appUrl = `whatsapp://send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(appUrl).catch(() => {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(t('common.error'), t('property.whatsappNotInstalled'));
        });
      });
    }
  };

  return (
    <View style={styles.profileSectionWrapper}>
      {title ? <AppText variant="title" weight="bold" color={theme.text} style={{ marginBottom: 16 }}>{title}</AppText> : null}
      <View style={[styles.miniProfileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleProfilePress} 
          style={styles.miniProfileMain}
        >
          <Avatar user={user} size="md" />
          <View style={styles.miniProfileInfo}>
            <AppText variant="body" weight="bold" color={theme.text}>{user.full_name}</AppText>
            <AppText variant="small" weight="medium" color={theme.subtext}>
              {type === 'Agent' ? t('property.verifiedAgent') : t('property.propertyOwner')}
            </AppText>
          </View>
        </TouchableOpacity>
        
        <View style={styles.profileActions}>
          <TouchableOpacity 
            style={[styles.profileActionBtn, { backgroundColor: theme.background }]}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.profileActionBtn, { backgroundColor: theme.background, marginLeft: 8 }]}
            onPress={handleProfilePress}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const PropertyDetailsScreen = observer(() => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [property, setProperty] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [selectedThumb, setSelectedThumb] = useState<{ type: 'image' | 'video'; index: number }>({ type: 'image', index: 0 });
  const mediaPagerRef = useRef<FlatList<string>>(null);
  
  const scrollY = useSharedValue(0);
  const theme = useThemeColor();
  const currentTheme = useCurrentTheme();
  const primaryColor = theme.primary;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0],
            [2, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: theme.background,
      opacity: interpolate(
        scrollY.value,
        [HEADER_HEIGHT - 100, HEADER_HEIGHT - 60],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const stickyTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [HEADER_HEIGHT - 60, HEADER_HEIGHT - 20],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [HEADER_HEIGHT - 60, HEADER_HEIGHT - 20],
            [10, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const handleWhatsApp = (user: any) => {
    if (user?.phone) {
      const message = 'Hello, I am interested in your property listing.';
      const whatsappPhone = toWhatsAppPhone(user.phone);
      const appUrl = `whatsapp://send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(appUrl).catch(() => {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(t('common.error'), t('property.whatsappNotInstalled'));
        });
      });
    }
  };

  const propertyIdNum = parseInt(id as string);
  const isFavorite = favoriteStore.isFavorite(propertyIdNum);

  useEffect(() => {
    const fetchChildren = async (parentId: string, usePublic: boolean) => {
      try {
        setLoadingChildren(true);
        const response = usePublic
          ? await propertyService.getPublicPropertyChildren(parentId)
          : await propertyService.getPropertyChildren(parentId);
        setChildren(response.data);
      } catch (err) {
        console.error('Failed to load child units:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    const fetchProperty = async () => {
      try {
        const response = authStore.isAuthenticated
          ? await propertyService.getPropertyById(id as string)
          : await propertyService.getPublicPropertyById(id as string);
        setProperty(response.data);
        
        if (response.data.record_kind === 'container') {
          fetchChildren(id as string, !authStore.isAuthenticated);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          try {
            const response = await propertyService.getPublicPropertyById(id as string);
            setProperty(response.data);
            if (response.data.record_kind === 'container') {
              fetchChildren(id as string, true);
            }
            return;
          } catch (fallbackErr) {
            console.error('Failed to load property details after 401:', fallbackErr);
          }
        }
        setError(t('common.error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, authStore.isAuthenticated]);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedThumb({ type: 'image', index: 0 });
  }, [property?.property_id]);

  const toggleFavorite = () => {
    favoriteStore.toggleFavorite(propertyIdNum);
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  const canEdit = property && (
    authStore.isAdmin || 
    authStore.user?.user_id === property.created_by_user_id ||
    authStore.user?.user_id === property.agent_id
  );

  const canDeal = property && authStore.isAgent && (
    authStore.user?.user_id === property.created_by_user_id || 
    authStore.user?.user_id === property.agent_id
  );

  const canAddUnit = property && property.record_kind === 'container' && (
    authStore.isAdmin || 
    authStore.user?.user_id === property.created_by_user_id ||
    authStore.user?.user_id === property.agent_id
  );

  const handleDelete = () => {
    Alert.alert(
      t('property.deletePropertyTitle'),
      t('property.deletePropertyMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await propertyStore.deleteProperty(id as string);
              router.back();
            } catch {
              Alert.alert(t('common.error'), t('property.failedToDelete'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleProfilePress = (user: any) => {
    if (!user) return;
    
    if (user.user_id) {
      router.push(`/person/user_${user.user_id}`);
    } else if (user.id) {
      router.push(`/person/${user.id}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error || !property) {
    return (
      <ScreenLayout backgroundColor={theme.background}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
          <AppText variant="body" weight="medium" color={theme.text} style={{ marginTop: 12 }}>{error || t('property.propertyNotFound')}</AppText>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: primaryColor }]} 
            onPress={() => router.back()}
          >
            <AppText variant="body" weight="bold" color="#fff">{t('property.returnToBrowse')}</AppText>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const normalizeMediaList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }
      } catch {
        // Keep backward compatibility for plain string media values.
      }
      return [trimmed];
    }
    return [];
  };

  const photos = normalizeMediaList(property.photos);
  const videos = normalizeMediaList(property.videos);
  const firstVideo = videos[0] || null;
  const hasVideoThumb = Boolean(firstVideo);
  const price = parseFloat(property.purpose === 'sale' ? property.sale_price : property.rent_price);
  const currency = property.purpose === 'sale' ? property.sale_currency : property.rent_currency;
  const currencySymbol = currency === 'USD' ? '$' : 'AF';

  const listingUser = property.Creator || property.Agent;

  const handleAddUnit = () => {
    router.push({
      pathname: '/property/create',
      params: { 
        parentId: id,
        category: property.property_category
      }
    });
  };

  const isContainer = property.record_kind === 'container';
  const isChild = property.parent_id != null;

  const buildPropertyAddress = () => {
    const street = property.address || property.location;
    const area = property.AreaData?.name || property.area?.name || property.area_name;
    const city = property.DistrictData?.name || property.city || property.district || property.district_name;
    const province = property.ProvinceData?.name || property.province?.name || property.province_name;

    const parts = street ? [street, area, city, province] : [area, city, province];
    const formatted = parts.filter(Boolean).join(', ');
    return formatted || t('property.locationNotSpecified');
  };

  const amenityTranslationKeyMap: Record<string, string> = {
    Parking: 'property.parking',
    'Security Guard': 'property.securityGuard',
    'Central Heating System': 'property.centralHeatingSystem',
    Cupboards: 'property.cupboards',
    Sunny: 'property.sunny',
    Basement: 'property.basement',
    AC: 'property.ac',
    Lift: 'property.lift',
    Furnished: 'property.furnished',
    'Semi-Furnished': 'property.semiFurnished',
    'Solar Facility': 'property.solarFacility',
    'Generator Facility': 'property.generatorFacility',
    Electricity: 'property.electricity',
    'Water Supply': 'property.waterSupply',
    'Water supply': 'property.waterSupply',
    Internet: 'property.internet',
    internet: 'property.internet',
    Gym: 'property.gym',
    Pool: 'property.pool',
    Garden: 'property.garden',
    Gas: 'property.gas',
  };

  const localizeAmenity = (label: string) => {
    const key = amenityTranslationKeyMap[label];
    return key ? t(key) : label;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Main Content Scrollable */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + FOOTER_SAFE_HEIGHT + 24,
          backgroundColor: 'transparent'
        }}
      >
        {/* Animated Header Image - Moved Inside for Scrollability */}
        <Animated.View style={[styles.imageContainer, headerAnimatedStyle]}>
          {photos.length > 0 ? (
            <FlatList
              ref={mediaPagerRef}
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const slide = Math.round(e.nativeEvent.contentOffset.x / width);
                if (slide !== activeImageIndex) {
                  setActiveImageIndex(slide);
                  setSelectedThumb({ type: 'image', index: slide });
                }
              }}
              scrollEventThrottle={16}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => {
                    setViewerIndex(index);
                    setViewerVisible(true);
                  }}
                  style={{ width: width }}
                >
                  <Image 
                    source={{ uri: getImageUrl(item) ?? undefined }} 
                    style={styles.image} 
                    contentFit="cover"
                    transition={300}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage, { backgroundColor: theme.card }]}>
              <Ionicons name="home-outline" size={80} color={theme.border} />
            </View>
          )}

          {/* Pagination Dots & Count Badge */}
          {photos.length > 1 && (
            <View style={styles.imageOverlayContainer}>
              <View style={styles.dotsContainer}>
                {photos.map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.dot, 
                      { backgroundColor: i === activeImageIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                    ]} 
                  />
                ))}
              </View>
              <View style={styles.imageBadge}>
                <BlurView intensity={60} style={styles.badgeBlur} tint="dark">
                  <AppText variant="caption" weight="bold" color="#fff">{activeImageIndex + 1} / {photos.length}</AppText>
                </BlurView>
              </View>
            </View>
          )}

          {/* Gradient Overlay for better text readability */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.gradientOverlay, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
          </View>
        </Animated.View>

        {(photos.length + (hasVideoThumb ? 1 : 0)) > 1 && (
          <View style={styles.thumbnailSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {hasVideoThumb && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!firstVideo) return;
                    const videoUrl = getImageUrl(firstVideo);
                    if (!videoUrl) return;
                    setSelectedThumb({ type: 'video', index: 0 });
                    Linking.openURL(videoUrl).catch(() => {
                      Alert.alert(t('common.error'), t('property.unableToOpenVideo'));
                    });
                  }}
                  style={[
                    styles.thumbnailButton,
                    {
                      borderColor:
                        selectedThumb.type === 'video' ? primaryColor : theme.border + '55',
                    },
                  ]}
                >
                  {photos[0] ? (
                    <Image
                      source={{ uri: getImageUrl(photos[0]) ?? undefined }}
                      style={styles.thumbnailImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.thumbnailImage, { backgroundColor: theme.card }]} />
                  )}
                  <View style={styles.videoThumbOverlay}>
                    <Ionicons name="play" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}

              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={`${photo}-${index}`}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedThumb({ type: 'image', index });
                    setActiveImageIndex(index);
                    mediaPagerRef.current?.scrollToOffset({ offset: width * index, animated: true });
                  }}
                  style={[
                    styles.thumbnailButton,
                    {
                      borderColor:
                        selectedThumb.type === 'image' && selectedThumb.index === index
                          ? primaryColor
                          : theme.border + '55',
                    },
                  ]}
                >
                  <Image
                    source={{ uri: getImageUrl(photo) ?? undefined }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Card */}
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: theme.background,
              marginTop: (photos.length + (hasVideoThumb ? 1 : 0)) > 1 ? 12 : -32,
            },
          ]}
        >
          <View style={[styles.indicator, { backgroundColor: theme.border }]} />
          
          <View style={styles.headerInfo}>
            <View style={styles.priceRow}>
              {!isContainer && price > 0 ? (
                <AppText variant="h2" weight="bold" color={primaryColor}>
                  {currency === 'USD' ? `${currencySymbol}${price.toLocaleString()}` : `${price.toLocaleString()} ${currencySymbol}`}
                  {property.purpose === 'rent' && <AppText variant="body" weight="medium" color={theme.subtext}> {t('property.perMonth')}</AppText>}
                </AppText>
              ) : isContainer ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="business" size={24} color={primaryColor} />
                  <AppText variant="h2" weight="bold" color={theme.text} style={{ marginLeft: 8 }}>
                    {property.property_category ? property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : t('property.building')}
                  </AppText>
                </View>
              ) : null}
              {!isContainer && (
                <View style={[styles.statusBadge, { backgroundColor: (property.is_available_for_rent || property.is_available_for_sale) ? '#dcfce7' : '#fee2e2' }]}>
                  <AppText variant="tiny" weight="bold" color={(property.is_available_for_rent || property.is_available_for_sale) ? '#166534' : '#991b1b'}>
                    {(property.is_available_for_rent || property.is_available_for_sale) ? t('property.active') : t('property.deActive')}
                  </AppText>
                </View>
              )}
            </View>

            {isContainer && (
              <View style={[styles.containerStats, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.statBox}>
                  <AppText variant="caption" color={theme.subtext}>{t('property.planned')}</AppText>
                  <AppText variant="title" weight="bold" color={theme.text}>{property.details?.planned_units || 'N/A'}</AppText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statBox}>
                  <AppText variant="caption" color={theme.subtext}>{t('property.added')}</AppText>
                  <AppText variant="title" weight="bold" color={theme.text}>{property.total_children || 0}</AppText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statBox}>
                  <AppText variant="caption" color={theme.subtext}>{t('property.available')}</AppText>
                  <AppText variant="title" weight="bold" color={primaryColor}>{property.available_children || 0}</AppText>
                </View>
              </View>
            )}

            <View style={styles.titleFavoriteRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" weight="bold" color={theme.text} style={styles.propertyTitle}>
                  {property.title}
                </AppText>
              </View>
              <TouchableOpacity 
                style={[styles.favoriteCircle, { backgroundColor: isFavorite ? '#fff1f2' : theme.card }]} 
                onPress={toggleFavorite}
              >
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ef4444" : theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* Parent Building or Container Link */}
            {property.Parent ? (
              <TouchableOpacity 
                style={[styles.parentLink, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  const parentCategory = property.Parent.property_category || 'tower';
                  router.push(`/parent/${parentCategory}/${property.Parent.property_id}`);
                }}
              >
                <Ionicons name="business-outline" size={20} color={primaryColor} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <AppText variant="small" color={theme.subtext}>{t('property.locatedIn')}</AppText>
                  <AppText variant="body" weight="bold" color={theme.text}>{property.Parent.title || property.Parent.property_type}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Floating Agent & Features Card */}
          <View style={[styles.floatingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.agentInfoRow}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => handleProfilePress(listingUser)}
                style={styles.agentMainInfo}
              >
                <Avatar user={listingUser} size="md" />
                <AppText variant="body" weight="bold" color={theme.text} style={{ marginLeft: 12 }}>
                  {listingUser?.full_name || t('people.agents')}
                </AppText>
              </TouchableOpacity>
              <View style={styles.agentActionButtons}>
                <TouchableOpacity 
                  style={[styles.messageIcon, { backgroundColor: '#25D366', marginRight: 8 }]}
                  onPress={() => handleWhatsApp(listingUser)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.messageIcon, { backgroundColor: '#1e293b' }]}
                  onPress={() => {
                    const email = listingUser?.email;
                    if (email) {
                      Linking.openURL(`mailto:${email}?subject=Inquiry: ${property.title}`);
                    }
                  }}
                >
                  <Ionicons name="mail" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.statsRow}>
              <View style={styles.statItemMini}>
                <Ionicons name="scan-outline" size={18} color="#475569" />
                <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginLeft: 6 }}>
                  {property.area_size} {t('property.sqFt')}
                </AppText>
              </View>
              {['house', 'apartment'].includes(String(property.property_type || '').toLowerCase()) && (
                <>
                  <View style={styles.statItemMini}>
                    <Ionicons name="water-outline" size={18} color="#475569" />
                    <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginLeft: 6 }}>
                      {property.bathrooms || 0} {t('property.bath')}
                    </AppText>
                  </View>
                  <View style={styles.statItemMini}>
                    <Ionicons name="bed-outline" size={18} color="#475569" />
                    <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginLeft: 6 }}>
                      {property.bedrooms || 0} {t('property.bed')}
                    </AppText>
                  </View>
                </>
              )}
            </View>

            {(property.floor || property.unit_number) && (
              <View style={[styles.statsRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border + '20', paddingTop: 12 }]}>
                {property.floor && (
                  <View style={styles.statItemMini}>
                    <MaterialCommunityIcons name="layers-outline" size={18} color="#475569" />
                    <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginLeft: 6 }}>
                      {property.floor} {t('property.floor')}
                    </AppText>
                  </View>
                )}
                {property.unit_number && (
                  <View style={styles.statItemMini}>
                    <Ionicons name="pricetag-outline" size={18} color="#475569" />
                    <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginLeft: 6 }}>
                      {property.property_type === 'shop'
                        ? `${t('property.shop')} ${t('property.unitNumber')}`
                        : property.property_type === 'office'
                          ? `${t('property.office')} ${t('property.unitNumber')}`
                          : `${t('property.apartment')} ${t('property.unitNumber')}`}{' '}
                      {property.unit_number}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Child Units Section */}
          {property.record_kind === 'container' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AppText variant="small" weight="bold" color={theme.text} style={[styles.sectionTitle, { fontSize: 13 }]}>
                  {t('property.unitsAvailableIn')} {property.property_category ? property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : t('property.container')}
                </AppText>
                {canAddUnit && (
                  <TouchableOpacity 
                    style={[styles.addUnitBtn, { borderColor: primaryColor }]}
                    onPress={() => router.push(`/property/create?parentId=${property.property_id}&category=${property.property_category}`)}
                  >
                    <Ionicons name="add" size={16} color={primaryColor} />
                    <AppText variant="small" weight="bold" color={primaryColor}>{t('property.addUnit')}</AppText>
                  </TouchableOpacity>
                )}
              </View>
              
              {loadingChildren ? (
                <ActivityIndicator size="small" color={primaryColor} style={{ marginVertical: 20 }} />
              ) : children.length > 0 ? (
                <FlatList
                  data={children}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  keyExtractor={(child) => child.property_id.toString()}
                  renderItem={({ item: child, index }) => (
                    <View style={{ marginRight: 16, width: 280 }}>
                      <PropertyCard 
                        property={child}
                        index={index}
                        variant="compact"
                        hideMediaActions={true}
                        onPress={() => router.push(`/property/${child.property_id}`)}
                      />
                    </View>
                  )}
                />
              ) : (
                <View style={[styles.emptyChildren, { backgroundColor: theme.card }]}>
                  <AppText variant="small" color={theme.subtext}>{t('property.noHomesAvailable')}</AppText>
                </View>
              )}
            </View>
          )}

          {/* Description Section */}
          <View style={styles.section}>
            <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>{t('property.propertyDescription')}</AppText>
            <AppText variant="body" color={theme.text} style={styles.descriptionText}>
              {property.description || t('property.description')}
            </AppText>
          </View>

          {/* Amenities Grid */}
          {(() => {
            const parseAmenities = (data: any) => {
              if (Array.isArray(data)) return data;
              if (typeof data === 'string' && data.startsWith('[')) {
                try {
                  return JSON.parse(data);
                } catch (e) {
                  return [];
                }
              }
              return [];
            };

            const amenitiesList = parseAmenities(property.amenities);
            const facilitiesList = parseAmenities(property.facilities);
            
            // Merge and deduplicate
            const amenities = Array.from(new Set([...amenitiesList, ...facilitiesList]));
            
            if (amenities.length === 0) return null;

            return (
              <View style={styles.section}>
                <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>{t('property.amenities')}</AppText>
                <View style={styles.amenitiesGrid}>
                  {amenities.map((amenity: string, i: number) => {
                    const amenityData = AMENITY_ICONS[amenity] || { icon: 'checkmark-circle-outline', provider: 'Ionicons' };
                    const IconProvider = amenityData.provider === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
                    return (
                      <View key={i} style={[styles.amenityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <IconProvider name={amenityData.icon as any} size={18} color={primaryColor} />
                        <AppText variant="small" weight="medium" color={theme.text} style={{ marginLeft: 8 }}>
                          {localizeAmenity(amenity)}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* Location & Map Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>{t('property.location')}</AppText>
              <TouchableOpacity 
                onPress={() => {
                  const label = property.title || t('property.location');
                  const url = Platform.select({
                    ios: `maps:0,0?q=${label}@${property.latitude},${property.longitude}`,
                    android: `geo:0,0?q=${property.latitude},${property.longitude}(${label})`
                  });
                  if (url) Linking.openURL(url);
                }}
              >
                <AppText variant="body" weight="semiBold" color={primaryColor}>{t('property.openInMaps')}</AppText>
              </TouchableOpacity>
            </View>
            <AppText variant="small" weight="medium" color={theme.subtext} style={{ marginBottom: 16 }}>
              {buildPropertyAddress()}
            </AppText>
            
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => {
                const label = property.title || t('property.location');
                const url = Platform.select({
                  ios: `maps:0,0?q=${label}@${property.latitude},${property.longitude}`,
                  android: `geo:0,0?q=${property.latitude},${property.longitude}(${label})`
                });
                if (url) Linking.openURL(url);
              }}
              style={[styles.mapContainer, { borderColor: theme.border }]}
            >
              {property.latitude && property.longitude && MapView ? (
                <>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                      latitude: parseFloat(property.latitude),
                      longitude: parseFloat(property.longitude),
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
                          latitude: parseFloat(property.latitude),
                          longitude: parseFloat(property.longitude),
                        }}
                      >
                        <View style={[styles.markerContainer, { backgroundColor: primaryColor }]}>
                          <Ionicons name="home" size={16} color="#fff" />
                        </View>
                      </Marker>
                    )}
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <BlurView intensity={40} style={styles.mapOverlayBlur} tint="dark">
                      <Ionicons name="expand-outline" size={14} color="#fff" />
                      <AppText variant="tiny" weight="bold" color="#fff" style={{ marginLeft: 4 }}>{t('property.tapToExpand')}</AppText>
                    </BlurView>
                  </View>
                </>
              ) : (
                <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
                  <Ionicons name="map-outline" size={32} color={theme.subtext} />
                  <AppText variant="small" color={theme.subtext}>{t('property.mapNotAvailable')}</AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nearby Places Section */}
          <NearbyPlaces propertyId={propertyIdNum} />

          {/* Owner Name and Property Code (Only visible to creator/agent) */}
          {canEdit && (property.owner_name || property.property_code) && (
            <View style={styles.section}>
              <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>{t('property.propertyInformation')}</AppText>
              <View style={[styles.ownerInfoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {property.property_code && (
                  <View style={styles.ownerInfoRow}>
                    <View style={styles.ownerInfoLeft}>
                      <Ionicons name="qr-code-outline" size={18} color={primaryColor} />
                      <View style={{ marginLeft: 10 }}>
                        <AppText variant="caption" color={theme.subtext}>{t('property.propertyCode')}</AppText>
                        <AppText variant="body" weight="bold" color={theme.text}>{property.property_code}</AppText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.copyButton, { backgroundColor: primaryColor + '15' }]}
                      onPress={async () => {
                        if (property.property_code) {
                          await Clipboard.setStringAsync(property.property_code);
                          Alert.alert(
                            t('property.copied'),
                            t('property.propertyCodeCopied').replace('{code}', property.property_code)
                          );
                        }
                      }}
                    >
                      <Ionicons name="copy-outline" size={16} color={primaryColor} />
                    </TouchableOpacity>
                  </View>
                )}
                {property.owner_name && (
                  <View style={[styles.ownerInfoRow, property.property_code && { marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border + '30', paddingTop: 12 }]}>
                    <View style={styles.ownerInfoLeft}>
                      <Ionicons name="person-outline" size={18} color={primaryColor} />
                      <View style={{ marginLeft: 10 }}>
                        <AppText variant="caption" color={theme.subtext}>{t('property.ownerName')}</AppText>
                        <AppText variant="body" weight="bold" color={theme.text}>{property.owner_name}</AppText>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Top Floating Actions (Sticky Header) */}
      <Animated.View style={[
        styles.stickyHeader, 
        { height: insets.top + 60, paddingTop: insets.top },
        stickyHeaderStyle
      ]} />

      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => router.back()}
        >
          <BlurView intensity={60} style={styles.blur} tint="dark">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        <Animated.View style={[styles.stickyTitleContainer, stickyTitleStyle]}>
          <AppText variant="body" weight="bold" color={theme.text} numberOfLines={1}>
            {property.title || property.property_type}
          </AppText>
        </Animated.View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => shareProperty(property)}
          >
            <BlurView intensity={60} style={styles.blur} tint="dark">
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          
          {canEdit && (
            <>
              <TouchableOpacity 
                style={[styles.iconButton, { marginLeft: 10 }]} 
                onPress={() => router.push(`/property/create?id=${id}`)}
              >
                <BlurView intensity={60} style={styles.blur} tint="dark">
                  <Ionicons name="pencil" size={18} color="#fff" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, { marginLeft: 10 }]} 
                onPress={handleDelete}
              >
                <BlurView intensity={60} style={styles.blur} tint="dark">
                  <Ionicons name="trash" size={18} color="#fff" />
                </BlurView>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Sticky Footer */}
      <BlurView 
        intensity={80} 
        tint={currentTheme === 'dark' ? 'dark' : 'light'} 
        style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.footerInner}>
          {listingUser?.phone && (
            <TouchableOpacity 
              style={[styles.callBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleCall(listingUser.phone)}
            >
              <Ionicons name="call" size={22} color={primaryColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.bookBtn, { backgroundColor: primaryColor }]}
            onPress={() => {
              if (canDeal) {
                router.push(`/deal/create?propertyId=${property.property_id}`);
              } else {
                Alert.alert(t('property.inquirySent'), t('property.inquiryRecorded'));
              }
            }}
          >
            <AppText variant="body" weight="bold" color="#fff">
              {canDeal ? t('property.transaction') : t('property.sendInquiry')}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Fullscreen Viewer Modal */}
      {photos.length > 0 && (
        <FullscreenViewer 
          visible={viewerVisible} 
          images={photos} 
          initialIndex={viewerIndex} 
          onClose={() => setViewerVisible(false)} 
        />
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: HEADER_HEIGHT,
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  imageScroll: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: width,
    height: HEADER_HEIGHT,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  stickyTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    marginTop: -32,
    minHeight: 600,
  },
  imageBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageOverlayContainer: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailSection: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  thumbnailScrollContent: {
    gap: 10,
  },
  thumbnailButton: {
    width: 84,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  headerInfo: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  containerStats: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 4,
  },
  titleFavoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyTitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  floatingCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
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
  agentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItemMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  descriptionText: {
    lineHeight: 24,
    opacity: 0.8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: '45%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapOverlayBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markerContainer: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profileSectionWrapper: {
    marginTop: 0,
  },
  miniProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  miniProfileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniProfileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniProfileArrow: {
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenImageWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  parentLink: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  ownerInfoCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  ownerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addUnitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  childrenList: {
    gap: 12,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  childImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  childImage: {
    width: '100%',
    height: '100%',
  },
  childInfo: {
    flex: 1,
  },
  emptyChildren: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default PropertyDetailsScreen;
