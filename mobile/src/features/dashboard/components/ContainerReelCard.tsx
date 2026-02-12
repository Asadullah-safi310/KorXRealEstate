import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { getImageUrl } from '../../../utils/mediaUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface ContainerReelCardProps {
  item: {
    id: number;
    title: string;
    images: string[];
    city: string;
    availableUnits: number;
    totalUnits: number;
    category: string;
    forSaleUnits?: number;
    forRentUnits?: number;
  };
  onPress: () => void;
  badgeColor?: string;
}

export const ContainerReelCard = ({ item, onPress, badgeColor }: ContainerReelCardProps) => {
  const themeColors = useThemeColor();
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  const unitLabel = item.category === 'apartment' ? 'homes' : 'units';

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={StyleSheet.absoluteFill}>
        <FlatList
          data={item.images}
          renderItem={({ item: imageUri }) => (
            <Image 
              source={{ uri: getImageUrl(imageUri) || '' }} 
              style={styles.image}
              contentFit="cover"
            />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
            setActiveImageIndex(index);
          }}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
      
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {item.images.length > 1 && (
        <View style={styles.imagePagination}>
          {item.images.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.paginationDot, 
                { backgroundColor: index === activeImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
              ]} 
            />
          ))}
        </View>
      )}

      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: badgeColor || themeColors.primary }]}>
          <AppText variant="caption" weight="bold" color="#fff" style={styles.categoryText}>
            {item.category.toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={styles.bottomInfo}>
        <AppText variant="h3" weight="bold" color="#fff" numberOfLines={2} style={styles.title}>
          {item.title}
        </AppText>
        
        <View style={styles.availableRow}>
          <Ionicons name="flash" size={14} color="#FFD700" style={{ marginRight: 4 }} />
          <AppText variant="body" weight="bold" color="#fff">
            {item.availableUnits} {unitLabel} available
          </AppText>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" style={{ marginRight: 2 }} />
          <AppText variant="small" weight="medium" color="rgba(255,255,255,0.9)">
            {item.city}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  imagePagination: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    gap: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topRow: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
