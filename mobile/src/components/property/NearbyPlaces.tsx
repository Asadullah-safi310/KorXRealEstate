import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../hooks/useThemeColor';
import { propertyService } from '../../services/property.service';

interface NearbyPlace {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  distance_m: number;
  category: string;
}

interface NearbyPlacesData {
  available: boolean;
  message?: string;
  categories: {
    mosque?: NearbyPlace[];
    school?: NearbyPlace[];
    market?: NearbyPlace[];
    square?: NearbyPlace[];
    hospital?: NearbyPlace[];
  };
}

interface NearbyPlacesProps {
  propertyId: number;
}

const CATEGORY_CONFIG = {
  mosque: { icon: 'moon', label: 'Mosques' },
  school: { icon: 'school', label: 'Schools' },
  market: { icon: 'cart', label: 'Markets' },
  square: { icon: 'git-network', label: 'Squares' },
  hospital: { icon: 'medical', label: 'Hospitals' },
};

const NearbyPlaces: React.FC<NearbyPlacesProps> = ({ propertyId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NearbyPlacesData | null>(null);
  const theme = useThemeColor();
  const primaryColor = useThemeColor().primary;

  useEffect(() => {
    fetchNearbyPlaces();
  }, [propertyId]);

  const fetchNearbyPlaces = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getNearbyPlaces(propertyId);
      setData(response);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      setData({ available: false, message: 'Failed to load nearby places', categories: {} });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>
          Nearby Places
        </AppText>
        <View style={[styles.loadingContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={primaryColor} />
          <AppText variant="small" color={theme.subtext} style={{ marginTop: 8 }}>
            Loading nearby places...
          </AppText>
        </View>
      </View>
    );
  }

  if (!data || !data.available) {
    return (
      <View style={styles.section}>
        <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>
          Nearby Places
        </AppText>
        <View style={[styles.unavailableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={32} color={theme.subtext} />
          <AppText variant="small" color={theme.subtext} style={{ marginTop: 8, textAlign: 'center' }}>
            {data?.message || 'Nearby places information is not available yet. We will provide this feature soon.'}
          </AppText>
        </View>
      </View>
    );
  }

  const hasAnyPlaces = Object.values(data.categories).some(places => places && places.length > 0);

  if (!hasAnyPlaces) {
    return (
      <View style={styles.section}>
        <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>
          Nearby Places
        </AppText>
        <View style={[styles.unavailableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="location-outline" size={32} color={theme.subtext} />
          <AppText variant="small" color={theme.subtext} style={{ marginTop: 8 }}>
            No nearby places found
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <AppText variant="title" weight="bold" color={theme.text} style={styles.sectionTitle}>
        Nearby Places
      </AppText>
      
      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
        const places = data.categories[category as keyof typeof data.categories];
        if (!places || places.length === 0) return null;

        return (
          <View key={category} style={{ marginBottom: 16 }}>
            <View style={styles.categoryHeader}>
              <Ionicons name={config.icon as any} size={18} color={primaryColor} />
              <AppText variant="body" weight="bold" color={theme.text} style={{ marginLeft: 8 }}>
                {config.label}
              </AppText>
            </View>
            
            {places.map((place, index) => (
              <View
                key={place.place_id || index}
                style={[styles.placeItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.placeInfo}>
                  <AppText variant="body" weight="medium" color={theme.text}>
                    {place.name}
                  </AppText>
                  <View style={styles.distanceRow}>
                    <Ionicons name="location" size={12} color={theme.subtext} />
                    <AppText variant="caption" color={theme.subtext} style={{ marginLeft: 4 }}>
                      {place.distance_m < 1000 
                        ? `${place.distance_m}m away` 
                        : `${(place.distance_m / 1000).toFixed(1)}km away`}
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  placeInfo: {
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default NearbyPlaces;
