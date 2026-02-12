import React, { useEffect, useState } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor, useCurrentTheme } from '../../../../hooks/useThemeColor';
import { locationService } from '../../../../services/location.service';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { AppText } from '../../../AppText';

const { height } = Dimensions.get('window');

const CustomSlider = ({ label, value, onChange, min = 0, max = 10 }: any) => {
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
              { borderColor: theme.border, backgroundColor: theme.card },
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

const Selector = ({ label, value, options, onSelect, placeholder, error, loading, icon }: any) => {
  const theme = useThemeColor();
  const currentTheme = useCurrentTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt: any) => String(opt.id) === String(value));

  return (
    <View style={styles.inputGroup}>
      <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>{label}</AppText>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.selectorInput, 
          { borderColor: theme.border, backgroundColor: theme.card },
          error && { borderColor: theme.danger }
        ]}
        onPress={() => setModalVisible(true)}
        disabled={loading || options.length === 0}
      >
        <View style={styles.selectorMain}>
          <Ionicons name={icon || "location-outline"} size={20} color={theme.subtext} style={styles.inputIcon} />
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <AppText weight="medium" style={{ color: selectedOption ? theme.text : theme.subtext }}>
              {selectedOption ? selectedOption.name : placeholder}
            </AppText>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.subtext} />
      </TouchableOpacity>
      {error && <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{error}</AppText>}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <BlurView intensity={20} tint={currentTheme} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalIndicator} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border + '20' }]}>
              <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Select {label}</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={[styles.optionItem, { borderBottomColor: theme.border + '10' }]}
                  onPress={() => {
                    onSelect(item.id);
                    setModalVisible(false);
                  }}
                >
                  <AppText 
                    weight={String(item.id) === String(value) ? 'bold' : 'medium'}
                    style={[
                      { color: theme.text },
                      String(item.id) === String(value) && { color: theme.primary }
                    ]}
                  >
                    {item.name}
                  </AppText>
                  {String(item.id) === String(value) && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <MaterialCommunityIcons name="database-off-outline" size={48} color={theme.subtext} />
                  <AppText weight="semiBold" style={{ color: theme.subtext }}>No options available</AppText>
                </View>
              }
            />
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const StepDetails = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (values.province_id) {
      fetchDistricts(values.province_id);
    } else {
      setDistricts([]);
      setFieldValue('district_id', '');
    }
  }, [values.province_id, setFieldValue]);

  useEffect(() => {
    if (values.district_id) {
      fetchAreas(values.district_id);
    } else {
      setAreas([]);
      setFieldValue('area_id', '');
    }
  }, [values.district_id, setFieldValue]);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const res = await locationService.getProvinces();
      setProvinces(res.data);
    } catch (err) {
      console.error('Failed to fetch provinces', err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceId: string) => {
    setLoadingDistricts(true);
    try {
      const res = await locationService.getDistricts(provinceId);
      setDistricts(res.data);
    } catch (err) {
      console.error('Failed to fetch districts', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchAreas = async (districtId: string) => {
    setLoadingAreas(true);
    try {
      const res = await locationService.getAreas(districtId);
      setAreas(res.data);
    } catch (err) {
      console.error('Failed to fetch areas', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const { isInherited, isAddingChild, normalizedCategory } = React.useMemo(() => {
    const addingChild = !!(values.parent_property_id || values.parentId || values.apartment_id) || 
                          (!values.is_parent && values.property_category && values.property_category !== 'normal');
    
    const rawCategory = (values.property_category || 'normal').toLowerCase();
    const normCat = (rawCategory === 'apartment' || rawCategory === 'tower') ? 'tower' : 
                      (rawCategory === 'market') ? 'market' :
                      (rawCategory === 'sharak') ? 'sharak' : 'normal';

    return {
      isInherited: addingChild,
      isAddingChild: addingChild,
      normalizedCategory: normCat
    };
  }, [values.parent_property_id, values.parentId, values.apartment_id, values.is_parent, values.property_category]);

  const showBedBath = !values.is_parent && !isInherited && (values.property_type === 'house' || values.property_type === 'apartment');
  const showUnitFields = isAddingChild && (values.property_type === 'apartment' || values.property_type === 'shop' || values.property_type === 'office');
  const isParent = !!values.is_parent;

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Property Details</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Tell us more about the property&apos;s size and features.
      </AppText>

      {/* Unit Specific Fields */}
      {showUnitFields && (
        <View style={{ gap: 16, marginBottom: 20 }}>
          <View style={styles.row}>
            {/* Apartment Number (Only for Apartment type) */}
            {values.property_type === 'apartment' && (
              <>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>
                    Apartment Number
                  </AppText>
                  <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                    <Ionicons name="pricetag-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                    <TextInput 
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g. 4B"
                      placeholderTextColor={theme.text + '40'}
                      value={values.unit_number}
                      onChangeText={(text) => setFieldValue('unit_number', text)}
                    />
                  </View>
                  {renderError('unit_number')}
                </View>
                <View style={{ width: 12 }} />
              </>
            )}

            {/* Floor (Apartment, Shop, or Office) */}
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Floor</AppText>
              <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                <MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. 2nd Floor"
                  placeholderTextColor={theme.text + '40'}
                  value={values.floor}
                  onChangeText={(text) => setFieldValue('floor', text)}
                />
              </View>
              {renderError('floor')}
            </View>
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Listing Title</AppText>
        <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="format-title" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={values.title}
            onChangeText={(t) => setFieldValue('title', t)}
            placeholder="e.g. Modern 3-Bedroom Villa with Pool"
            placeholderTextColor={theme.text + '40'}
          />
        </View>
        {renderError('title')}
      </View>

      <View style={styles.inputGroup}>
        <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Property Description</AppText>
        <View style={[styles.textInputContainer, styles.textAreaContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text }]}
            value={values.description}
            onChangeText={(t) => setFieldValue('description', t)}
            placeholder="Describe the key features, amenities, and nearby attractions..."
            placeholderTextColor={theme.text + '40'}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
        {renderError('description')}
      </View>

      {!values.is_parent && !isInherited && (
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Total Area</AppText>
            <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="ruler-square" size={20} color={theme.subtext} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={values.area_size}
                onChangeText={(t) => setFieldValue('area_size', t)}
                placeholder="1200"
                placeholderTextColor={theme.text + '40'}
                keyboardType="numeric"
              />
              <View style={[styles.unitBadge, { backgroundColor: theme.border + '30' }]}>
                <AppText variant="tiny" weight="bold" style={{ color: theme.subtext }}>Sq. Ft.</AppText>
              </View>
            </View>
            {renderError('area_size')}
          </View>
        </View>
      )}

      {showBedBath && (
        <View style={styles.slidersRow}>
          <CustomSlider
            label="Bedrooms"
            value={values.bedrooms}
            onChange={(v: number) => setFieldValue('bedrooms', v)}
          />
          <CustomSlider
            label="Bathrooms"
            value={values.bathrooms}
            onChange={(v: number) => setFieldValue('bathrooms', v)}
          />
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {isAddingChild ? (
        <View style={[styles.inheritedNotice, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText weight="bold" style={{ color: theme.primary }}>Location Inherited</AppText>
            <AppText variant="tiny" style={{ color: theme.subtext }}>This unit inherits location, map, and amenities from its parent {normalizedCategory}.</AppText>
          </View>
        </View>
      ) : (
        <>
          <AppText variant="h2" weight="bold" style={[{ color: theme.text }, { marginTop: 10 }]}>Location Information</AppText>
          <AppText variant="caption" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
            Where is this property located?
          </AppText>

          <Selector
            label="Province / State"
            value={values.province_id}
            options={provinces}
            onSelect={(id: string) => setFieldValue('province_id', id)}
            placeholder="Select Province"
            error={touched.province_id && errors.province_id}
            loading={loadingProvinces}
            icon="map-outline"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Selector
                label="District"
                value={values.district_id}
                options={districts}
                onSelect={(id: string) => setFieldValue('district_id', id)}
                placeholder="District"
                error={touched.district_id && errors.district_id}
                loading={loadingDistricts}
                icon="business-outline"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Selector
                label="Area / Sector"
                value={values.area_id}
                options={areas}
                onSelect={(id: string) => setFieldValue('area_id', id)}
                placeholder="Region"
                error={touched.area_id && errors.area_id}
                loading={loadingAreas}
                icon="navigate-outline"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Exact Address</AppText>
            <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="location-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={values.location}
                onChangeText={(t) => setFieldValue('location', t)}
                placeholder="Street address, building name..."
                placeholderTextColor={theme.text + '40'}
              />
            </View>
            {renderError('location')}
          </View>
        </>
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
    gap: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  tipBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inheritedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 10,
    marginBottom: 20,
  },
  unitText: {
  },
  row: { 
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slidersRow: {
    gap: 10,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  errorText: { 
    marginTop: -4, 
    marginLeft: 4,
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
  sliderValue: { 
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderThumbText: { 
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  selectorMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: { 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end',
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    maxHeight: height * 0.75,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { 
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  optionText: { 
  },
  emptyList: { 
    padding: 60, 
    alignItems: 'center',
    gap: 15,
  },
  emptyText: {
  }
});

export default StepDetails;
