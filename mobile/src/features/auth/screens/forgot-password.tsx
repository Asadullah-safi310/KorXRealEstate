import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../../api/axiosInstance';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';


const ForgotPasswordScreen = () => {
  const themeColors = useThemeColor();
  const [step, setStep] = useState(1); // 1: Identify, 2: Confirm Email, 3: Enter OTP, 4: Reset Password
  const [identifier, setIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleIdentify = async () => {
    if (!identifier) {
      setError('Please enter your phone or username');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { identifier });
      setMaskedEmail(response.data.maskedEmail);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/forgot-password', { identifier, email });
      setStep(3);
      setTimer(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/verify-reset-code', { identifier, otp });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/reset-password', { identifier, otp, newPassword });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <AppText variant="h2" weight="bold">Find Your Account</AppText>
              <AppText variant="body" color={themeColors.subtext}>
                Enter your phone number or username associated with your account.
              </AppText>
            </View>
            <View style={styles.inputGroup}>
              <AppText variant="small" weight="bold" style={{ marginLeft: 4 }}>Phone or Username</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="person-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Enter phone or username"
                  placeholderTextColor={themeColors.subtext + '60'}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: themeColors.primary }]} 
              onPress={handleIdentify} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppText weight="bold" color="#fff">Continue</AppText>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
              <Ionicons name="arrow-back" size={16} color={themeColors.primary} />
              <AppText variant="small" weight="bold" color={themeColors.primary} style={{ marginLeft: 6 }}>Back to identification</AppText>
            </TouchableOpacity>
            <View style={styles.stepHeader}>
              <AppText variant="h2" weight="bold">Confirm Email</AppText>
              <AppText variant="body" color={themeColors.subtext}>
                Confirm the email you provided in your profile settings: {'\n'}
                <AppText weight="bold" color={themeColors.text}>{maskedEmail}</AppText>
              </AppText>
            </View>
            <View style={styles.inputGroup}>
              <AppText variant="small" weight="bold" style={{ marginLeft: 4 }}>Email Address</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="mail-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="your-email@example.com"
                  placeholderTextColor={themeColors.subtext + '60'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: themeColors.primary }]} 
              onPress={handleSendCode} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppText weight="bold" color="#fff">Send Code</AppText>
                  <Ionicons name="paper-plane-outline" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <AppText variant="h2" weight="bold">Enter Code</AppText>
              <AppText variant="body" color={themeColors.subtext}>
                Enter the 6-digit verification code sent to your email.
              </AppText>
            </View>
            <View style={styles.inputGroup}>
              <AppText variant="small" weight="bold" style={{ marginLeft: 4 }}>Verification Code</AppText>
              <TextInput
                style={[styles.otpInput, { color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                placeholder="000000"
                placeholderTextColor={themeColors.subtext + '40'}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: themeColors.primary }]} 
              onPress={handleVerifyOtp} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppText weight="bold" color="#fff">Verify Code</AppText>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={handleSendCode} 
              disabled={timer > 0 || loading}
            >
              <AppText 
                variant="small" 
                weight="bold" 
                color={timer > 0 ? themeColors.subtext : themeColors.primary}
              >
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
              </AppText>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <AppText variant="h2" weight="bold">New Password</AppText>
              <AppText variant="body" color={themeColors.subtext}>
                Create a strong password to protect your account.
              </AppText>
            </View>
            <View style={styles.inputGroup}>
              <AppText variant="small" weight="bold" style={{ marginLeft: 4 }}>New Password</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.subtext + '60'}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <AppText variant="small" weight="bold" style={{ marginLeft: 4 }}>Confirm New Password</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.subtext + '60'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: themeColors.primary }]} 
              onPress={handleResetPassword} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppText weight="bold" color="#fff">Reset Password</AppText>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenLayout 
      backgroundColor={themeColors.background} 
      keyboardAware 
      scrollable
      bottomSpacing={40}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <AppText variant="title" weight="bold">Password Recovery</AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
           {[1, 2, 3, 4].map((i) => (
               <View 
                key={i} 
                style={[
                    styles.progressBar, 
                    { backgroundColor: i <= step ? themeColors.primary : themeColors.border }
                ]} 
               />
           ))}
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '30' }]}>
            <Ionicons name="alert-circle" size={20} color={themeColors.danger} />
            <AppText variant="small" weight="medium" color={themeColors.danger} style={{ flex: 1 }}>{error}</AppText>
          </View>
        ) : null}

        {renderStep()}

        <View style={styles.footer}>
          <AppText variant="small" color={themeColors.subtext}>Remembered your password? </AppText>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <AppText variant="small" weight="bold" color={themeColors.primary}>Sign In</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 24,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    gap: 8,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  otpInput: {
    borderWidth: 1.5,
    borderRadius: 20,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 10,
  },
  primaryButton: {
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
});

export default ForgotPasswordScreen;
