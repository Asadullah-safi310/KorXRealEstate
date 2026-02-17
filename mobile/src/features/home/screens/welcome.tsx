import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useLanguage } from '../../../contexts/LanguageContext';
import { WELCOME_SEEN_STORAGE_KEY } from '../../../constants/onboarding';

const WelcomeScreen = () => {
  const theme = useThemeColor();
  const { t } = useLanguage();
  const router = useRouter();

  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_SEEN_STORAGE_KEY, '1');
    } catch (error) {
      console.error('Failed to store welcome flag:', error);
    }
  };

  const continueToLogin = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/login');
  };

  const continueToRegister = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/register');
  };

  const continueAsGuest = async () => {
    await markWelcomeSeen();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <LinearGradient
        colors={[theme.secondary, theme.primary, theme.info]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.1 }}
        style={styles.background}
      >
        <View style={[styles.blobTopLeft, { backgroundColor: `${theme.black}6B` }]} />
        <View style={[styles.blobTopRight, { backgroundColor: 'rgba(255,255,255,0.34)' }]} />
        <View style={[styles.blobTopCenter, { backgroundColor: 'rgba(255,255,255,0.26)' }]} />
        <View style={[styles.blobMidLeft, { backgroundColor: `${theme.info}42` }]} />
        <View style={[styles.blobBottomLeft, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
        <View style={[styles.blobBottomMain, { backgroundColor: `${theme.black}7A` }]} />
        <View style={[styles.blobBottomAccent, { backgroundColor: `${theme.info}B8` }]} />

        <View style={styles.waveWrap}>
          <View style={[styles.waveOne, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />
          <View style={[styles.waveTwo, { backgroundColor: 'rgba(15,23,42,0.24)' }]} />
        </View>

        <View style={styles.centerContent}>
          <AppText variant="h1" weight="bold" color="#fff" style={styles.title}>
            {t('auth.welcomeBack')}!
          </AppText>
          <AppText variant="small" color="rgba(255,255,255,0.9)" style={styles.subtitle}>
            {t('dashboard.signInPrompt')}
          </AppText>
        </View>

        <View style={styles.bottomCtaWrap}>
          <TouchableOpacity activeOpacity={0.85} style={styles.exploreAction} onPress={continueAsGuest}>
            <AppText variant="small" weight="semiBold" color="#fff">
              {t('welcome.exploreGuest')}
            </AppText>
          </TouchableOpacity>

          <View style={styles.bottomActions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.signInAction} onPress={continueToLogin}>
            <AppText variant="small" weight="semiBold" color="#fff">
              {t('auth.signIn')}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.88} style={styles.signUpAction} onPress={continueToRegister}>
            <AppText variant="small" weight="bold" color={theme.primary}>
              {t('auth.signUp')}
            </AppText>
          </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    marginTop: -8,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  waveWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  waveOne: {
    position: 'absolute',
    width: 320,
    height: 380,
    borderRadius: 180,
    top: 140,
    left: 30,
    transform: [{ rotate: '18deg' }],
  },
  waveTwo: {
    position: 'absolute',
    width: 260,
    height: 360,
    borderRadius: 150,
    bottom: -60,
    right: -20,
    transform: [{ rotate: '14deg' }],
  },
  blobTopLeft: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    top: 8,
    left: -18,
  },
  blobTopRight: {
    position: 'absolute',
    width: 140,
    height: 96,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    top: 0,
    right: 0,
  },
  blobTopCenter: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    top: 76,
    right: 50,
  },
  blobMidLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 130,
    left: -34,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    bottom: 118,
    left: 10,
  },
  blobBottomMain: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    bottom: -72,
    left: 26,
  },
  blobBottomAccent: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: 74,
    left: 34,
  },
  bottomCtaWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    gap: 8,
  },
  exploreAction: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 6,
    backgroundColor: 'rgba(15,23,42,0.3)',
  },
  signInAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 14,
  },
  signUpAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen;
