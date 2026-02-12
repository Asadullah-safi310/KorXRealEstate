import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';

import authStore from '../../../stores/AuthStore';
import propertyStore from '../../../stores/PropertyStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import AddPropertyWizard from '../../../components/property/AddProperty/AddPropertyWizard';
import { initialValues as baseInitialValues } from '../../../components/property/AddProperty/validationSchemas';

const PropertyCreateScreen = observer(() => {
  const router = useRouter();
  const { id, parentId, category, parentName: parentNameParam } = useLocalSearchParams();
  const isEditing = Boolean(id);
  const isAddingChild = Boolean(parentId);
  const isCreatingParent = Boolean(category) && !isEditing && !isAddingChild;
  const isStandalone = !isEditing && !isAddingChild && !isCreatingParent;

  const theme = useThemeColor();
  const background = theme.background;
  const primary = theme.primary;

  const isLoading = authStore.isLoading;
  const isAuthenticated = authStore.isAuthenticated;

  const [initialLoading, setInitialLoading] = useState(isEditing || isAddingChild || isCreatingParent);
  const [formInitialValues, setFormInitialValues] = useState<any>(null);

  const fetchPropertyData = useCallback(async () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (isEditing) {
      try {
        setInitialLoading(true);
        
        // Try to fetch as parent first, then as regular property if that fails
        let property = null;
        try {
          property = await propertyStore.fetchParentById(id as string);
        } catch (parentError) {
          // If parent fetch fails, try as regular property
          try {
            property = await propertyStore.fetchPropertyById(id as string);
          } catch (propertyError) {
            throw new Error('Property not found');
          }
        }
        
        if (property) {
          const isParentContainer = !!property.is_parent || property.record_kind === 'container';
          
          // Parse amenities/facilities - backend sends as 'facilities'
          let parsedAmenities = [];
          const rawAmenities = property.facilities || property.amenities;
          if (Array.isArray(rawAmenities)) {
            parsedAmenities = rawAmenities;
          } else if (typeof rawAmenities === 'string') {
            try {
              parsedAmenities = JSON.parse(rawAmenities);
            } catch (e) {
              parsedAmenities = [];
            }
          }

          if (isParentContainer) {
            // Parent container editing
            let normalizedCategory = (property.property_category || '').toLowerCase().trim();
            if (normalizedCategory === 'apartment') {
              normalizedCategory = 'tower';
            }
            
            setFormInitialValues({
              ...baseInitialValues,
              title: property.title || '',
              description: property.description || '',
              property_category: normalizedCategory,
              is_parent: true,
              record_kind: 'container',
              property_type: normalizedCategory,
              province_id: property.province_id ? Number(property.province_id) : '',
              district_id: property.district_id ? Number(property.district_id) : '',
              area_id: property.area_id ? Number(property.area_id) : '',
              location: property.location || property.address || '',
              address: property.address || property.location || '',
              latitude: property.latitude ? Number(property.latitude) : null,
              longitude: property.longitude ? Number(property.longitude) : null,
              media: [],
              existingMedia: (property.photos || []).map((p: string) => ({ url: p, type: 'photo' })),
              deletedMedia: [],
              amenities: parsedAmenities,
              agent_id: String(property.agent_id || ''),
              owner_person_id: property.owner_person_id || '',
              total_floors: property.total_floors || property.details?.total_floors || '',
              planned_units: property.total_units || property.details?.planned_units || '',
              purpose: null,
              sale_price: '',
              rent_price: '',
              for_sale: false,
              for_rent: false,
              is_available_for_sale: false,
              is_available_for_rent: false,
            });
          } else {
            // Regular property/listing editing
            const isSale = !!property.is_available_for_sale || !!property.forSale;
            const isRent = !!property.is_available_for_rent || !!property.forRent;

            setFormInitialValues({
              agent_id: String(property.agent_id || ''),
              property_type: property.property_type || 'house',
              purpose: property.purpose || 'sale',
              title: property.title || '',
              description: property.description || '',
              area_size: property.area_size?.toString() || '',
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              province_id: property.province_id ? Number(property.province_id) : (property.provinceId ? Number(property.provinceId) : ''),
              district_id: property.district_id ? Number(property.district_id) : (property.districtId ? Number(property.districtId) : ''),
              area_id: property.area_id ? Number(property.area_id) : (property.areaId ? Number(property.areaId) : ''),
              location: property.location || property.address || '',
              address: property.address || property.location || '',
              latitude: property.latitude ? Number(property.latitude) : null,
              longitude: property.longitude ? Number(property.longitude) : null,
              is_available_for_sale: isSale,
              is_available_for_rent: isRent,
              for_sale: isSale,
              for_rent: isRent,
              sale_price: (property.sale_price || property.price || '').toString(),
              sale_currency: property.sale_currency || 'USD',
              rent_price: (property.rent_price || '').toString(),
              rent_currency: property.rent_currency || 'USD',
              media: [],
              existingMedia: (property.photos || []).map((p: string) => ({ url: p, type: 'photo' })),
              deletedMedia: [],
              amenities: parsedAmenities,
              is_parent: !!property.is_parent,
              property_category: property.property_category || 'normal',
              parent_property_id: property.parent_property_id,
              apartment_id: property.apartment_id,
              unit_number: property.unit_number || '',
              floor: property.floor || '',
              unit_type: property.unit_type || '',
            });
          }
        }
      } catch (err) {
        console.error('Error loading property:', err);
        Alert.alert('Error', 'Failed to load property data');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    } else if (isAddingChild) {
      try {
        setInitialLoading(true);
        // Use fetchParentById for containers instead of fetchPropertyById (which only works for listings)
        const parent = await propertyStore.fetchParentById(parentId as string);
        if (parent) {
          // Child Units Logic: Inherit category from parent container
          // According to requirements: record_kind='listing', is_parent=0, category from parent
          
          // Get category from route param first (most reliable), then from parent data
          let activeCategory = (category as string || parent.property_category || '').toLowerCase().trim();
          
          // Normalize 'apartment' to 'tower'
          if (activeCategory === 'apartment') {
            activeCategory = 'tower';
          }
          
          // Ensure category is valid for child units (must be tower, market, or sharak)
          // If parent has 'normal' category (shouldn't happen for containers), try to infer
          if (!['tower', 'market', 'sharak'].includes(activeCategory)) {
            // Try to infer from parent property_type or property_category
            const parentCat = (parent.property_category || '').toLowerCase().trim();
            const parentType = (parent.property_type || '').toLowerCase().trim();
            
            if (parentCat === 'market' || parentType === 'market') activeCategory = 'market';
            else if (parentCat === 'sharak' || parentType === 'sharak') activeCategory = 'sharak';
            else if (parentCat === 'tower' || parentCat === 'apartment' || parentType === 'tower' || parentType === 'apartment') activeCategory = 'tower';
            else activeCategory = 'tower'; // Final fallback
          }
          
          // Determine child type based on category
          let defaultType = 'apartment';
          if (activeCategory === 'market') defaultType = 'shop';
          else if (activeCategory === 'sharak') defaultType = 'house';

          setFormInitialValues({
            ...baseInitialValues,
            agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
            property_type: defaultType,
            purpose: parent.purpose || 'sale',
            // Inherit location from parent
            province_id: parent.province_id ? Number(parent.province_id) : '',
            district_id: parent.district_id ? Number(parent.district_id) : '',
            area_id: parent.area_id ? Number(parent.area_id) : '',
            location: parent.location || parent.address || '',
            latitude: parent.latitude ? Number(parent.latitude) : null,
            longitude: parent.longitude ? Number(parent.longitude) : null,
            // Child units: is_parent=0, record_kind='listing', category inherited
            is_parent: false,
            record_kind: 'listing',
            parent_property_id: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            parentId: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            apartment_id: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            property_category: activeCategory, // Inherited from parent (tower, market, or sharak)
            parentName: parentNameParam || parent.title || '',
            media: [],
            existingMedia: [],
            title: '',
            description: '',
            area_size: '',
            bedrooms: 0,
            bathrooms: 0,
            amenities: [], // Child units start with empty amenities (building amenities inherited, unit-specific added separately)
            is_available_for_sale: true,
            is_available_for_rent: false,
            for_sale: true,
            for_rent: false,
            sale_currency: 'USD',
            rent_currency: 'USD',
          });
        }
      } catch {
        Alert.alert('Error', 'Failed to load parent property data');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    } else if (isCreatingParent) {
      // Parent Container Logic: record_kind='container', is_parent=1, category=(tower|market|sharak)
      // Normalize category: 'apartment' -> 'tower'
      let activeCategory = (category as string || 'tower').toLowerCase().trim();
      if (activeCategory === 'apartment') {
        activeCategory = 'tower';
      }
      // Enforce valid parent categories: must be tower, market, or sharak
      if (!['tower', 'market', 'sharak'].includes(activeCategory)) {
        activeCategory = 'tower'; // Default to tower if invalid
      }
      
      setFormInitialValues({
        ...baseInitialValues,
        agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
        property_category: activeCategory, // Must be tower, market, or sharak
        is_parent: true, // Parent containers have is_parent=1
        record_kind: 'container', // Parent containers are containers, not listings
        property_type: activeCategory, 
        purpose: 'sale',
        media: [],
        existingMedia: [],
        title: '',
        description: '',
        area_size: '',
        bedrooms: 0,
        bathrooms: 0,
        is_available_for_sale: true,
        is_available_for_rent: false,
        for_sale: true,
        for_rent: false,
        sale_currency: 'USD',
        rent_currency: 'USD',
      });
      setInitialLoading(false);
    } else {
      // Standalone Property Logic: category='normal', record_kind='listing', is_parent=0, parent_property_id=NULL
      setFormInitialValues({
        ...baseInitialValues,
        property_category: 'normal', // Standalone properties are always 'normal'
        is_parent: false, // Standalone properties are not parents (is_parent=0)
        record_kind: 'listing', // Standalone properties are listings
        agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
        media: [],
        existingMedia: [],
        title: '',
        description: '',
        area_size: '',
        bedrooms: 0,
        bathrooms: 0,
        is_available_for_sale: true,
        is_available_for_rent: false,
        for_sale: true,
        for_rent: false,
        sale_currency: 'USD',
        rent_currency: 'USD',
        amenities: [],
      });
      setInitialLoading(false);
    }
  }, [id, parentId, category, isEditing, isAddingChild, isCreatingParent, router, isLoading, isAuthenticated]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  const handleFinish = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  if (initialLoading || authStore.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <AddPropertyWizard 
      initial={formInitialValues} 
      isEditing={isEditing} 
      propertyId={id}
      isStandalone={isStandalone}
      isAddingChild={isAddingChild}
      isCreatingParent={isCreatingParent}
      onFinish={handleFinish} 
    />
  );
});

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PropertyCreateScreen;
