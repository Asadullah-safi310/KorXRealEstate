import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { getImageUrl } from '../utils/mediaUtils';
import authStore from '../stores/AuthStore';
import favoriteStore from '../stores/FavoriteStore';
import { shareProperty } from '../utils/shareUtils';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  FadeInDown
} from 'react-native-reanimated';
import { 
  springConfig
} from '../utils/animations';

import { useThemeColor, useCurrentTheme } from '../hooks/useThemeColor';
import { AppText } from './AppText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DefaultPropertyImage = require('../../assets/images/property.jpg');

interface PropertyCardProps {
  property: any;
  onPress: () => void;
  index?: number;
  variant?: 'default' | 'compact' | 'horizontal';
  compactDensity?: 'normal' | 'small';
  showLocationInSmall?: boolean;
  smallMetaMode?: 'basic' | 'detailed';
  hideMediaActions?: boolean;
}

const PropertyCard = observer(({
  property,
  onPress,
  index = 0,
  variant = 'default',
  compactDensity = 'normal',
  showLocationInSmall = false,
  smallMetaMode = 'detailed',
  hideMediaActions = false,
}: PropertyCardProps) => {
  const themeColors = useThemeColor();
  const currentTheme = useCurrentTheme();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  
  const isFavorite = favoriteStore.isFavorite(property.property_id);
  const heartScale = useSharedValue(1);
  const cardScale = useSharedValue(1);
  
  const toggleFavorite = (e: any) => {
    e.stopPropagation();
    
    // Heart bounce animation
    heartScale.value = withSequence(
      withSpring(1.3, springConfig),
      withSpring(1, springConfig)
    );
    
    favoriteStore.toggleFavorite(property.property_id);
  };
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, springConfig);
  };

  let rawPhotos = (property.photos && property.photos.length > 0) 
    ? property.photos 
    : (property.images && property.images.length > 0)
      ? property.images
      : [];
  
  // Handle stringified JSON if it comes from backend as a string
  if (typeof rawPhotos === 'string') {
    try {
      rawPhotos = JSON.parse(rawPhotos);
    } catch {
      rawPhotos = [];
    }
  }

  // Ensure we have an array of strings (URLs/Paths)
  const photos = Array.isArray(rawPhotos) 
    ? rawPhotos.map(p => typeof p === 'string' ? p : p.url).filter(Boolean)
    : [];
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    if (viewSize > 0) {
      const index = Math.round(contentOffset / viewSize);
      setActiveIndex(index);
    }
  };

  const formatPrice = (price: any, currency: string = 'AF') => {
    if (!price) return '-';
    const num = parseFloat(price);
    const symbol = currency === 'USD' ? '$' : 'AF';
    
    if (currency === 'USD') {
      return `$${num.toLocaleString()}`;
    }

    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr ${symbol}`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} Lac ${symbol}`;
    return `${num.toLocaleString()} ${symbol}`;
  };

  const getPropertyDisplayPrice = (property: any) => {
    const isSaleAvailable = !!property.forSale || !!property.is_available_for_sale || !!property.for_sale || !!property.isAvailableForSale;
    const isRentAvailable = !!property.forRent || !!property.is_available_for_rent || !!property.for_rent || !!property.isAvailableForRent;
    
    if (isSaleAvailable && !isRentAvailable) {
      return property.sale_price ? formatPrice(property.sale_price, property.sale_currency) : 'Price on Request';
    }
    if (isRentAvailable && !isSaleAvailable) {
      return property.rent_price ? `${formatPrice(property.rent_price, property.rent_currency)}/mo` : 'Price on Request';
    }
    if (isSaleAvailable && isRentAvailable) {
      return property.sale_price ? formatPrice(property.sale_price, property.sale_currency) : 
             property.rent_price ? `${formatPrice(property.rent_price, property.rent_currency)}/mo` : 'Price on Request';
    }
    return 'Price on Request';
  };

  const isContainer = property.record_kind === 'container';
  const metaBadgeThemeStyle = {
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    borderWidth: 1,
  };
  const dividerColor = currentTheme === 'dark' ? '#334155' : '#cbd5e1';
  const compactActionBg = currentTheme === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)';
  const displayPrice = isContainer 
    ? (property.property_category ? property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : 'Building')
    : getPropertyDisplayPrice(property);
  
  // Check availability flags ONLY - do not use purpose field as it's not the same
  const isSale = !!property.forSale || !!property.is_available_for_sale || !!property.for_sale || !!property.isAvailableForSale;
  const isRent = !!property.forRent || !!property.is_available_for_rent || !!property.for_rent || !!property.isAvailableForRent;
  const isPubliclyAvailable = isSale || isRent;
  
  let propertyTitle = '';
  
  if (property.title) {
    // If user entered a title, use it exactly
    propertyTitle = property.title;
  } else {
    // Create default title
    const propType = property.property_type || 'Property';
    
    if (property.parent_property_id) {
      // For units in a building
      if (property.unit_number && property.floor) {
        propertyTitle = `${propType} ${property.unit_number} (Floor ${property.floor})`;
      } else if (property.unit_number) {
        propertyTitle = `${propType} ${property.unit_number}`;
      } else {
        propertyTitle = `${propType} for ${isSale ? 'Sale' : isRent ? 'Rent' : 'Sale'}`;
      }
    } else if (isContainer) {
      // For containers
      propertyTitle = property.property_category ? 
        property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : 
        'Building';
    } else {
      // For regular properties - create default title
      if (isSale && isRent) {
        propertyTitle = `${propType} for Sale/Rent`;
      } else if (isSale) {
        propertyTitle = `${propType} for Sale`;
      } else if (isRent) {
        propertyTitle = `${propType} for Rent`;
      } else {
        propertyTitle = propType;
      }
    }
  }

  const addressParts: string[] = [];
  const areaName = property.AreaData?.name || property.area?.name || property.area_name;
  const cityName = property.ProvinceData?.name || property.province?.name || property.city || property.province_name;

  if (areaName) {
    let cleanedArea = areaName.replace(/(District|Nahiya)\s+\d+/gi, '').trim();
    cleanedArea = cleanedArea.replace(/^[\s,]+|[\s,]+$/g, '').trim();
    if (cleanedArea) addressParts.push(cleanedArea);
  } else if (property.address || property.location) {
    let addr = (property.address || property.location);
    let cleanedAddr = addr.replace(/(District|Nahiya)\s+\d+/gi, '').trim();
    cleanedAddr = cleanedAddr.replace(/^[\s,]+|[\s,]+$/g, '').trim();
    if (cleanedAddr) addressParts.push(cleanedAddr.split(',')[0].trim());
  }

  if (cityName) {
    addressParts.push(cityName);
  }
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Location not specified';
  const normalizedPropertyType = String(property.property_type || '').toLowerCase();
  const areaMetaValue = property.area_size ? String(property.area_size) : '-';

  const getListingMetaItems = () => {
    if (normalizedPropertyType === 'shop' || normalizedPropertyType === 'office') {
      const floorValue = property.floor ? String(property.floor) : '-';
      const unitValue = property.unit_number ? String(property.unit_number) : '-';
      const hasUnitDetails = floorValue !== '-' || unitValue !== '-';

      return [
        {
          provider: 'mci',
          icon: 'layers-outline',
          value: hasUnitDetails ? floorValue : areaMetaValue,
        },
        {
          provider: 'ion',
          icon: 'pricetag-outline',
          value: hasUnitDetails ? unitValue : (normalizedPropertyType === 'office' ? 'Office' : 'Shop'),
        },
      ];
    }

    if (normalizedPropertyType === 'land' || normalizedPropertyType === 'plot') {
      return [
        {
          provider: 'ion',
          icon: 'scan-outline',
          value: areaMetaValue,
        },
        {
          provider: 'ion',
          icon: 'map-outline',
          value: normalizedPropertyType === 'plot' ? 'Plot' : 'Land',
        },
      ];
    }

    return [
      {
        provider: 'ion',
        icon: 'bed-outline',
        value: property.bedrooms || 0,
      },
      {
        provider: 'mci',
        icon: 'shower',
        value: property.bathrooms || 0,
      },
    ];
  };

  const listingMetaItems = getListingMetaItems();

  const renderImageItem = ({ item }: { item: string }) => (
    <Pressable 
      onPress={onPress}
      style={variant === 'compact' ? styles.compactImageContainer : styles.imageContainer}
    >
      <Image 
        source={{ uri: getImageUrl(item) || '' }} 
        style={variant === 'compact' ? styles.compactImage : styles.image} 
        contentFit="cover"
        transition={300}
      />
    </Pressable>
  );

  const PaginationDots = ({ length, active }: { length: number; active: number }) => {
    if (length <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {Array.from({ length: Math.min(length, 6) }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: i === active ? themeColors.white : 'rgba(255,255,255,0.4)' },
                i === active && { width: 14, backgroundColor: themeColors.white }
              ]} 
            />
          ))}
        </View>
        <View style={styles.countBadge}>
          <AppText variant="tiny" weight="bold" color={themeColors.white}>
            {active + 1}/{length}
          </AppText>
        </View>
      </View>
    );
  };

  // Horizontal variant matching the attached image
  if (variant === 'horizontal') {
    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          <Animated.View 
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={[cardAnimatedStyle]}
          >
            <View 
              style={[styles.horizontalCard, { backgroundColor: themeColors.card }]}
            >
              {/* Image Section */}
              <View style={[styles.horizontalImageContainer, { backgroundColor: themeColors.surface }]}>
                {photos.length > 0 ? (
                  <Image 
                    source={{ uri: getImageUrl(photos[0]) || '' }} 
                    style={styles.horizontalImage} 
                    contentFit="cover"
                    transition={300}
                    placeholder={DefaultPropertyImage}
                  />
                ) : (
                  <Image 
                    source={DefaultPropertyImage}
                    style={styles.horizontalImage} 
                    contentFit="cover"
                  />
                )}
                {/* Sale/Rent badges */}
                <View style={styles.purposeBadgesContainer}>
                  {property.is_available_for_sale && (
                    <View style={[styles.purposeBadge, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                      <Text style={{ color: themeColors.white, fontSize: 7, fontWeight: '600' }}>
                        SALE
                      </Text>
                    </View>
                  )}
                  {property.is_available_for_rent && (
                    <View style={[styles.purposeBadge, { backgroundColor: 'rgba(0,0,0,0.65)', marginLeft: property.is_available_for_sale ? 4 : 0 }]}>
                      <Text style={{ color: themeColors.white, fontSize: 7, fontWeight: '600' }}>
                        RENT
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Content Section */}
              <View style={styles.horizontalContent}>
                <View style={styles.horizontalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text, marginBottom: 4 }} numberOfLines={1}>
                      {propertyTitle}
                    </Text>
                    <View style={styles.horizontalLocation}>
                      <Ionicons name="location" size={9} color={themeColors.subtext} />
                      <Text style={{ fontSize: 8, color: themeColors.subtext, flex: 1, marginLeft: 2 }} numberOfLines={1}>
                        {fullAddress}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={toggleFavorite}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Animated.View style={heartAnimatedStyle}>
                      <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? themeColors.danger : themeColors.subtext} />
                    </Animated.View>
                  </TouchableOpacity>
                </View>

                <View style={styles.horizontalPriceRow}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: themeColors.primary }} numberOfLines={1}>
                    {displayPrice}
                  </Text>
                </View>

                <View style={[styles.horizontalBottomRow, { borderTopColor: dividerColor }]}>
                  {!isContainer ? (
                    <>
                      {listingMetaItems.map((item, metaIdx) => (
                        <View key={`horizontal-meta-${metaIdx}`} style={[styles.horizontalMetaItemBadge, metaBadgeThemeStyle]}>
                          {item.provider === 'mci' ? (
                            <MaterialCommunityIcons name={item.icon as any} size={11} color={themeColors.subtext} />
                          ) : (
                            <Ionicons name={item.icon as any} size={11} color={themeColors.subtext} />
                          )}
                          <Text style={{ marginLeft: 3, fontSize: 9, fontWeight: '500', color: themeColors.text }}>{item.value}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={[styles.horizontalMetaItemBadge, metaBadgeThemeStyle]}>
                      <Ionicons name="business-outline" size={11} color={themeColors.subtext} />
                      <Text style={{ marginLeft: 3, fontSize: 9, fontWeight: '500', color: themeColors.text }}>{property.total_children || 0}</Text>
                    </View>
                  )}
                  {(property.Agent || property.Creator) ? (
                    (property.Agent?.profile_picture || property.Creator?.profile_picture) ? (
                      <Image 
                        source={{ uri: getImageUrl(property.Agent?.profile_picture || property.Creator?.profile_picture) || '' }}
                        style={styles.horizontalAgentAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.horizontalAgentAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.surface }]}>
                        <Ionicons name="person" size={11} color={themeColors.subtext} />
                      </View>
                    )
                  ) : null}
                </View>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  if (variant === 'compact') {
    const isSmallCompact = compactDensity === 'small';
    const displayPrice = getPropertyDisplayPrice(property);
    const typeLabel = property.property_type || 'Property';
    const compactTagBg = isSmallCompact
      ? (currentTheme === 'dark' ? '#e2e8f0' : '#f1f5f9')
      : undefined;
    const compactTagTextColor = isSmallCompact ? '#334155' : themeColors.white;

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View 
          entering={FadeInDown.delay(index * 100).duration(500)}
          style={[cardAnimatedStyle]}
        >
          <View 
            style={[styles.compactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          >
            <View style={[styles.compactMedia, isSmallCompact && styles.compactMediaSmall]}>
              {photos.length > 0 ? (
                <Pressable onPress={onPress} style={[styles.compactImageContainer, isSmallCompact && styles.compactImageContainerSmall]}>
                  <Image
                    source={{ uri: getImageUrl(photos[0]) || '' }}
                    style={styles.compactImage}
                    contentFit="cover"
                    transition={300}
                    placeholder={DefaultPropertyImage}
                  />
                </Pressable>
              ) : (
                <View>
                  <Image source={DefaultPropertyImage} style={styles.compactImage} contentFit="cover" />
                </View>
              )}
              
              {isSmallCompact ? (
                <LinearGradient
                  colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.72)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.compactImageOverlay}
                />
              ) : (
                <View style={styles.compactImageOverlay} />
              )}
              
              {isPubliclyAvailable && (
                <View
                  style={[
                    styles.availabilityDotAbsolute,
                    {
                      backgroundColor: themeColors.success,
                      top: isSmallCompact ? 10 : 12,
                      left: isSmallCompact ? 10 : 12,
                      right: 'auto',
                      width: isSmallCompact ? 12 : 16,
                      height: isSmallCompact ? 12 : 16,
                      borderRadius: isSmallCompact ? 6 : 8,
                      borderWidth: isSmallCompact ? 2 : 2.5,
                    },
                  ]}
                />
              )}

              <View style={[styles.compactBadgeRow, { top: isSmallCompact ? 10 : 12, left: isSmallCompact ? 24 : 34 }]}>
                {isSale && (
                  <View
                    style={[
                      styles.compactTag,
                      {
                        backgroundColor: compactTagBg || themeColors.primary,
                        paddingHorizontal: isSmallCompact ? 5 : 8,
                        paddingVertical: isSmallCompact ? 1 : 4,
                        borderRadius: isSmallCompact ? 5 : 6,
                      },
                    ]}
                  >
                    <AppText variant="tiny" weight="bold" color={compactTagTextColor} style={{ fontSize: isSmallCompact ? 8 : 11 }}>
                      Sale
                    </AppText>
                  </View>
                )}
                {isRent && (
                  <View
                    style={[
                      styles.compactTag,
                      {
                        backgroundColor: compactTagBg || themeColors.success,
                        paddingHorizontal: isSmallCompact ? 5 : 8,
                        paddingVertical: isSmallCompact ? 1 : 4,
                        borderRadius: isSmallCompact ? 5 : 6,
                      },
                    ]}
                  >
                    <AppText variant="tiny" weight="bold" color={compactTagTextColor} style={{ fontSize: isSmallCompact ? 8 : 11 }}>
                      Rent
                    </AppText>
                  </View>
                )}
              </View>
              
              {!hideMediaActions && (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.compactFavorite,
                      {
                        top: isSmallCompact ? 10 : 12,
                        right: isSmallCompact ? 44 : 52,
                        backgroundColor: compactActionBg,
                        width: isSmallCompact ? 30 : 36,
                        height: isSmallCompact ? 30 : 36,
                        borderRadius: isSmallCompact ? 15 : 18,
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      shareProperty(property);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social-outline" size={isSmallCompact ? 15 : 18} color={themeColors.text} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.compactFavorite,
                      {
                        top: isSmallCompact ? 10 : 12,
                        right: isSmallCompact ? 10 : 12,
                        backgroundColor: compactActionBg,
                        width: isSmallCompact ? 30 : 36,
                        height: isSmallCompact ? 30 : 36,
                        borderRadius: isSmallCompact ? 15 : 18,
                      },
                    ]}
                    onPress={toggleFavorite}
                    activeOpacity={0.7}
                  >
                    <Animated.View style={heartAnimatedStyle}>
                      <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={isSmallCompact ? 15 : 18}
                        color={isFavorite ? themeColors.danger : themeColors.text}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={[styles.compactBody, isSmallCompact && styles.compactBodySmall]}>
              {isSmallCompact ? null : (
                <View style={styles.compactTitleRow}>
                  <>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body" weight="bold" numberOfLines={1} style={{ marginBottom: 4, fontSize: 14, color: themeColors.text }}>
                        {propertyTitle}
                      </AppText>
                      <AppText variant="tiny" color={themeColors.subtext} numberOfLines={1} style={{ marginBottom: 8, fontSize: 10 }}>
                        {property.parent_property_id && property.unit_number ? `${typeLabel} in ${fullAddress}` : fullAddress}
                      </AppText>
                    </View>
                    {!isContainer && (
                      <View style={styles.compactBedsAndBaths}>
                        {listingMetaItems.map((item, metaIdx) => (
                          <View key={`compact-meta-${metaIdx}`} style={[styles.compactMetaItemBadge, metaBadgeThemeStyle]}>
                            {item.provider === 'mci' ? (
                              <MaterialCommunityIcons name={item.icon as any} size={13} color={themeColors.subtext} />
                            ) : (
                              <Ionicons name={item.icon as any} size={13} color={themeColors.subtext} />
                            )}
                            <AppText variant="tiny" weight="medium" color={themeColors.text} style={{ marginLeft: 3, fontSize: 11 }}>
                              {item.value}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    )}
                    {isContainer && (
                      <View style={styles.compactBedsAndBaths}>
                        <View style={[styles.compactMetaItemBadge, metaBadgeThemeStyle]}>
                          <Ionicons name="business-outline" size={13} color={themeColors.subtext} />
                          <AppText variant="tiny" weight="medium" color={themeColors.text} style={{ marginLeft: 3, fontSize: 11 }}>
                            {property.total_children || 0}
                          </AppText>
                        </View>
                      </View>
                    )}
                  </>
                </View>
              )}
              {isSmallCompact ? null : (
                <View style={[styles.compactBottomRow, { borderTopColor: dividerColor }]}>
                  <AppText variant="body" weight="bold" color={themeColors.primary} numberOfLines={1} style={{ fontSize: 14 }}>
                    {displayPrice}
                  </AppText>
                  {(property.Agent || property.Creator) ? (
                    <View style={styles.compactAgentInfo}>
                      {(property.Agent?.profile_picture || property.Creator?.profile_picture) ? (
                        <Image 
                          source={{ uri: getImageUrl(property.Agent?.profile_picture || property.Creator?.profile_picture) || '' }}
                          style={styles.compactAgentAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.compactAgentAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="person" size={12} color={themeColors.subtext} />
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
            {isSmallCompact && (
              <View style={styles.smallCompactInfoOverlay}>
                <View style={styles.smallCompactTopRow}>
                  <AppText variant="tiny" weight="bold" color={themeColors.warning} numberOfLines={1} style={styles.smallCompactPrice}>
                    {displayPrice}
                  </AppText>
                  {!isContainer && (
                    <View style={styles.smallCompactMetaRow}>
                      {listingMetaItems.map((item, metaIdx) => (
                        <View key={`small-compact-meta-${metaIdx}`} style={styles.smallCompactMetaItem}>
                          {item.provider === 'mci' ? (
                            <MaterialCommunityIcons name={item.icon as any} size={11} color={themeColors.white} />
                          ) : (
                            <Ionicons name={item.icon as any} size={11} color={themeColors.white} />
                          )}
                          <AppText variant="tiny" weight="semiBold" color={themeColors.white} style={styles.smallCompactMetaText}>
                            {item.value}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <AppText variant="tiny" weight="bold" color={themeColors.white} numberOfLines={1} style={styles.smallCompactTitle}>
                  {propertyTitle}
                </AppText>
                {showLocationInSmall && (
                  <AppText variant="tiny" weight="medium" color={themeColors.white} numberOfLines={1} style={styles.smallCompactLocation}>
                    {fullAddress}
                  </AppText>
                )}
                {smallMetaMode === 'detailed' && (
                  <View style={styles.smallCompactMetaRow}>
                    <>
                      <View style={styles.smallCompactMetaItem}>
                        <MaterialCommunityIcons name="layers-outline" size={11} color={themeColors.white} />
                        <AppText variant="tiny" weight="semiBold" color={themeColors.white} style={styles.smallCompactMetaText}>
                          {property.floor || '-'}
                        </AppText>
                      </View>
                      <View style={styles.smallCompactMetaItem}>
                        <Ionicons name="pricetag-outline" size={11} color={themeColors.white} />
                        <AppText variant="tiny" weight="semiBold" color={themeColors.white} style={styles.smallCompactMetaText}>
                          {property.unit_number || '-'}
                        </AppText>
                      </View>
                    </>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={[cardAnimatedStyle]}
      >
        <View 
          style={[
            styles.container, 
            { 
              backgroundColor: themeColors.card, 
              borderColor: themeColors.border,
              borderWidth: 1,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 20,
            }
          ]}
        >
          {/* Image Section */}
          <View style={styles.imageWrapper}>
            {photos.length > 0 ? (
              <FlatList
                data={photos}
                renderItem={renderImageItem}
                keyExtractor={(_, idx) => `default-${idx}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.flatList}
                nestedScrollEnabled={true}
              />
            ) : (
              <View>
                <Image source={DefaultPropertyImage} style={styles.image} contentFit="cover" />
              </View>
            )}

            {isPubliclyAvailable && (
              <View style={[styles.availabilityDotAbsolute, { backgroundColor: themeColors.success, top: 12, left: 12, right: 'auto' }]} />
            )}

            <PaginationDots length={photos.length} active={activeIndex} />
            
            <View style={[styles.badgeRow, { top: 12, left: 34 }]}>
              {isSale && (
                <View style={[styles.statusTag, { backgroundColor: themeColors.primary }]}> 
                  <AppText variant="tiny" weight="bold" color={themeColors.white}>Sale</AppText>
                </View>
              )}
              {isRent && (
                <View style={[styles.statusTag, { backgroundColor: themeColors.success }]}> 
                  <AppText variant="tiny" weight="bold" color={themeColors.white}>Rent</AppText>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.favoriteBtn, { top: 12, right: 56, backgroundColor: themeColors.card }]}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                shareProperty(property);
              }}
            >
              <Ionicons name="share-social-outline" size={18} color={themeColors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.favoriteBtn, { top: 12, right: 12, backgroundColor: themeColors.card }]}
              activeOpacity={0.8}
              onPress={toggleFavorite}
            >
              <Animated.View style={heartAnimatedStyle}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? themeColors.danger : themeColors.text} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.priceRow}>
              <AppText 
                variant="h2" 
                weight="bold" 
                numberOfLines={1} 
                color="#059669"
                style={{ fontSize: 14, letterSpacing: -0.2 }}
              > 
                {displayPrice}
              </AppText>
            </View>

            <View style={styles.titleLocationRow}>
              <View style={{ flex: 1 }}>
                <AppText 
                  variant="body" 
                  weight="bold" 
                  numberOfLines={2} 
                  style={{ fontSize: 14, lineHeight: 20, color: themeColors.text, marginBottom: 6 }}
                >
                  {propertyTitle}
                </AppText>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={10} color={themeColors.subtext} />
                  <AppText 
                    variant="small" 
                    color={themeColors.subtext} 
                    numberOfLines={1} 
                    style={{ flex: 1, marginLeft: 4, fontSize: 9 }}
                  >
                    {fullAddress || 'Location details'}
                  </AppText>
                </View>
              </View>
              {!isContainer && (
                <View style={styles.bedsAndBathsContainer}>
                  {listingMetaItems.map((item, metaIdx) => (
                    <View key={`default-meta-${metaIdx}`} style={[styles.bedsAndBathsItem, metaBadgeThemeStyle]}>
                      {item.provider === 'mci' ? (
                        <MaterialCommunityIcons name={item.icon as any} size={13} color={themeColors.subtext} />
                      ) : (
                        <Ionicons name={item.icon as any} size={13} color={themeColors.subtext} />
                      )}
                      <Text style={{ marginLeft: 3, fontSize: 11, fontWeight: '500', color: themeColors.text }}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {isContainer && (
                <View style={styles.bedsAndBathsContainer}>
                  <View style={[styles.bedsAndBathsItem, metaBadgeThemeStyle]}>
                    <Ionicons name="business-outline" size={13} color={themeColors.subtext} />
                    <Text style={{ marginLeft: 3, fontSize: 11, fontWeight: '500', color: themeColors.text }}>
                      {property.total_children || 0}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            
            <View style={[styles.agentRow, { borderTopColor: dividerColor }]}>
              <View style={styles.agentInfo}>
                {(property.Agent || property.Creator) ? (
                  <>
                    {(property.Agent?.profile_picture || property.Creator?.profile_picture) ? (
                      <Image 
                        source={{ uri: getImageUrl(property.Agent?.profile_picture || property.Creator?.profile_picture) || '' }}
                        style={styles.agentAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.agentAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person" size={16} color={themeColors.subtext} />
                      </View>
                    )}
                    <AppText variant="small" color={themeColors.text} style={{ marginLeft: 8, fontSize: 12 }}>
                      {property.Agent?.full_name || property.Creator?.full_name || 'Agent'}
                    </AppText>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  container: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  compactCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 0,
    width: '100%',
  },
  compactMedia: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  compactMediaSmall: {
    height: 155,
  },
  compactFlatList: {
    width: '100%',
    height: '100%',
  },
  compactImageContainer: {
    width: '100%',
    height: 180,
  },
  compactImageContainerSmall: {
    height: 155,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  compactBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  badgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityDotAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#fff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  compactTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactFavorite: {
    position: 'absolute',
    top: 40,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  compactBody: {
    padding: 12,
  },
  compactBodySmall: {
    padding: 0,
    height: 0,
    overflow: 'hidden',
  },
  smallCompactInfoOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 3,
  },
  smallCompactPrice: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 0,
  },
  smallCompactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  smallCompactTitle: {
    fontSize: 11,
    marginBottom: 2,
  },
  smallCompactLocation: {
    fontSize: 8,
    opacity: 0.9,
    marginBottom: 3,
  },
  smallCompactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallCompactMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCompactMetaText: {
    marginLeft: 3,
    fontSize: 9,
  },
  compactTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  compactBedsAndBaths: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactMetaItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  compactBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  compactAgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAgentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  compactTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactSeparator: {
    width: 1,
    height: 18,
    marginHorizontal: 12,
  },
  imageWrapper: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  flatList: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    height: 240,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  infoSection: {
    padding: 18,
    paddingTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  priceSubText: {
    fontSize: 13,
    fontWeight: '500',
  },
  titleLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
  },
  bedsAndBathsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bedsAndBathsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureSeparator: {
    width: 1,
    height: 16,
    marginHorizontal: 4,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  // Horizontal variant styles
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 140,
  },
  horizontalImageContainer: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  purposeBadgesContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  purposeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  horizontalContent: {
    flex: 1,
    padding: 10,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  horizontalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  horizontalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  horizontalFavorite: {
    marginLeft: 8,
    padding: 4,
  },
  horizontalPriceRow: {
    marginVertical: 6,
  },
  horizontalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  horizontalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalMetaItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  horizontalBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  horizontalAgentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default PropertyCard;
