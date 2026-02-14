import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { getImageUrl } from '../../../utils/mediaUtils';

const { width } = Dimensions.get('window');

interface ParentReelCardProps {
  item: {
    id: number;
    title: string;
    images: string[];
    availableUnits: number;
    category: 'tower' | 'apartment' | 'market' | 'sharak';
  };
  onPress: () => void;
  sizeScale?: number;
}

export const ParentReelCard = ({ item, onPress, sizeScale = 1 }: ParentReelCardProps) => {
  // Bigger square cards for markets and sharaks, portrait for towers/apartments
  const baseWidth = (item.category === 'market' || item.category === 'sharak') 
    ? width * 0.55 
    : width * 0.42;

  const cardWidth = baseWidth * sizeScale;
  const cardHeight = (item.category === 'market' || item.category === 'sharak')
    ? cardWidth
    : cardWidth * 1.6;
  
  const unitLabel = 
    (item.category === 'tower' || item.category === 'apartment') ? 'Homes' : 
    item.category === 'market' ? 'Shops' : 'Units';

  const imagesArr = React.useMemo(() => {
    if (Array.isArray(item.images)) {
      return item.images;
    }
    if (typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        return Array.isArray(parsed) ? parsed : [item.images];
      } catch (e) {
        return (item.images as string).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [item.images]);

  const coverImage = imagesArr.length > 0 
    ? getImageUrl(imagesArr[0]) 
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop';

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth, height: cardHeight }]} 
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Image 
        source={{ uri: coverImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <AppText 
          variant="body" 
          weight="bold" 
          color="#fff" 
          numberOfLines={2} 
          style={styles.title}
        >
          {item.title}
        </AppText>
        
        <AppText 
          variant="caption" 
          weight="medium" 
          color="rgba(255,255,255,0.9)"
        >
          Available {unitLabel}: {item.availableUnits || 0}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  content: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
