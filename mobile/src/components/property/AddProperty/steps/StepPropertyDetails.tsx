import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  Pressable
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';
import { AnimatedFormInput } from '../../../AnimatedFormInput';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { smoothLayout } from '../../../../utils/animations';

const AREA_UNITS = [
  { label: 'Square Feet', value: 'sqft', symbol: 'sq ft' },
  { label: 'Square Meter', value: 'sqm', symbol: 'm²' },
  { label: 'Numra', value: 'numra', symbol: 'Numra' },
  { label: 'Biswa', value: 'biswa', symbol: 'Biswa' },
  { label: 'Gaz', value: 'gaz', symbol: 'Gaz' },
  { label: 'Kanal', value: 'kanal', symbol: 'Kanal' },
  { label: 'Marla', value: 'marla', symbol: 'Marla' },
  { label: 'Jerib', value: 'jerib', symbol: 'Jerib' },
];

const CustomSlider = ({ label, value, onChange, max = 10 }: any) => {
  const theme = useThemeColor();
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>{label}</AppText>
        <View style={[styles.sliderBadge, { backgroundColor: theme.primary + '15' }]}>
          <AppText variant="caption" weight="bold" style={{ color: theme.primary }}>
            {value === max ? `${max}+` : value}
          </AppText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderTrack}>
        {[...Array(max + 1).keys()].map((num) => (
          <TouchableOpacity
            key={num}
            activeOpacity={0.7}
            style={[
              styles.sliderThumb,
              { borderColor: theme.border, backgroundColor: 'transparent' },
              value === num && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => onChange(num)}
          >
            <AppText weight="bold" style={[{ color: theme.text }, value === num && { color: theme.white }]}>
              {num === max ? `${max}+` : num}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const StepPropertyDetails = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const isAddingChild = !!(values.parent_property_id || values.parentId || values.apartment_id) || 
                        (!values.is_parent && values.property_category && values.property_category !== 'normal');

  const showBedBath = !values.is_parent && (values.property_type === 'house' || values.property_type === 'apartment');
  const showUnitFields = isAddingChild && (values.property_type === 'apartment' || values.property_type === 'shop' || values.property_type === 'office');
  
  const selectedUnit = AREA_UNITS.find(u => u.value === values.area_unit) || AREA_UNITS[0];
  
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Details</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Specific information about the space.
      </AppText>

      {/* Unit Specific Fields */}
      {showUnitFields && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={{ gap: 16, marginBottom: 0 }}
        >
          <View style={styles.row}>
            {/* Apartment Number (Only for Apartment type) */}
            {values.property_type === 'apartment' && (
              <View style={{ flex: 1 }}>
                <AnimatedFormInput
                  label="Apartment No"
                  placeholder="e.g. 4B"
                  value={values.unit_number}
                  onChangeText={(text) => setFieldValue('unit_number', text)}
                  error={errors.unit_number as string}
                  touched={!!touched.unit_number}
                  icon={<Ionicons name="pricetag-outline" size={20} color={theme.subtext} />}
                />
              </View>
            )}
            
            {values.property_type === 'apartment' && <View style={{ width: 12 }} />}

            {/* Floor */}
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Floor"
                placeholder="e.g. 2nd"
                value={values.floor}
                onChangeText={(text) => setFieldValue('floor', text)}
                error={errors.floor as string}
                touched={!!touched.floor}
                icon={<MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} />}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Area Size (Hide for parents) */}
      {!values.is_parent && (
        <Animated.View layout={smoothLayout}>
          <AppText variant="caption" weight="semiBold" style={{ color: theme.text, marginBottom: 8 }}>
            Total Area (Optional)
          </AppText>
          <View style={styles.areaInputRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.areaInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. 1200"
                placeholderTextColor={theme.subtext}
                value={values.area_size?.toString()}
                onChangeText={(t) => setFieldValue('area_size', t)}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity 
              style={[styles.unitSelector, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
              onPress={() => setShowUnitPicker(true)}
            >
              <AppText variant="small" weight="bold" style={{ color: theme.primary }}>
                {selectedUnit.symbol}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={theme.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          {touched.area_size && errors.area_size && (
            <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>
              {errors.area_size as string}
            </AppText>
          )}
        </Animated.View>
      )}

      {/* Unit Picker Modal */}
      <Modal visible={showUnitPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnitPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="bold" style={{ color: theme.text }}>Select Unit</AppText>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {AREA_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitOption,
                    { borderBottomColor: theme.border },
                    values.area_unit === unit.value && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    setFieldValue('area_unit', unit.value);
                    setShowUnitPicker(false);
                  }}
                >
                  <AppText variant="body" weight="semiBold" style={{ color: theme.text }}>
                    {unit.label}
                  </AppText>
                  {values.area_unit === unit.value && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Bedrooms / Bathrooms */}
      {showBedBath && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={styles.slidersRow}
        >
          <CustomSlider
            label="Bedrooms"
            value={values.bedrooms}
            onChange={(v: number) => setFieldValue('bedrooms', v)}
            max={20}
          />
          <CustomSlider
            label="Bathrooms"
            value={values.bathrooms}
            onChange={(v: number) => setFieldValue('bathrooms', v)}
            max={20}
          />
        </Animated.View>
      )}

      {/* Building Specific (For Parents) */}
      {values.is_parent && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={{ gap: 16 }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Total Floors"
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={values.total_floors?.toString()}
                onChangeText={(text) => setFieldValue('total_floors', text)}
                error={errors.total_floors as string}
                touched={!!touched.total_floors}
                icon={<MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} />}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Planned Units"
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={values.planned_units?.toString()}
                onChangeText={(text) => setFieldValue('planned_units', text)}
                error={errors.planned_units as string}
                touched={!!touched.planned_units}
                icon={<MaterialCommunityIcons name="home-group" size={20} color={theme.subtext} />}
              />
            </View>
          </View>
        </Animated.View>
      )}
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
  inputGroup: { 
    marginBottom: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  row: { 
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slidersRow: {
    gap: 10,
  },
  sliderContainer: { 
    marginBottom: 16,
  },
  sliderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sliderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sliderTrack: { 
    paddingHorizontal: 4, 
    gap: 12,
  },
  sliderThumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
  areaInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  areaInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    borderWidth: 1.5,
  },
  unitSelector: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
});

export default StepPropertyDetails;
