import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenLayout from '../../../components/ScreenLayout';
import { useThemeColor } from '../../../hooks/useThemeColor';

const InfoCard = ({
  icon,
  iconFamily = 'ion',
  title,
  description,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconFamily?: 'ion' | 'mci';
  title: string;
  description: string;
  color: string;
}) => {
  const theme = useThemeColor();
  return (
    <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
        {iconFamily === 'ion' ? (
          <Ionicons name={icon as any} size={22} color={color} />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        )}
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.infoDesc, { color: theme.subtext }]}>{description}</Text>
      </View>
    </View>
  );
};

export default function AboutScreen() {
  const router = useRouter();
  const theme = useThemeColor();

  return (
    <ScreenLayout backgroundColor={theme.background} scrollable>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About KorX</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: theme.primary + '15' }]}>
            <MaterialCommunityIcons name="office-building-outline" size={30} color={theme.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>KorX Real Estate Platform</Text>
          <Text style={[styles.heroSubtitle, { color: theme.subtext }]}>
            KorX helps users discover homes, markets, towers, and sharaks in one place with modern search,
            filtering, favorites, and trusted agent workflows.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>What You Can Do</Text>
        <View style={styles.listWrap}>
          <InfoCard
            icon="search-outline"
            title="Smart Property Discovery"
            description="Browse and filter listings by location, price, type, and purpose."
            color="#3b82f6"
          />
          <InfoCard
            icon="city-variant-outline"
            iconFamily="mci"
            title="Projects and Communities"
            description="Explore towers, markets, and sharaks with available unit counts."
            color="#10b981"
          />
          <InfoCard
            icon="heart-outline"
            title="Saved Favorites"
            description="Save properties and revisit your preferred listings anytime."
            color="#ec4899"
          />
          <InfoCard
            icon="shield-checkmark-outline"
            title="Trusted Workflow"
            description="Manage listings, profiles, and deals through a role-based secure system."
            color="#f59e0b"
          />
        </View>

        <View style={[styles.metaBox, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '25' }]}>
          <Text style={[styles.metaLine, { color: theme.text }]}>Version: 2.1.0</Text>
          <Text style={[styles.metaLine, { color: theme.text }]}>Built for Afghanistan real estate operations</Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    marginTop: 8,
    marginBottom: 26,
  },
  heroBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  listWrap: {
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
  },
  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoDesc: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metaBox: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    gap: 4,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: '600',
  },
});
