import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { AppText } from '../../../AppText';
import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../../hooks/useThemeColor';

const { width } = Dimensions.get('window');

const StepAmenities = observer(() => {
  const { values, setFieldValue } = useFormikContext<any>();
  const theme = useThemeColor();

  const amenitiesList = [
    { label: 'Parking', icon: 'car-outline', provider: 'Ionicons' },
    { label: 'Security Guard', icon: 'shield-checkmark-outline', provider: 'Ionicons' },
    { label: 'Central Heating System', icon: 'thermometer-outline', provider: 'Ionicons' },
    { label: 'Cupboards', icon: 'closet-outline', provider: 'MaterialCommunityIcons' },
    { label: 'Sunny', icon: 'sunny-outline', provider: 'Ionicons' },
    { label: 'Basement', icon: 'stairs-down', provider: 'MaterialCommunityIcons' },
    { label: 'AC', icon: 'air-conditioner', provider: 'MaterialCommunityIcons' },
    { label: 'Lift', icon: 'elevator-passenger-outline', provider: 'MaterialCommunityIcons' },
    { label: 'Furnished', icon: 'chair-rolling', provider: 'MaterialCommunityIcons' },
    { label: 'Semi-Furnished', icon: 'chair-school', provider: 'MaterialCommunityIcons' },
    { label: 'Solar Facility', icon: 'solar-power-variant-outline', provider: 'MaterialCommunityIcons' },
    { label: 'Generator Facility', icon: 'engine-outline', provider: 'MaterialCommunityIcons' },
  ];

  const toggleAmenity = (label: string) => {
    const currentAmenities = values.amenities || [];
    if (currentAmenities.includes(label)) {
      setFieldValue('amenities', currentAmenities.filter((item: string) => item !== label));
    } else {
      setFieldValue('amenities', [...currentAmenities, label]);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Property Amenities</AppText>
        <AppText variant="small" color={theme.subtext} style={styles.sectionSubtitle}>Select all the amenities available in this property.</AppText>
        
        <View style={styles.grid}>
          {amenitiesList.map((item) => {
            const isActive = (values.amenities || []).includes(item.label);
            const IconProvider = item.provider === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
            
            return (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                style={[
                  styles.amenityCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                ]}
                onPress={() => toggleAmenity(item.label)}
              >
                <View style={[styles.iconCircle, isActive && { backgroundColor: theme.primary + '15' }]}>
                  <IconProvider
                    name={item.icon as any}
                    size={28}
                    color={isActive ? theme.primary : theme.subtext}
                  />
                </View>
                <AppText variant="tiny" weight="bold" color={isActive ? theme.text : theme.subtext} style={{ textAlign: 'center' }}>
                  {item.label}
                </AppText>
                {isActive && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={12} color={theme.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionSubtitle: {
    marginBottom: 16,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    width: (width - 40 - 24) / 3,
    aspectRatio: 0.85,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StepAmenities;
