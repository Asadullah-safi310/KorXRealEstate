import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { ParentReelCard } from './ParentReelCard';
import { useRouter } from 'expo-router';

interface ParentReelSectionProps {
  title: string;
  data: any[];
  category: 'tower' | 'apartment' | 'market' | 'sharak';
  cardSizeScale?: number;
}

export const ParentReelSection = ({ title, data, category, cardSizeScale = 1 }: ParentReelSectionProps) => {
  const themeColors = useThemeColor();
  const router = useRouter();

  const handlePress = (id: number) => {
    router.push(`/parent/${category}/${id}`);
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2" weight="bold" color={themeColors.text} style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ParentReelCard 
            item={{...item, category}} 
            sizeScale={cardSizeScale}
            onPress={() => handlePress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});
