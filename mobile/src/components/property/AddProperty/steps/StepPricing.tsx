import React from 'react';
import { View, TextInput, Switch, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';

const StepPricing = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  const OptionCard = ({ type, label, isActive, onToggle, priceValue, priceField, currencyValue, currencyField, placeholder }: any) => {
    const currencies = [
      { label: 'AF', value: 'AF' },
      { label: '$', value: 'USD' },
    ];

    return (
      <View style={[
        styles.optionCard, 
        { backgroundColor: theme.card, borderColor: isActive ? theme.primary : theme.border },
        isActive && { backgroundColor: theme.primary + '05' }
      ]}>
        <View style={styles.optionHeader}>
          <View style={styles.optionInfo}>
            <View style={[styles.typeIcon, { backgroundColor: isActive ? theme.primary + '15' : theme.border + '30' }]}>
              <MaterialCommunityIcons 
                name={type === 'sale' ? 'tag-outline' : 'calendar-clock-outline'} 
                size={24} 
                color={isActive ? theme.primary : theme.subtext} 
              />
            </View>
            <View>
              <AppText weight="bold" style={[{ color: theme.text }, styles.optionLabel]}>{label}</AppText>
              <AppText variant="tiny" weight="medium" style={[{ color: theme.subtext }, styles.optionSub]}>
                {isActive ? 'Currently active' : 'Tap to enable'}
              </AppText>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={onToggle}
            trackColor={{ true: theme.primary, false: theme.border }}
            thumbColor={Platform.OS === 'ios' ? undefined : (isActive ? theme.white : '#f4f3f4')}
          />
        </View>

        {isActive && (
          <View style={[styles.priceContainer, { borderTopColor: theme.border }]}>
            <AppText variant="caption" weight="semiBold" style={[{ color: theme.text }, styles.priceLabel]}>
              {type === 'sale' ? 'Expected Sale Price' : 'Monthly Rent'}
            </AppText>
            <View style={styles.inputRow}>
              <View style={[styles.priceInputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={priceValue ? String(priceValue) : ''}
                  onChangeText={(t) => setFieldValue(priceField, t)}
                  keyboardType="numeric"
                  placeholder={placeholder}
                  placeholderTextColor={theme.text + '40'}
                />
              </View>
              <View style={[styles.currencySelector, { backgroundColor: theme.background, borderColor: theme.border }]}>
                {currencies.map((curr) => (
                  <TouchableOpacity
                    key={curr.value}
                    style={[
                      styles.currencyOption,
                      currencyValue === curr.value && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setFieldValue(currencyField, curr.value)}
                  >
                    <AppText 
                      variant="tiny" 
                      weight="bold" 
                      style={{ color: currencyValue === curr.value ? theme.white : theme.subtext }}
                    >
                      {curr.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {renderError(priceField)}
            {renderError(currencyField)}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Pricing Strategy</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        How would you like to list your property? You can select one or both.
      </AppText>

      <OptionCard
        type="sale"
        label="Available for Sale"
        isActive={values.is_available_for_sale}
        onToggle={(v: boolean) => setFieldValue('is_available_for_sale', v)}
        priceValue={values.sale_price}
        priceField="sale_price"
        currencyValue={values.sale_currency}
        currencyField="sale_currency"
        placeholder="e.g. 15,000,000"
      />

      <OptionCard
        type="rent"
        label="Available for Rent"
        isActive={values.is_available_for_rent}
        onToggle={(v: boolean) => setFieldValue('is_available_for_rent', v)}
        priceValue={values.rent_price}
        priceField="rent_price"
        currencyValue={values.rent_currency}
        currencyField="rent_currency"
        placeholder="e.g. 45,000"
      />

      {errors && (errors as any).atLeastOnePurpose && (
        <View style={[styles.globalError, { backgroundColor: theme.danger + '10', borderColor: theme.danger + '30' }]}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
          <AppText variant="caption" weight="semiBold" style={{ color: theme.danger }}>
            {(errors as any).atLeastOnePurpose}
          </AppText>
        </View>
      )}

      <View style={[styles.infoBox, { backgroundColor: theme.border + '20' }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.subtext} />
        <AppText variant="tiny" weight="medium" style={[{ color: theme.subtext }, styles.infoText]}>
          Your pricing information is stored securely and can be updated at any time.
        </AppText>
      </View>
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
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: { 
  },
  optionSub: {
    marginTop: 2,
  },
  priceContainer: { 
    marginTop: 20, 
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceLabel: { 
    marginBottom: 10,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  currencySelector: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 4,
    height: 56,
    width: 100,
    alignItems: 'center',
  },
  currencyOption: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    fontFamily: 'Inter-Bold',
  },
  errorText: { 
    marginTop: 6, 
    marginLeft: 4,
  },
  globalError: { 
    flexDirection: 'row',
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  }
});

export default StepPricing;
