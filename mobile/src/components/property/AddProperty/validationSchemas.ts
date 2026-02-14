import * as Yup from 'yup';
import { propertyBaseSchema } from '../../../validation/schemas';

// Property Category Types
// Per requirements:
// - Parent containers: tower, market, sharak
// - Child units: inherit category from parent (tower, market, sharak)
// - Standalone properties: normal
export const PROPERTY_CATEGORY_TYPES = {
  tower: ["apartment", "shop", "office"], // Parent container category
  market: ["shop", "office"], // Parent container category
  sharak: ["apartment", "shop", "office", "land", "plot", "house"], // Parent container category
  normal: ["house", "apartment", "shop", "office", "land", "plot"] // Standalone property category
};

export const PROPERTY_TYPES_CONFIG = [
  { label: 'House', value: 'house', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { label: 'Apartment', value: 'apartment', icon: 'office-building-marker-outline', activeIcon: 'office-building-marker' },
  { label: 'Shop', value: 'shop', icon: 'storefront-outline', activeIcon: 'storefront' },
  { label: 'Office', value: 'office', icon: 'briefcase-variant-outline', activeIcon: 'briefcase-variant' },
  { label: 'Land/Plot', value: 'land', icon: 'map-outline', activeIcon: 'map' },
];

export const initialValues = {
  // Step 1: Ownership & Type
  owner_person_id: '',
  owner_name: '',
  agent_id: null,
  property_category: 'normal', // Default to standalone property
  record_kind: 'listing', // Default to listing (standalone or child unit)
  property_type: '',
  purpose: 'sale',
  is_parent: false, // Default to NOT a parent container
  parent_property_id: null, // Default to no parent (standalone)
  parentId: null,
  apartment_id: null,
  parentName: '',
  total_floors: '', // Only for parent containers
  planned_units: '', // Only for parent containers

  // Step 2: Basic Info
  title: '',
  description: '',

  // Step 3: Property Details
  unit_number: '',
  floor: '',
  area_size: '',
  area_unit: 'sqft',
  bedrooms: 0,
  bathrooms: 0,

  // Step 4: Media
  media: [], 
  existingMedia: [],
  deletedMedia: [],

  // Step 5: Pricing
  for_sale: true,
  for_rent: false,
  sale_price: '',
  sale_currency: 'AF',
  rent_price: '',
  rent_currency: 'AF',

  // Step 6: Location & Amenities
  province_id: '',
  district_id: '',
  area_id: '',
  location: '',
  address: '',
  latitude: null,
  longitude: null,
  amenities: [],
};

export const StepOwnershipSchema = Yup.object().shape({
  // Per requirements: valid categories are tower, market, sharak, normal
  // 'apartment' should be normalized to 'tower' before validation
  property_category: Yup.string()
    .oneOf(['tower', 'sharak', 'normal', 'market'], 'Invalid category')
    .required('Category is required'),
  property_type: Yup.string().required('Type is required'),
  record_kind: Yup.string().oneOf(['container', 'listing'], 'Invalid record kind'),
  is_parent: Yup.boolean(),
});

export const StepBasicInfoSchema = Yup.object().shape({
  title: Yup.string().nullable(),
  description: Yup.string().nullable(),
  owner_person_id: Yup.string().nullable(),
  owner_name: Yup.string().nullable(),
  agent_id: Yup.string().nullable(),
});

export const StepPropertyDetailsSchema = Yup.object().shape({
  area_size: Yup.number().nullable().when('is_parent', {
    is: false,
    then: (s) => s.required('Area size is required').positive(),
  }),
  bedrooms: Yup.number().nullable(),
  bathrooms: Yup.number().nullable(),
  floor: Yup.string().nullable(),
  unit_number: Yup.string().nullable(),
  total_floors: Yup.number().nullable().when('is_parent', {
    is: true,
    then: (s) => s.required('Total floors is required').min(1),
  }),
  planned_units: Yup.number().nullable().when('is_parent', {
    is: true,
    then: (s) => s.required('Planned units is required').min(1),
  }),
});

export const StepMediaSchema = Yup.object().shape({
  media: Yup.array(),
}).test('at-least-one-image', 'At least one image is required', function(value) {
    const { media, existingMedia } = this.parent || {};
    return (media?.length || 0) + (existingMedia?.length || 0) > 0;
});

export const StepPricingSchema = Yup.object().shape({
  for_sale: Yup.boolean(),
  for_rent: Yup.boolean(),
  sale_price: Yup.number().when('for_sale', {
    is: true,
    then: (s) => s.required('Sale price is required').positive(),
  }),
  rent_price: Yup.number().when('for_rent', {
    is: true,
    then: (s) => s.required('Rent price is required').positive(),
  }),
}).test('at-least-one-purpose', 'Select sale or rent', function(value) {
    return value.for_sale || value.for_rent;
});

export const StepMapLocationSchema = Yup.object().shape({
  latitude: Yup.number().nullable(),
  longitude: Yup.number().nullable(),
});

export const StepLocationAmenitiesSchema = Yup.object().shape({
  province_id: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (p1: any, p2: any, p3: any) => !p1 && !p2 && !p3,
    then: (s) => s.required('Province is required'),
  }),
  district_id: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (p1: any, p2: any, p3: any) => !p1 && !p2 && !p3,
    then: (s) => s.required('District is required'),
  }),
  address: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (p1: any, p2: any, p3: any) => !p1 && !p2 && !p3,
    then: (s) => s.required('Address is required'),
  }),
  amenities: Yup.array().nullable(),
});

export const StepReviewSchema = Yup.object().shape({});

export const stepSchemas = [
  StepOwnershipSchema,
  StepBasicInfoSchema,
  StepPropertyDetailsSchema,
  StepMediaSchema,
  StepPricingSchema,
  StepMapLocationSchema,
  StepLocationAmenitiesSchema,
  StepReviewSchema,
];
