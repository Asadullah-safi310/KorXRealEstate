import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authStore from '../../../stores/AuthStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { normalizeAfghanPhone, isAfghanPhoneValid } from '../../../utils/phoneUtils';
import { useLanguage } from '../../../contexts/LanguageContext';


const RegisterScreen = observer(() => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const themeColors = useThemeColor();
  const { t } = useLanguage();

  const isPhoneValid = isAfghanPhoneValid(formData.phone);
  const normalizedPhone = normalizeAfghanPhone(formData.phone);
  
  const phoneValidationMessage = formData.phone
    ? isPhoneValid
      ? 'Phone number is valid'
      : 'Phone number must be 10 digits'
    : '';
  const phoneValidationColor = isPhoneValid ? '#22c55e' : themeColors.danger;

  const handleContinueToStepTwo = () => {
    if (!formData.phone) {
      setError(t('errors.requiredField'));
      return;
    }

    if (!isPhoneValid) {
      setError(t('errors.invalidPhone'));
      return;
    }

    setError('');
    setStep(2);
  };

  const handleRegister = async () => {
    const { full_name, phone, password, confirmPassword } = formData;

    if (!full_name || !password || !confirmPassword) {
      setError(t('errors.requiredField'));
      return;
    }

    if (!isPhoneValid) {
      setError(t('errors.invalidPhone'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordsDoNotMatch'));
      return;
    }

    setError('');

    const success = await authStore.register({
      full_name,
      username: full_name,
      phone: normalizedPhone,
      password
    });

    if (success) {
      Alert.alert(
        t('common.success'),
        'Account created successfully',
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/dashboard') }]
      );
    } else {
      setError(authStore.error || t('errors.somethingWentWrong'));
    }
  };

  const updateField = (field: string, value: string) => {
    if (error) setError('');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    updateField('phone', digits);
  };

  return (
    <ScreenLayout 
      backgroundColor={themeColors.background} 
      keyboardAware 
      scrollable
      bottomSpacing={40}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (step === 2) {
              setStep(1);
              setError('');
              return;
            }
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoContainer, { backgroundColor: themeColors.primary + '10' }]}>
            <Ionicons name="person-add" size={40} color={themeColors.primary} />
          </View>
          <AppText variant="h1" weight="bold">{t('auth.createAccount')}</AppText>
          <AppText variant="body" color={themeColors.subtext} style={{ textAlign: 'center', opacity: 0.8, paddingHorizontal: 20 }}>
            {step === 1 ? 'Step 1 of 2: Enter your phone number' : 'Step 2 of 2: Complete your account details'}
          </AppText>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '30' }]}>
              <Ionicons name="alert-circle" size={20} color={themeColors.danger} />
              <AppText variant="small" weight="medium" color={themeColors.danger} style={{ flex: 1 }}>{error}</AppText>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <View style={styles.inputGroup}>
                <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.phone')}</AppText>
                <View style={[styles.phoneInputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={[styles.phonePrefix, { borderRightColor: themeColors.border }]}>
                    <AppText weight="bold">+93</AppText>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { color: themeColors.text }]}
                    placeholder="07xx xxx xxxx"
                    placeholderTextColor={themeColors.subtext + '60'}
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                  />
                </View>
                {phoneValidationMessage ? (
                  <AppText variant="caption" weight="medium" color={phoneValidationColor} style={{ marginLeft: 4, marginTop: 4 }}>
                    {phoneValidationMessage}
                  </AppText>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.fullName')}</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="person-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="John Doe"
                    placeholderTextColor={themeColors.subtext + '60'}
                    value={formData.full_name}
                    onChangeText={v => updateField('full_name', v)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.password')}</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor={themeColors.subtext + '60'}
                    value={formData.password}
                    onChangeText={v => updateField('password', v)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={themeColors.subtext} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.confirmPassword')}</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor={themeColors.subtext + '60'}
                    value={formData.confirmPassword}
                    onChangeText={v => updateField('confirmPassword', v)}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={themeColors.subtext} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: themeColors.primary }, authStore.isLoading && styles.buttonDisabled]}
            onPress={step === 1 ? handleContinueToStepTwo : handleRegister}
            disabled={authStore.isLoading}
          >
            {authStore.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppText weight="bold" color="#fff">{step === 1 ? t('common.next') : t('auth.signUp')}</AppText>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <AppText variant="small" color={themeColors.subtext}>{t('auth.alreadyHaveAccount')} </AppText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <AppText variant="small" weight="bold" color={themeColors.primary}>{t('auth.signIn')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 56,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    height: 56,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1.5,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
});

export default RegisterScreen;
