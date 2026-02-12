import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { stepSchemas } from './validationSchemas';

export const useAddPropertyWizard = (
  totalSteps: number, 
  currentStep: number, 
  setCurrentStep: (step: number) => void
) => {
  const { validateForm, setTouched, values, initialValues } = useFormikContext<any>();

  const goToNextStep = async () => {
    // Validate current step using Formik's validateForm
    // It will use the validationSchema currently passed to Formik
    const errors = await validateForm();
    
    if (Object.keys(errors).length === 0) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        return true;
      }
    } else {
      console.log('Validation errors on step', currentStep, ':', JSON.stringify(errors, null, 2));
      // Mark all fields as touched to show errors
      const touchedFields: any = {};
      Object.keys(errors).forEach(key => {
        touchedFields[key] = true;
      });
      setTouched(touchedFields);
    }
    return false;
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
    progress,
    values,
    initialValues,
  };
};
