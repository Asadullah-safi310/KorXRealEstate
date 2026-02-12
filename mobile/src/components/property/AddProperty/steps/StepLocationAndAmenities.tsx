import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';
import { locationService } from '../../../../services/location.service';
import { AMENITY_ICONS } from '../../../../constants/Amenities';

const StepLocationAndAmenities = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const isInherited = !!(values.parent_property_id || values.parentId || values.apartment_id);

  useEffect(() => {
    if (!isInherited) {
      loadProvinces();
    }
  }, [isInherited]);

  useEffect(() => {
    const provinceId = values.province_id || values.provinceId;
    if (provinceId) {
      loadDistricts(provinceId);
    } else {
      setDistricts([]);
    }
  }, [values.province_id, values.provinceId]);

  useEffect(() => {
    const districtId = values.district_id || values.districtId;
    if (districtId) {
      loadAreas(districtId);
    } else {
      setAreas([]);
    }
  }, [values.district_id, values.districtId]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await locationService.getProvinces();
      setProvinces(res.data || []);
    } catch (err) {
      console.error('Error loading provinces', err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (pid: any) => {
    try {
      setLoadingDistricts(true);
      const res = await locationService.getDistricts(pid);
      setDistricts(res.data || []);
    } catch (err) {
      console.error('Error loading districts', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadAreas = async (did: any) => {
    try {
      setLoadingAreas(true);
      const res = await locationService.getAreas(did);
      setAreas(res.data || []);
    } catch (err) {
      console.error('Error loading areas', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const amenitiesList = Object.entries(AMENITY_ICONS).map(([label, config]) => ({
    label,
    ...config,
  }));

  const toggleAmenity = (label: string) => {
    const current = values.amenities || [];
    if (current.includes(label)) {
      setFieldValue('amenities', current.filter((i: string) => i !== label));
    } else {
      setFieldValue('amenities', [...current, label]);
    }
  };

  const renderInheritedView = () => (
    <View style={styles.inheritedContainer}>
      <View style={[styles.inheritedCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons name="link-variant" size={24} color="#fff" />
        </View>
        <AppText variant="title" weight="bold" style={{ color: theme.text }}>Inherited from Parent</AppText>
        <AppText variant="caption" style={{ color: theme.subtext, textAlign: 'center', marginTop: 4 }}>
          Location and building amenities are automatically inherited from the parent building.
        </AppText>
      </View>
      
      <View style={{ marginTop: 30 }}>
        <AppText variant="title" weight="bold" style={{ color: theme.text, marginBottom: 16 }}>Unit Specific Amenities</AppText>
        <View style={styles.amenityGrid}>
          {amenitiesList.map((item) => {
            const isActive = (values.amenities || []).includes(item.label);
            const IconProvider = item.provider === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
            return (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.amenityChip,
                  { backgroundColor: 'transparent', borderColor: theme.border },
                  isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' }
                ]}
                onPress={() => toggleAmenity(item.label)}
              >
                <IconProvider name={item.icon as any} size={20} color={isActive ? theme.primary : theme.subtext} />
                <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.primary : theme.text, marginLeft: 8 }}>
                  {item.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderStandaloneView = () => (
    <View>
      <View style={styles.section}>
        <AppText variant="title" weight="bold" style={{ color: theme.text, marginBottom: 4 }}>Location Details</AppText>
        <AppText variant="caption" style={{ color: theme.subtext, marginBottom: 16 }}>Specify the exact area and address.</AppText>
        
        <View style={{ gap: 16 }}>
          {/* Province Picker */}
          <View>
            <AppText variant="tiny" weight="bold" style={[{ color: theme.subtext }, styles.label]}>PROVINCE / CITY</AppText>
            <View style={[styles.pickerWrapper, { backgroundColor: 'transparent', borderColor: theme.border }]}>
              {loadingProvinces ? <ActivityIndicator size="small" color={theme.primary} /> : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                  {provinces.map((p) => {
                    const isSelected = values.province_id == p.id || values.provinceId == p.id;
                    return (
                      <TouchableOpacity 
                        key={p.id} 
                        style={[styles.locationChip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => {
                          setFieldValue('province_id', p.id);
                          setFieldValue('district_id', '');
                          setFieldValue('area_id', '');
                        }}
                      >
                        <AppText variant="tiny" weight="bold" style={{ color: isSelected ? '#fff' : theme.text }}>{p.name_en || p.name}</AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
            {touched.province_id && errors.province_id && <AppText variant="tiny" style={{ color: theme.danger, marginLeft: 12 }}>{errors.province_id as string}</AppText>}
          </View>

          {/* District Picker */}
          {(values.province_id || values.provinceId) && (
            <View>
              <AppText variant="tiny" weight="bold" style={[{ color: theme.subtext }, styles.label]}>DISTRICT</AppText>
              <View style={[styles.pickerWrapper, { backgroundColor: 'transparent', borderColor: theme.border }]}>
                {loadingDistricts ? <ActivityIndicator size="small" color={theme.primary} /> : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {districts.map((d) => {
                      const isSelected = values.district_id == d.id || values.districtId == d.id;
                      return (
                        <TouchableOpacity 
                          key={d.id} 
                          style={[styles.locationChip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                          onPress={() => {
                            setFieldValue('district_id', d.id);
                            setFieldValue('area_id', '');
                          }}
                        >
                          <AppText variant="tiny" weight="bold" style={{ color: isSelected ? '#fff' : theme.text }}>{d.name_en || d.name}</AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
              {touched.district_id && errors.district_id && <AppText variant="tiny" style={{ color: theme.danger, marginLeft: 12 }}>{errors.district_id as string}</AppText>}
            </View>
          )}

          {/* Area / Region Picker */}
          {(values.district_id || values.districtId) && areas.length > 0 && (
            <View>
              <AppText variant="tiny" weight="bold" style={[{ color: theme.subtext }, styles.label]}>SPECIFIC AREA</AppText>
              <View style={[styles.pickerWrapper, { backgroundColor: 'transparent', borderColor: theme.border }]}>
                {loadingAreas ? <ActivityIndicator size="small" color={theme.primary} /> : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {areas.map((a) => {
                      const isSelected = values.area_id == a.id || values.areaId == a.id;
                      return (
                        <TouchableOpacity 
                          key={a.id} 
                          style={[styles.locationChip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                          onPress={() => setFieldValue('area_id', a.id)}
                        >
                          <AppText variant="tiny" weight="bold" style={{ color: isSelected ? '#fff' : theme.text }}>{a.name_en || a.name}</AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </View>
          )}

          {/* Full Address Input */}
          <View>
            <AppText variant="tiny" weight="bold" style={[{ color: theme.subtext }, styles.label]}>STREET ADDRESS</AppText>
            <View style={[styles.addressInput, { backgroundColor: 'transparent', borderColor: theme.border }]}>
              <Ionicons name="location-outline" size={20} color={theme.subtext} style={{ marginTop: 2 }} />
              <TextInput
                style={{ flex: 1, color: theme.text, marginLeft: 10, fontFamily: 'Inter-Medium', fontSize: 13 }}
                placeholder="e.g. Street 4, Ahmad Shah Baba Mena..."
                placeholderTextColor={theme.text + '40'}
                multiline
                value={values.location || values.address}
                onChangeText={(t) => {
                  setFieldValue('location', t);
                  setFieldValue('address', t);
                }}
              />
            </View>
            {(touched.address || touched.location) && (errors.address || errors.location) && (
              <AppText variant="tiny" style={{ color: theme.danger, marginLeft: 12 }}>Address is required</AppText>
            )}
          </View>
        </View>
      </View>

      {/* Amenities */}
      <View style={[styles.section, { marginTop: 20 }]}>
        <AppText variant="title" weight="bold" style={{ color: theme.text, marginBottom: 12 }}>Amenities</AppText>
        <View style={styles.amenityGrid}>
          {amenitiesList.map((item) => {
            const isActive = (values.amenities || []).includes(item.label);
            const IconProvider = item.provider === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
            return (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                style={[
                  styles.amenityCard,
                  { backgroundColor: 'transparent', borderColor: theme.border },
                  isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' }
                ]}
                onPress={() => toggleAmenity(item.label)}
              >
                <IconProvider name={item.icon as any} size={24} color={isActive ? theme.primary : theme.subtext} />
                <AppText variant="tiny" weight="semiBold" style={{ color: theme.text, marginTop: 8, textAlign: 'center' }}>
                  {item.label}
                </AppText>
                {isActive && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Location & Features</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Finalize the position and facilities.
      </AppText>

      {isInherited ? renderInheritedView() : renderStandaloneView()}
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
    marginBottom: 24,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inheritedContainer: {
    paddingTop: 10,
  },
  inheritedCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerWrapper: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chipScroll: {
    alignItems: 'center',
    paddingRight: 12,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  addressInput: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 100,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StepLocationAndAmenities;
