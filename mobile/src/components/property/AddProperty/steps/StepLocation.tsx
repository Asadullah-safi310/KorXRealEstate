import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';
import { AnimatedFormInput } from '../../../AnimatedFormInput';
import * as Location from 'expo-location';


// Safe import for react-native-maps
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.error('Failed to load react-native-maps', e);
  }
}

const StepLocation = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: values.latitude || 34.5553, // Default to Kabul
    longitude: values.longitude || 69.2075,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    if (values.latitude && values.longitude) {
      setMapRegion({
        latitude: values.latitude,
        longitude: values.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [values.latitude, values.longitude]);

  const onMapPress = (e: any) => {
    const coordinate = e.nativeEvent?.coordinate;
    if (coordinate) {
      setFieldValue('latitude', coordinate.latitude);
      setFieldValue('longitude', coordinate.longitude);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFieldValue('latitude', location.coords.latitude);
      setFieldValue('longitude', location.coords.longitude);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get current location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      setShowResults(true);
      const results = await Location.geocodeAsync(searchQuery);
      
      // Enrich results with reverse geocoding for better display
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          try {
            const addresses = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            const address = addresses[0];
            return {
              ...result,
              displayName: [
                address?.name,
                address?.street,
                address?.district,
                address?.city,
                address?.region,
                address?.country
              ].filter(Boolean).join(', ') || 'Unknown Location',
            };
          } catch {
            return {
              ...result,
              displayName: 'Unknown Location',
            };
          }
        })
      );
      
      setSearchResults(enrichedResults);
      
      if (results.length === 0) {
        alert('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to search location. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    setFieldValue('latitude', result.latitude);
    setFieldValue('longitude', result.longitude);
    setMapRegion({
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  const isMapAvailable = Platform.OS !== 'web' && MapView;
  const isInherited = values.parent_property_id || values.apartment_id;

  if (isInherited) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop: 100 }]}>
        <View style={[styles.placeholderIcon, { backgroundColor: theme.primary + '10' }]}>
          <MaterialCommunityIcons name="map-marker-check-outline" size={48} color={theme.primary} />
        </View>
        <AppText variant="h2" weight="bold" style={{ color: theme.text, textAlign: 'center' }}>Location Inherited</AppText>
        <AppText variant="body" style={[{ color: theme.subtext, textAlign: 'center', marginTop: 10 }]}>
          This unit will inherit the location from its parent {values.apartment_id ? 'Apartment' : values.property_category}. You don&apos;t need to set it manually.
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Map Placement</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        {isMapAvailable 
          ? 'Search for a location or pin the exact location on the map.' 
          : 'Interactive map is currently unavailable. Please provide coordinates.'}
      </AppText>

      {/* Search Input */}
      {isMapAvailable && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}>
              <Ionicons name="search" size={20} color={theme.subtext} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search location (e.g., Laghman Tower, Kabul)"
                placeholderTextColor={theme.text + '40'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color={theme.subtext} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: theme.primary }]}
              onPress={searchLocation}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <View style={[styles.resultsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView style={styles.resultsList} nestedScrollEnabled>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.resultItem, { borderBottomColor: theme.border }]}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Ionicons name="location" size={20} color={theme.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <AppText variant="body" weight="semiBold" color={theme.text} numberOfLines={2}>
                        {result.displayName || `Location ${index + 1}`}
                      </AppText>
                      <AppText variant="tiny" color={theme.subtext} style={{ marginTop: 2 }}>
                        {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={[styles.mapWrapper, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {isMapAvailable ? (
          <>
            <MapView
              style={styles.map}
              onPress={onMapPress}
              region={mapRegion}
              provider={PROVIDER_GOOGLE || 'google'}
            >
              {values.latitude && values.longitude && (
                <Marker
                  coordinate={{ latitude: values.latitude, longitude: values.longitude }}
                  title="Property Location"
                  pinColor={theme.primary}
                />
              )}
            </MapView>
            <View style={styles.mapOverlay}>
              <View style={[styles.overlayBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Ionicons name="information-circle" size={14} color="#fff" />
                <AppText variant="tiny" weight="semiBold" style={{ color: '#fff' }}>Tap map to place marker</AppText>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.currentLocationButton, { backgroundColor: theme.primary }]}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="locate" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            <View style={[styles.placeholderIcon, { backgroundColor: theme.primary + '10' }]}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={theme.primary} />
            </View>
            <AppText variant="title" weight="bold" style={{ color: theme.text }}>Map Preview Restricted</AppText>
            <AppText variant="caption" style={[{ color: theme.subtext }, styles.placeholderSubtext]}>
              Manual coordinate entry is required.
            </AppText>
          </View>
        )}
      </View>
      
      <View style={styles.coordsGrid}>
        <View style={{ flex: 1 }}>
          <AnimatedFormInput
            label="Latitude"
            placeholder="0.000000"
            keyboardType="numeric"
            value={values.latitude ? String(values.latitude) : ''}
            onChangeText={(v) => setFieldValue('latitude', parseFloat(v) || null)}
            error={errors.latitude as string}
            touched={touched.latitude}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AnimatedFormInput
            label="Longitude"
            placeholder="0.000000"
            keyboardType="numeric"
            value={values.longitude ? String(values.longitude) : ''}
            onChangeText={(v) => setFieldValue('longitude', parseFloat(v) || null)}
            error={errors.longitude as string}
            touched={touched.longitude}
          />
        </View>
      </View>
      
      <View style={[styles.tipBox, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
        <Ionicons name="bulb-outline" size={20} color={theme.primary} />
        <AppText variant="caption" weight="medium" style={[{ color: theme.text }, styles.tipText]}>
          Precise location helps buyers find your property and increases trust in your listing.
        </AppText>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionSubtitle: { 
    marginBottom: 20,
    marginTop: 2,
  },
  mapWrapper: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: 24,
    position: 'relative',
  },
  map: { 
    flex: 1,
  },
  mapPlaceholder: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderSubtext: {
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsList: {
    maxHeight: 240,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  coordsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  coordBox: {
    flex: 1,
    gap: 6,
  },
  coordLabel: {
    letterSpacing: 1,
    marginLeft: 4,
  },
  coordInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  tipBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    lineHeight: 18,
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
});

export default StepLocation;
