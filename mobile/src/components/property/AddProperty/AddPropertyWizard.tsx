import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Pressable
} from 'react-native';
import { AppText } from '../../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

import StepOwnership from './steps/StepOwnership';
import StepBasicInfo from './steps/StepBasicInfo';
import StepPropertyDetails from './steps/StepPropertyDetails';
import StepListingInfo from './steps/StepListingInfo';
import StepMedia from './steps/StepMedia';
import StepLocation from './steps/StepLocation';
import StepLocationAndAmenities from './steps/StepLocationAndAmenities';
import StepReview from './steps/StepReview';
import { stepSchemas, initialValues } from './validationSchemas';
import { useAddPropertyWizard } from './useAddPropertyWizard';
import { useThemeColor } from '../../../hooks/useThemeColor';
import propertyStore from '../../../stores/PropertyStore';
import { 
  wizardNextIn, 
  wizardNextOut, 
  wizardBackIn, 
  wizardBackOut,
  springConfig
} from '../../../utils/animations';

const ALL_STEPS = [
  { title: 'What are you adding?', component: StepOwnership },
  { title: 'Basic Info', component: StepBasicInfo },
  { title: 'Property Details', component: StepPropertyDetails },
  { title: 'Media', component: StepMedia },
  { title: 'Pricing', component: StepListingInfo, key: 'pricing' },
  { title: 'Property Location', component: StepLocation, key: 'map-location', optional: true },
  { title: 'Location & Amenities', component: StepLocationAndAmenities },
  { title: 'Final Review', component: StepReview },
];

const WizardInner = observer(({ onFinish, isEditing, propertyId, currentStep, setCurrentStep, steps, isStandalone, isAddingChild, isCreatingParent }: any) => {
  const theme = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 100 : 100;
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  
  const {
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
    progress,
    values,
    initialValues: formInitialValues,
  } = useAddPropertyWizard(steps.length, currentStep, setCurrentStep);

  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, springConfig);
  }, [progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  const ActiveComponent = steps[currentStep].component;

  const handleSubmitListing = async () => {
    // ... logic remains unchanged
    try {
      setLoading(true);
      console.log('========== SUBMIT LISTING START ==========');
      console.log('Raw values:', JSON.stringify(values, null, 2));
      
      const isInherited = !!(values.parent_property_id || values.parentId || values.apartment_id);
      
      // Building details object for backend
      const details: any = {};
      if (values.is_parent) {
        details.total_floors = values.total_floors ? Number(values.total_floors) : null;
        details.planned_units = values.planned_units ? Number(values.planned_units) : null;
      } else {
        details.floor = values.floor;
        details.unit_number = values.unit_number;
        if (values.property_type === 'house' || values.property_type === 'apartment') {
          details.bedrooms = values.bedrooms ? Number(values.bedrooms) : null;
          details.bathrooms = values.bathrooms ? Number(values.bathrooms) : null;
        }
      }

      const parentPropertyId = values.parent_property_id || values.parentId || values.apartment_id;
      const isContainer = !!values.is_parent;
      const isChild = !!parentPropertyId;
      
      // Enforce category logic per requirements:
      // 1. Parent containers: category must be tower, market, or sharak
      // 2. Child units: category inherited from parent (tower, market, or sharak)
      // 3. Standalone: category must be 'normal'
      let finalCategory = (values.property_category || '').toLowerCase().trim();
      
      // Normalize 'apartment' to 'tower'
      if (finalCategory === 'apartment') {
        finalCategory = 'tower';
      }
      
      if (isContainer) {
        // Parent containers: must be tower, market, or sharak
        if (!['tower', 'market', 'sharak'].includes(finalCategory)) {
          finalCategory = 'tower'; // Default to tower if invalid
        }
      } else if (isChild) {
        // Child units: inherit category from parent (should already be set correctly)
        // Category should be tower, market, or sharak based on parent
        if (!['tower', 'market', 'sharak'].includes(finalCategory)) {
          finalCategory = 'tower'; // Fallback, though this should not happen if parent data is correct
        }
      } else {
        // Standalone properties: must be 'normal'
        finalCategory = 'normal';
      }

      // Enforce record_kind and is_parent per requirements:
      // - Parent containers: record_kind='container', is_parent=1
      // - Child units: record_kind='listing', is_parent=0
      // - Standalone: record_kind='listing', is_parent=0
      
      // Helper to convert empty strings to null for integer fields
      const sanitizeInt = (val: any) => {
        if (val === '' || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const payload = {
        ...values,
        details,
        record_kind: isContainer ? 'container' : 'listing',
        property_category: finalCategory,
        is_parent: isContainer, // true for containers, false for listings (child or standalone)
        parent_property_id: parentPropertyId || null,
        parent_id: parentPropertyId || null,
        facilities: values.amenities || [],
        amenities: values.amenities || [],
        area_size: isContainer ? null : (values.area_size ? String(values.area_size) : '0'),
        bedrooms: isContainer ? null : sanitizeInt(values.bedrooms),
        bathrooms: isContainer ? null : sanitizeInt(values.bathrooms),
        sale_price: isContainer ? null : (values.for_sale ? sanitizeInt(values.sale_price) : null),
        rent_price: isContainer ? null : (values.for_rent ? sanitizeInt(values.rent_price) : null),
        is_available_for_sale: isContainer ? false : !!values.for_sale,
        is_available_for_rent: isContainer ? false : !!values.for_rent,
        address: values.address || values.location || '',
        location: values.location || values.address || '',
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        province_id: sanitizeInt(values.province_id),
        district_id: sanitizeInt(values.district_id),
        area_id: sanitizeInt(values.area_id),
        agent_id: sanitizeInt(values.agent_id),
        owner_person_id: sanitizeInt(values.owner_person_id),
      };

      let id = propertyId;
      if (isEditing) {
        console.log('========== UPDATING PROPERTY (Wizard) ==========');
        console.log('Property ID:', id);
        console.log('Is Parent?:', payload.is_parent);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        if (payload.is_parent) {
          await propertyStore.updateParent(id, payload);
        } else {
          await propertyStore.updateProperty(id, payload);
        }
        console.log('✓ Update successful');
      } else if (payload.parent_property_id) {
        console.log('========== SUBMITTING CHILD UNIT (Wizard) ==========');
        console.log('Parent ID:', payload.parent_property_id);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        const response = await propertyStore.addChildProperty(payload.parent_property_id, payload);
        console.log('Submission response:', response);
        id = response.property_id || response.id;
        console.log('Extracted ID:', id);
      } else if (payload.is_parent) {
        const response = await propertyStore.createParent(payload);
        id = response.property_id || response.id;
      } else {
        const response = await propertyStore.createProperty(payload);
        id = response.property_id || response.id;
      }

      // Media Upload
      if (values.media && values.media.length > 0) {
        const formData = new FormData();
        values.media.forEach((file: any) => {
          formData.append('files', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
          } as any);
        });
        await propertyStore.uploadPropertyFiles(id, formData);
      }

      // Delete removed media
      if (isEditing && values.deletedMedia && values.deletedMedia.length > 0) {
        await propertyStore.deletePropertyMedia(id, values.deletedMedia);
      }

      Alert.alert('Success', `Property ${isEditing ? 'updated' : 'created'} successfully!`, [
        { text: 'OK', onPress: () => onFinish ? onFinish() : router.back() }
      ]);
    } catch (error: any) {
      console.error('========== SUBMISSION ERROR (Wizard) ==========');
      console.error('Error:', error);
      console.error('Error response data:', error?.response?.data);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.response?.status);
      
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to save property. Please check required fields.';
      Alert.alert('Submission Error', Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleSubmitListing();
    } else {
      setDirection('next');
      await goToNextStep();
    }
  };

  const handleBack = async () => {
    setDirection('back');
    await goToPreviousStep();
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const stepIn = direction === 'next' ? wizardNextIn : wizardBackIn;
  const stepOut = direction === 'next' ? wizardNextOut : wizardBackOut;

  const nextScale = useSharedValue(1);
  const backScale = useSharedValue(1);

  const handleNextPressIn = () => { nextScale.value = withSpring(0.95, springConfig); };
  const handleNextPressOut = () => { nextScale.value = withSpring(1, springConfig); };
  const handleBackPressIn = () => { backScale.value = withSpring(0.95, springConfig); };
  const handleBackPressOut = () => { backScale.value = withSpring(1, springConfig); };

  const nextAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={isFirstStep ? handleClose : handleBack}
            style={[styles.iconButton, { backgroundColor: theme.card }]}
          >
            <Ionicons name={isFirstStep ? "close" : "arrow-back"} size={22} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <AppText variant="caption" weight="semiBold" color={theme.subtext}>
              Step {currentStep + 1} of {steps.length}
            </AppText>
            <Animated.View key={`title-${currentStep}`} entering={FadeIn.duration(400)}>
              <AppText variant="title" weight="bold" color={theme.text}>
                {steps[currentStep].title}
              </AppText>
            </Animated.View>
          </View>

          <View style={[styles.progressCircle, { borderColor: theme.border }]}>
            <AppText variant="caption" weight="bold" color={theme.primary}>
              {Math.round(progress)}%
            </AppText>
          </View>
        </View>
        <View style={[styles.progressBarOuter, { backgroundColor: theme.border + '30' }]}>
          <Animated.View style={[styles.progressBarInner, { backgroundColor: theme.primary }, progressBarStyle]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Animated.View 
          key={`step-${currentStep}`} 
          entering={stepIn}
          exiting={stepOut}
          style={{ flex: 1 }}
        >
          <ActiveComponent 
            onEditStep={(idx: number) => setCurrentStep(idx)} 
            isStandalone={isStandalone}
            isEditing={isEditing}
            isAddingChild={isAddingChild}
            isCreatingParent={isCreatingParent}
          />
        </Animated.View>
      </KeyboardAvoidingView>

      <BlurView intensity={80} tint={theme.dark ? 'dark' : 'light'} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.footerContent}>
          {!isFirstStep && (
            <Animated.View style={[{ flex: 1 }, backAnimatedStyle]}>
              <Pressable 
                onPressIn={handleBackPressIn}
                onPressOut={handleBackPressOut}
                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={handleBack}
              >
                <AppText weight="semiBold" color={theme.text}>Back</AppText>
              </Pressable>
            </Animated.View>
          )}
          
          <Animated.View style={[{ flex: 2 }, !isFirstStep && { marginLeft: 12 }, nextAnimatedStyle]}>
            <Pressable 
              onPressIn={handleNextPressIn}
              onPressOut={handleNextPressOut}
              style={[styles.nextButton, { backgroundColor: theme.primary }]} 
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <AppText weight="bold" color="#fff">
                  {isLastStep ? (isEditing ? 'Update' : 'Complete') : 'Continue'}
                </AppText>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </BlurView>
    </View>
  );
});

const AddPropertyWizard = observer(({ initial, isEditing, propertyId, onFinish, isStandalone, isAddingChild, isCreatingParent }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const values = initial || initialValues;
  
  // Filter steps based on context (e.g. skip pricing for containers)
  const steps = ALL_STEPS.filter(step => {
    if (values.is_parent && step.key === 'pricing') return false;
    return true;
  });

  const activeSchema = stepSchemas[ALL_STEPS.indexOf(steps[currentStep])];
  
  return (
    <Formik
      initialValues={values}
      validationSchema={activeSchema}
      enableReinitialize={true}
      onSubmit={() => {}}
    >
      <WizardInner 
        isEditing={isEditing} 
        propertyId={propertyId} 
        onFinish={onFinish} 
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={steps}
        isStandalone={isStandalone}
        isAddingChild={isAddingChild}
        isCreatingParent={isCreatingParent}
      />
    </Formik>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { zIndex: 10 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTextContainer: { flex: 1, marginLeft: 15 },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarOuter: { height: 4, width: '100%' },
  progressBarInner: { height: '100%' },
  content: { flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  footerContent: { flexDirection: 'row', gap: 12 },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  nextButton: {
    flex: 3,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddPropertyWizard;
