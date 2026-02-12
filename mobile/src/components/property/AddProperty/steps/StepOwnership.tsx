import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { AppText } from '../../../AppText';
import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { PROPERTY_CATEGORY_TYPES, PROPERTY_TYPES_CONFIG } from '../validationSchemas';
import { propertyService } from '../../../../services/property.service';

const { width } = Dimensions.get('window');

const StepOwnership = observer(({ isStandalone, isEditing, isAddingChild: isAddingChildProp, isCreatingParent: isCreatingParentProp }: any) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [loadingParent, setLoadingParent] = useState(false);

  const isAddingChild = useMemo(() => {
    return isAddingChildProp || 
           !!values.parent_property_id || 
           !!values.parentId || 
           !!values.apartment_id;
  }, [isAddingChildProp, values.parent_property_id, values.parentId, values.apartment_id]);

  const isCreatingParent = useMemo(() => {
    return isCreatingParentProp || !!values.is_parent;
  }, [isCreatingParentProp, values.is_parent]);

  useEffect(() => {
    const parentId = values.parent_property_id || values.parentId || values.apartment_id;
    if (parentId && !values.parentName) {
      setLoadingParent(true);
      propertyService.getPropertyById(parentId)
        .then(res => setFieldValue('parentName', res.title))
        .catch(() => setFieldValue('parentName', 'Parent Property'))
        .finally(() => setLoadingParent(false));
    }
  }, [values.parent_property_id, values.parentId, values.apartment_id, values.parentName]);

  useEffect(() => {
    // Enforce category, record_kind, and is_parent based on context per requirements
    if (isStandalone && !isEditing && !isAddingChild) {
      // Standalone properties: category='normal', record_kind='listing', is_parent=0, parent_property_id=NULL
      setFieldValue('property_category', 'normal');
      setFieldValue('record_kind', 'listing');
      setFieldValue('is_parent', false);
      setFieldValue('parent_property_id', null);
      setFieldValue('parentId', null);
      setFieldValue('apartment_id', null);
    } else if (isAddingChild && !isEditing) {
      // Child units: record_kind='listing', is_parent=0
      // Category is inherited from parent and should NOT be changed by user
      setFieldValue('record_kind', 'listing');
      setFieldValue('is_parent', false);
      
      // Normalize category if it's 'apartment', but preserve tower, market, sharak
      const currentCategory = (values.property_category || '').toLowerCase().trim();
      if (currentCategory === 'apartment') {
        setFieldValue('property_category', 'tower');
      }
      // Ensure the category is valid (should already be set from parent in create.tsx)
      // If empty or invalid, preserve the current value - create.tsx handles the inheritance
      // Don't override here as it would reset the correct inherited category
    } else if (isCreatingParent && !isEditing) {
      // Parent containers: record_kind='container', is_parent=1, category must be tower/market/sharak
      setFieldValue('record_kind', 'container');
      setFieldValue('is_parent', true);
      setFieldValue('parent_property_id', null);
      setFieldValue('parentId', null);
      setFieldValue('apartment_id', null);
      
      // Normalize category if it's 'apartment'
      const currentCategory = (values.property_category || '').toLowerCase().trim();
      if (currentCategory === 'apartment') {
        setFieldValue('property_category', 'tower');
      }
      // Ensure valid parent category
      if (!['tower', 'market', 'sharak'].includes(currentCategory) || currentCategory === 'apartment') {
        if (!['tower', 'market', 'sharak'].includes(currentCategory)) {
          setFieldValue('property_category', 'tower');
        }
      }
    }
  }, [isStandalone, isEditing, isAddingChild, isCreatingParent]);

  const { normalizedCategory, propertyTypes } = useMemo(() => {
    let rawCat = (values.property_category || '').toLowerCase().trim();
    
    // Normalize 'apartment' to 'tower' (per requirements)
    if (rawCat === 'apartment') {
      rawCat = 'tower';
    }
    
    // Valid parent categories that can have child units
    const validParentCategories = ['tower', 'market', 'sharak'];
    
    if (isAddingChild) {
      // For child units, category is inherited from parent container
      // Only override if explicitly wrong (like 'normal'), but preserve empty (still loading from parent)
      if (rawCat === 'normal') {
        // 'normal' is not valid for child units, should be tower/market/sharak
        rawCat = 'tower'; // Default fallback
      } else if (rawCat !== '' && !validParentCategories.includes(rawCat)) {
        // Invalid category (but not empty - empty means still loading)
        rawCat = 'tower'; // Default fallback
      }
      // If rawCat is empty, preserve it - the initial values will set it correctly
    } else if (isCreatingParent) {
      // For parent containers, category must be tower, market, or sharak
      if (!validParentCategories.includes(rawCat)) {
        rawCat = 'tower'; // Default fallback
      }
    } else if (rawCat === '' || !['tower', 'market', 'sharak', 'normal'].includes(rawCat)) {
      // For standalone properties, default to 'normal'
      rawCat = 'normal';
    }
    
    // Final normalization (should already be normalized above, but just in case)
    const normCat = (rawCat === 'tower') ? 'tower' : 
                    (rawCat === 'market') ? 'market' :
                    (rawCat === 'sharak') ? 'sharak' :
                    (rawCat === '' && isAddingChild) ? '' : 'normal'; // Preserve empty for child units still loading

    const categoryKey = normCat as keyof typeof PROPERTY_CATEGORY_TYPES;
    const allowedTypesList = PROPERTY_CATEGORY_TYPES[categoryKey] || [];

    const lowerAllowed = allowedTypesList.map(t => t.toLowerCase());
    const filteredTypes = PROPERTY_TYPES_CONFIG.filter(type => 
      lowerAllowed.includes(type.value.toLowerCase())
    );

    return { 
      normalizedCategory: normCat, 
      propertyTypes: filteredTypes
    };
  }, [values.property_category, values.is_parent, isAddingChild, isCreatingParent]);

  useEffect(() => {
    // Ensure property_type is set if it's empty but required
    if (!values.property_type) {
      if (values.is_parent && normalizedCategory !== 'normal') {
        setFieldValue('property_type', normalizedCategory);
      } else if (propertyTypes.length === 1) {
        setFieldValue('property_type', propertyTypes[0].value);
      }
    }
  }, [values.property_type, values.is_parent, normalizedCategory, propertyTypes]);

  const handleCategoryChange = (category: string) => {
    // Normalize category: 'apartment' -> 'tower'
    let normalizedCat = category.toLowerCase().trim();
    if (normalizedCat === 'apartment') {
      normalizedCat = 'tower';
    }
    
    setFieldValue('property_category', normalizedCat);
    
    if (normalizedCat !== 'normal') {
      // Parent container selected: record_kind='container', is_parent=1
      setFieldValue('is_parent', true);
      setFieldValue('record_kind', 'container');
      setFieldValue('property_type', normalizedCat);
      setFieldValue('parent_property_id', null);
      setFieldValue('parentId', null);
      setFieldValue('apartment_id', null);
    } else {
      // Standalone property selected: record_kind='listing', is_parent=0
      setFieldValue('is_parent', false);
      setFieldValue('record_kind', 'listing');
      setFieldValue('parent_property_id', null);
      setFieldValue('parentId', null);
      setFieldValue('apartment_id', null);
      const newAllowedTypes = PROPERTY_CATEGORY_TYPES[normalizedCat as keyof typeof PROPERTY_CATEGORY_TYPES] || [];
      if (!newAllowedTypes.includes(values.property_type)) {
        setFieldValue('property_type', newAllowedTypes[0] || '');
      }
    }
  };

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  // Hide category selection when:
  // 1. Adding a child unit (inherits from parent)
  // 2. Creating a parent from My Towers/Markets/Sharaks (category locked from route)
  // 3. Adding standalone property (always 'normal' category, user doesn't need to see/change this)
  // Per requirements: User must NOT manually change category in these flows
  const showCategorySelection = !isEditing && !isAddingChild && !isCreatingParent && !isStandalone;

  // Title Logic
  const mainTitle = isEditing
    ? values.is_parent 
      ? `Update ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}`
      : 'Update Property'
    : isAddingChild 
      ? `Add Property to ${values.parentName || 'Parent'}`
      : isCreatingParent
        ? `Create New ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}`
        : values.is_parent 
          ? `Add New ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}`
          : 'Add Standalone Property';

  const subTitle = isEditing
    ? 'Update property information'
    : isAddingChild && values.parentName 
      ? `Adding a new unit inside ${values.parentName}` 
      : isCreatingParent
        ? `Creating a ${normalizedCategory} container to hold multiple units`
        : 'Let\'s start with the basics';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1" weight="bold" style={{ color: theme.text }}>{mainTitle}</AppText>
        <AppText variant="small" style={{ color: theme.subtext, marginTop: 4 }}>{subTitle}</AppText>
      </View>

      {/* Context Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: theme.primary + '15' }]}>
          <MaterialCommunityIcons name="tag-outline" size={14} color={theme.primary} />
          <AppText variant="tiny" weight="bold" style={{ color: theme.primary, marginLeft: 6, textTransform: 'capitalize' }}>
            {isCreatingParent ? 'Container Type: ' : 'Category: '}{normalizedCategory}
          </AppText>
        </View>
        {isAddingChild && (
          <View style={[styles.chip, { backgroundColor: theme.secondary + '15' }]}>
            <MaterialCommunityIcons name="office-building-outline" size={14} color={theme.secondary} />
            <AppText variant="tiny" weight="bold" style={{ color: theme.secondary, marginLeft: 6 }}>
              Inside: {values.parentName || '...'}
            </AppText>
          </View>
        )}
        {isCreatingParent && (
          <View style={[styles.chip, { backgroundColor: theme.success + '15' }]}>
            <MaterialCommunityIcons name="lock-outline" size={14} color={theme.success} />
            <AppText variant="tiny" weight="bold" style={{ color: theme.success, marginLeft: 6 }}>
              Locked
            </AppText>
          </View>
        )}
      </View>

      {/* Category Selection (Only if adding a new parent or listing from scratch) */}
      {showCategorySelection && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text, marginBottom: 12 }}>I am adding a...</AppText>
          <View style={styles.categoryGrid}>
            {['normal', 'tower', 'market', 'sharak'].map((cat) => {
              const isActive = normalizedCategory === cat;
              const config = {
                normal: { label: 'Single Property', icon: 'home-outline', desc: 'House, Land, Shop' },
                tower: { label: 'Tower/Building', icon: 'office-building-outline', desc: 'Apartment Complex' },
                market: { label: 'Market', icon: 'store-outline', desc: 'Shopping Center' },
                sharak: { label: 'Community', icon: 'home-group', desc: 'Residential Area' },
              }[cat as 'normal' | 'tower' | 'market' | 'sharak'];

              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: 'transparent', borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' }
                  ]}
                  onPress={() => handleCategoryChange(cat)}
                >
                  <View style={[styles.iconCircle, isActive && { backgroundColor: theme.primary + '15' }]}>
                    <MaterialCommunityIcons name={config.icon as any} size={24} color={isActive ? theme.primary : theme.subtext} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText weight="bold" style={{ color: theme.text }}>{config.label}</AppText>
                    <AppText variant="tiny" style={{ color: theme.subtext }}>{config.desc}</AppText>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Property Type Grid (If not a parent or if it's a normal listing) */}
      {(!values.is_parent || normalizedCategory === 'normal') && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text, marginBottom: 4 }}>What kind of property?</AppText>
          <AppText variant="small" style={{ color: theme.subtext, marginBottom: 20 }}>Select the specific type</AppText>
          
          <View style={styles.typeGrid}>
            {propertyTypes.map((type) => {
              const isActive = values.property_type === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  activeOpacity={0.7}
                  style={[
                    styles.typeCard,
                    { backgroundColor: 'transparent', borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => setFieldValue('property_type', type.value)}
                >
                  <MaterialCommunityIcons
                    name={(isActive ? type.activeIcon : type.icon) as any}
                    size={28}
                    color={isActive ? theme.primary : theme.subtext}
                  />
                  <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext, marginTop: 8, textAlign: 'center' }}>
                    {type.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('property_type')}
        </View>
      )}

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  section: {
    marginBottom: 30,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 52) / 3,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  errorText: { 
    marginTop: 8, 
    color: '#ff4444',
  },
});

export default StepOwnership;
