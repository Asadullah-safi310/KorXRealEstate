import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  Switch,
  TouchableOpacity,
  Modal,
  Pressable
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';
import { AnimatedFormInput } from '../../../AnimatedFormInput';

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { smoothLayout } from '../../../../utils/animations';

const CURRENCIES = [
  { label: 'Afghan Afghani', value: 'AF', symbol: 'AF' },
  { label: 'US Dollar', value: 'USD', symbol: '$' },
];

const ToggleCard = ({ label, value, onValueChange, icon, description }: any) => {
  const theme = useThemeColor();
  return (
    <View style={[
      styles.toggleCard, 
      { backgroundColor: 'transparent', borderColor: value ? theme.primary : theme.border }
    ]}>
      <View style={styles.toggleHeader}>
        <View style={[styles.iconContainer, { backgroundColor: value ? theme.primary + '15' : theme.border + '15' }]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={value ? theme.primary : theme.subtext} 
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="title" weight="bold" style={{ color: theme.text }}>{label}</AppText>
          <AppText variant="tiny" style={{ color: theme.subtext }}>{description}</AppText>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary + '50' }}
          thumbColor={value ? theme.primary : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const StepListingInfo = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [showSaleCurrency, setShowSaleCurrency] = useState(false);
  const [showRentCurrency, setShowRentCurrency] = useState(false);

  const saleCurrency = CURRENCIES.find(c => c.value === values.sale_currency) || CURRENCIES[0];
  const rentCurrency = CURRENCIES.find(c => c.value === values.rent_currency) || CURRENCIES[0];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Pricing</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Set your listing type and price.
      </AppText>

      <View style={{ gap: 12, marginBottom: 24 }}>
        <ToggleCard
          label="For Sale"
          description="List this property for purchase"
          icon="tag-outline"
          value={values.for_sale}
          onValueChange={(val: boolean) => {
            setFieldValue('for_sale', val);
            if (!val) setFieldValue('sale_price', '');
          }}
        />

        {values.for_sale && (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={smoothLayout}>
            <AppText variant="caption" weight="semiBold" style={{ color: theme.text, marginBottom: 8 }}>
              Sale Price
            </AppText>
            <View style={styles.priceInputRow}>
              <TouchableOpacity 
                style={[styles.currencySelector, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowSaleCurrency(true)}
              >
                <AppText variant="body" weight="bold" style={{ color: theme.text }}>
                  {saleCurrency.symbol}
                </AppText>
                <Ionicons name="chevron-down" size={16} color={theme.subtext} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subtext}
                  value={values.sale_price?.toString()}
                  onChangeText={(t) => setFieldValue('sale_price', t)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {touched.sale_price && errors.sale_price && (
              <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>
                {errors.sale_price as string}
              </AppText>
            )}
          </Animated.View>
        )}

        <ToggleCard
          label="For Rent"
          description="List this property for monthly rent"
          icon="calendar-clock-outline"
          value={values.for_rent}
          onValueChange={(val: boolean) => {
            setFieldValue('for_rent', val);
            if (!val) setFieldValue('rent_price', '');
          }}
        />

        {values.for_rent && (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={smoothLayout}>
            <AppText variant="caption" weight="semiBold" style={{ color: theme.text, marginBottom: 8 }}>
              Monthly Rent
            </AppText>
            <View style={styles.priceInputRow}>
              <TouchableOpacity 
                style={[styles.currencySelector, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowRentCurrency(true)}
              >
                <AppText variant="body" weight="bold" style={{ color: theme.text }}>
                  {rentCurrency.symbol}
                </AppText>
                <Ionicons name="chevron-down" size={16} color={theme.subtext} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subtext}
                  value={values.rent_price?.toString()}
                  onChangeText={(t) => setFieldValue('rent_price', t)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {touched.rent_price && errors.rent_price && (
              <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>
                {errors.rent_price as string}
              </AppText>
            )}
          </Animated.View>
        )}
      </View>

      {!values.for_sale && !values.for_rent && (
        <View style={[styles.warningBox, { backgroundColor: theme.warning + '10', borderColor: theme.warning + '30' }]}>
          <Ionicons name="warning-outline" size={20} color={theme.warning} />
          <AppText variant="caption" weight="medium" style={{ color: theme.warning, flex: 1, marginLeft: 8 }}>
            Please select at least one listing type to make the property visible to seekers.
          </AppText>
        </View>
      )}

      {/* Sale Currency Picker Modal */}
      <Modal visible={showSaleCurrency} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSaleCurrency(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="bold" style={{ color: theme.text }}>Select Currency</AppText>
              <TouchableOpacity onPress={() => setShowSaleCurrency(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.value}
                  style={[
                    styles.currencyOption,
                    { borderBottomColor: theme.border },
                    values.sale_currency === currency.value && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    setFieldValue('sale_currency', currency.value);
                    setShowSaleCurrency(false);
                  }}
                >
                  <AppText variant="body" weight="semiBold" style={{ color: theme.text }}>
                    {currency.label} ({currency.symbol})
                  </AppText>
                  {values.sale_currency === currency.value && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Rent Currency Picker Modal */}
      <Modal visible={showRentCurrency} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowRentCurrency(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="bold" style={{ color: theme.text }}>Select Currency</AppText>
              <TouchableOpacity onPress={() => setShowRentCurrency(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.value}
                  style={[
                    styles.currencyOption,
                    { borderBottomColor: theme.border },
                    values.rent_currency === currency.value && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    setFieldValue('rent_currency', currency.value);
                    setShowRentCurrency(false);
                  }}
                >
                  <AppText variant="body" weight="semiBold" style={{ color: theme.text }}>
                    {currency.label} ({currency.symbol})
                  </AppText>
                  {values.rent_currency === currency.value && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
  toggleCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInputContainer: {
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
  priceInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  currencySelector: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minWidth: 80,
    justifyContent: 'center',
  },
  priceInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
});

export default StepListingInfo;
