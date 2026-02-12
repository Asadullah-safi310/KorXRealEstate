import * as Yup from 'yup';

export const authSchema = Yup.object().shape({
  phone: Yup.string().required('Phone is required'),
  password: Yup.string().required('Password is required'),
});

export const personSchema = Yup.object().shape({
  full_name: Yup.string().required('Full name is required'),
  phone: Yup.string().required('Phone is required'),
  national_id: Yup.string().required('National ID is required'),
  email: Yup.string().email('Invalid email'),
  address: Yup.string(),
});

export const clientSchema = Yup.object().shape({
  client_name: Yup.string().required('Client name is required'),
  phone: Yup.string().required('Phone is required'),
  requirement_type: Yup.string().required('Requirement type is required'),
  property_type: Yup.string().required('Property type is required'),
});

export const dealSchema = Yup.object().shape({
  property_id: Yup.string().required('Property is required'),
  client_id: Yup.string().required('Client is required'),
  final_price: Yup.number().required('Final price is required').positive('Must be positive'),
  deal_type: Yup.string().required('Deal type is required'),
});

export const propertyBaseSchema = {
  property_type: Yup.string().required('Property type is required'),
  purpose: Yup.string().required('Purpose is required'),
  area_size: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .typeError('Must be a number').required('Area size is required').positive(),
  bedrooms: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when('property_type', {
      is: (val: string) => val && !['plot', 'land'].includes(val.toLowerCase()),
      then: (schema) => schema.required('Bedrooms required').min(0),
      otherwise: (schema) => schema.nullable(),
    }),
  bathrooms: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when('property_type', {
      is: (val: string) => val && !['plot', 'land'].includes(val.toLowerCase()),
      then: (schema) => schema.required('Bathrooms required').min(0),
      otherwise: (schema) => schema.nullable(),
    }),
  is_available_for_sale: Yup.boolean(),
  is_available_for_rent: Yup.boolean(),
  sale_price: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when('is_available_for_sale', {
      is: true,
      then: (schema) => schema.required('Sale price is required').positive(),
      otherwise: (schema) => schema.nullable(),
    }),
  rent_price: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when('is_available_for_rent', {
      is: true,
      then: (schema) => schema.required('Rent price is required').positive(),
      otherwise: (schema) => schema.nullable(),
    }),
};

export const propertySchema = Yup.object().shape({
  ...propertyBaseSchema,
  person_id: Yup.string().required('Owner is required'),
  agent_id: Yup.string().required('Agent is required'),
  location: Yup.string().required('Location is required'),
  city: Yup.string().required('City is required'),
}).test('at-least-one-purpose', 'Must be available for either sale or rent', function(value) {
  return value.is_available_for_sale || value.is_available_for_rent;
});
