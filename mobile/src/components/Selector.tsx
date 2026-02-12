import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { AppText } from './AppText';
import { useThemeColor, useCurrentTheme } from '../hooks/useThemeColor';

const Selector = ({ label, value, options, onSelect, placeholder, error, loading, icon }: any) => {
  const theme = useThemeColor();
  const currentTheme = useCurrentTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt: any) => String(opt.id) === String(value));

  return (
    <View style={styles.inputGroup}>
      <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>{label}</AppText>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.selectorInput, 
          { borderColor: theme.border, backgroundColor: theme.card },
          error && { borderColor: theme.danger }
        ]}
        onPress={() => setModalVisible(true)}
        disabled={loading || options.length === 0}
      >
        <View style={styles.selectorMain}>
          <Ionicons name={icon || "location-outline"} size={20} color={theme.subtext} style={styles.inputIcon} />
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <AppText weight="medium" style={{ color: selectedOption ? theme.text : theme.subtext }}>
              {selectedOption ? selectedOption.name : placeholder}
            </AppText>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.subtext} />
      </TouchableOpacity>
      {error && <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{error}</AppText>}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <BlurView intensity={20} tint={currentTheme} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalIndicator} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border + '20' }]}>
              <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Select {label}</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={[styles.optionItem, { borderBottomColor: theme.border + '10' }]}
                  onPress={() => {
                    onSelect(item.id);
                    setModalVisible(false);
                  }}
                >
                  <AppText 
                    weight={String(item.id) === String(value) ? 'bold' : 'medium'}
                    style={[
                      { color: theme.text },
                      String(item.id) === String(value) && { color: theme.primary }
                    ]}
                  >
                    {item.name}
                  </AppText>
                  {String(item.id) === String(value) && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <MaterialCommunityIcons name="database-off-outline" size={48} color={theme.subtext} />
                  <AppText weight="semiBold" style={{ color: theme.subtext }}>No options available</AppText>
                </View>
              }
            />
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 20, gap: 8 },
  selectorInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16 },
  selectorMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  inputIcon: { marginRight: 12 },
  errorText: { marginTop: 4, marginLeft: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', paddingBottom: 40 },
  modalIndicator: { width: 40, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalList: { paddingHorizontal: 24, paddingVertical: 10 },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  emptyList: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
});

export default Selector;
