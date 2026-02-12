import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../../hooks/useThemeColor';
import PropertyCard from '../../../components/PropertyCard';
import favoriteStore from '../../../stores/FavoriteStore';
import { propertyService } from '../../../services/property.service';
import ScreenLayout from '../../../components/ScreenLayout';

const FavoritesScreen = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(false);
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchFavoriteProperties = async () => {
      if (favoriteStore.favoriteIds.length === 0) {
        setFavoriteProperties([]);
        return;
      }

      setLoading(true);
      try {
        const promises = favoriteStore.favoriteIds.map(id => 
          propertyService.getPropertyById(id).catch(err => {
            console.error(`Failed to fetch property ${id}`, err);
            return null;
          })
        );
        
        const results = await Promise.all(promises);
        const properties = results
          .filter(res => res !== null)
          .map(res => res.data);
          
        setFavoriteProperties(properties);
      } catch (error) {
        console.error('Error fetching favorites', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProperties();
  }, []);

  return (
    <ScreenLayout backgroundColor={themeColors.background} scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.headerBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Favorites</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : favoriteProperties.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIconBox, { backgroundColor: themeColors.card }]}>
            <MaterialCommunityIcons name="heart-broken-outline" size={60} color={themeColors.border} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Favorites Yet</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
            Save properties you love to find them easily later.
          </Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/(tabs)/properties')}
          >
            <Text style={styles.browseText}>Browse Properties</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteProperties}
          renderItem={({ item, index }) => (
            <PropertyCard
              property={item}
              index={index}
              onPress={() => router.push(`/property/${item.property_id}`)}
            />
          )}
          keyExtractor={(item) => item.property_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconBox: {
    width: 130,
    height: 130,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    opacity: 0.7,
    fontWeight: '500',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 22,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  browseText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  listContent: {
    padding: 20,
    gap: 16,
  }
});

export default FavoritesScreen;
