import React from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { ContainerReelCard } from './ContainerReelCard';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const SPACING = 16;

interface ContainerReelsSectionProps {
  title: string;
  data: any[];
  badgeColor?: string;
  category: string;
}

export const ContainerReelsSection = ({ title, data, badgeColor, category }: ContainerReelsSectionProps) => {
  const themeColors = useThemeColor();
  const router = useRouter();

  if (!data || data.length === 0) return null;

  const handlePress = (id: number) => {
    // Navigate to the parent profile page
    // Pattern: /parent/apartment/[id] or /parent/market/[id] or /parent/sharak/[id]
    router.push(`/parent/${category}/${id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h3" weight="bold" color={themeColors.text} style={styles.title}>
          {title}
        </AppText>
        <View style={[styles.titleUnderline, { backgroundColor: badgeColor || themeColors.primary }]} />
      </View>
      
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ContainerReelCard 
            item={{...item, category}} 
            onPress={() => handlePress(item.id)}
            badgeColor={badgeColor}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleUnderline: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10, // For shadow
  },
});
