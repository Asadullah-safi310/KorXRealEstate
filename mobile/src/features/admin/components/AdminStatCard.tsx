import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: any;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  color: string;
  onPress?: () => void;
}

const AdminStatCard = ({ title, value, icon, iconFamily = 'Ionicons', color, onPress }: AdminStatCardProps) => {
  const themeColors = useThemeColor();

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {iconFamily === 'Ionicons' ? (
          <Ionicons name={icon} size={24} color={color} />
        ) : (
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        )}
      </View>
      <View style={styles.textContainer}>
        <AppText variant="h3" weight="bold">{value}</AppText>
        <AppText variant="small" color={themeColors.subtext}>{title}</AppText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
});

export default AdminStatCard;
