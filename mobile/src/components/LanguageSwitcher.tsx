import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { languages, Language } from '../locals';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';

export const LanguageSwitcher = () => {
  const { t, language, setLanguage } = useLanguage();
  const themeColors = useThemeColor();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    setModalVisible(false);
  };

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="language" size={24} color={themeColors.text} />
        <View style={styles.buttonTextContainer}>
          <AppText variant="small" color={themeColors.subtext}>
            {t('common.language')}
          </AppText>
          <AppText variant="body" weight="semibold" color={themeColors.text}>
            {currentLanguage?.nativeName}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={themeColors.subtext} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <AppText variant="heading" weight="bold" color={themeColors.text}>
                {t('common.changeLanguage')}
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    { 
                      backgroundColor: item.code === language ? themeColors.primary + '15' : 'transparent',
                      borderBottomColor: themeColors.border 
                    }
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <AppText 
                      variant="body" 
                      weight="semibold" 
                      color={item.code === language ? themeColors.primary : themeColors.text}
                    >
                      {item.nativeName}
                    </AppText>
                    <AppText variant="small" color={themeColors.subtext}>
                      {item.name}
                    </AppText>
                  </View>
                  {item.code === language && (
                    <Ionicons name="checkmark-circle" size={24} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
});
