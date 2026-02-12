import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';
import Avatar from './Avatar';

interface PersonCardProps {
  person: any;
  onPress: () => void;
}

const PersonCard = ({ person, onPress }: PersonCardProps) => {
  const themeColors = useThemeColor();
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <Avatar user={person} size={48} />
      
      <View style={styles.content}>
        <AppText variant="body" weight="bold" numberOfLines={1}>
          {person.full_name || person.username || 'Unnamed'}
        </AppText>
        
        <View style={styles.details}>
          {person.phone && (
            <View style={styles.detailItem}>
              <Ionicons name="call" size={12} color={themeColors.primary} />
              <AppText variant="tiny" weight="medium" color={themeColors.subtext}>{person.phone}</AppText>
            </View>
          )}
          {person.email && (
            <View style={styles.detailItem}>
              <Ionicons name="mail" size={12} color={themeColors.primary} />
              <AppText variant="tiny" weight="medium" color={themeColors.subtext} numberOfLines={1}>{person.email}</AppText>
            </View>
          )}
        </View>
      </View>
      
      <View style={[styles.actionBadge, { backgroundColor: themeColors.surface }]}>
        <Ionicons name="chevron-forward" size={14} color={themeColors.subtext} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    elevation: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    gap: 6,
    marginLeft: 10,
  },
  details: {
    flexDirection: 'column',
    gap: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PersonCard;
