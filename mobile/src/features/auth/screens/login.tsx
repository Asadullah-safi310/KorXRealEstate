import React, { useEffect, useState } from 'react';
import { BackHandler, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authStore from '../../../stores/AuthStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../../contexts/LanguageContext';
import { normalizeAfghanPhone, isAfghanPhoneValid } from '../../../utils/phoneUtils';


const LoginScreen = observer(() => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const themeColors = useThemeColor();
  const { t } = useLanguage();
  const isPhoneValid = isAfghanPhoneValid(phone);
  const phoneValidationMessage = phone && !isPhoneValid ? t('errors.invalidPhone') : '';

  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)/dashboard');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => subscription.remove();
  }, [router]);

  const handleLogin = async () => {
    if (!phone || !password) {
      setError(t('errors.requiredField'));
      return;
    }
    if (!isPhoneValid) {
      setError(t('errors.invalidPhone'));
      return;
    }
    setError('');

    const normalizedPhone = normalizeAfghanPhone(phone);
    const success = await authStore.login(normalizedPhone, password);
    if (success) {
      router.replace('/(tabs)/dashboard');
    } else {
      setError(authStore.error || t('auth.invalidCredentials'));
    }
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  return (
    <ScreenLayout 
      backgroundColor={themeColors.background} 
      keyboardAware 
      scrollable
      bottomSpacing={40}
    >
      <View style={styles.topActions}>
        <TouchableOpacity 
          style={styles.skipButtonContainer}
          onPress={() => router.replace('/(tabs)/dashboard')}
        >
          <BlurView intensity={20} tint="light" style={styles.skipBlur}>
            <AppText variant="caption" weight="semiBold" color={themeColors.subtext} style={{ marginRight: 2 }}>Skip</AppText>
            <Ionicons name="chevron-forward" size={16} color={themeColors.subtext} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoContainer, { backgroundColor: themeColors.primary + '10' }]}>
            <Ionicons name="home" size={40} color={themeColors.primary} />
          </View>
          <AppText variant="h1" weight="bold">{t('auth.welcomeBack')}</AppText>
          <AppText variant="body" color={themeColors.subtext} style={{ textAlign: 'center', opacity: 0.8, paddingHorizontal: 20 }}>
            {t('dashboard.signInPrompt')}
          </AppText>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '30' }]}>
              <Ionicons name="alert-circle" size={20} color={themeColors.danger} />
              <AppText variant="small" weight="medium" color={themeColors.danger} style={{ flex: 1 }}>{error}</AppText>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.phone')}</AppText>
            <View
              style={[
                styles.phoneInputWrapper,
                {
                  backgroundColor: themeColors.card,
                  borderColor: phoneValidationMessage ? themeColors.danger : themeColors.border,
                },
              ]}
            >
              <View style={[styles.phonePrefix, { borderRightColor: themeColors.border }]}>
                <AppText weight="bold" color={themeColors.text}>0093</AppText>
              </View>
              <TextInput
                style={[styles.phoneInput, { color: themeColors.text }]}
                placeholder={t('auth.enterPhone')}
                placeholderTextColor={themeColors.subtext + '60'}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
            {phoneValidationMessage ? (
              <AppText variant="caption" weight="medium" color={themeColors.danger} style={{ marginLeft: 4, marginTop: 4 }}>
                {phoneValidationMessage}
              </AppText>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="small" weight="bold" style={{ marginLeft: 4, marginBottom: 8 }}>{t('auth.password')}</AppText>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder={t('auth.enterPassword')}
                placeholderTextColor={themeColors.subtext + '60'}
                value={password}
                onChangeText={setPassword}
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

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <AppText variant="small" weight="bold" color={themeColors.primary}>{t('auth.forgotPassword')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: themeColors.primary }, authStore.isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={authStore.isLoading}
          >
            {authStore.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppText weight="bold" color="#fff">{t('auth.signIn')}</AppText>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <AppText variant="small" color={themeColors.subtext}>{t('auth.dontHaveAccount')} </AppText>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <AppText variant="small" weight="bold" color={themeColors.primary}>{t('auth.signUp')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  skipButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  skipBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    gap: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  inputGroup: {
    gap: 8,
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
    paddingHorizontal: 14,
  },
  phonePrefix: {
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  loginButton: {
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

export default LoginScreen;
