import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';

interface DealCardProps {
  deal: any;
  onPress: () => void;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const themeColors = useThemeColor();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return themeColors.success;
      case 'active': return themeColors.primary;
      case 'canceled': return themeColors.danger;
      default: return themeColors.subtext;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: themeColors.primary + '12' }]}>
          <AppText variant="tiny" weight="bold" color={themeColors.primary}>{deal.deal_type}</AppText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '12' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(deal.status) }]} />
          <AppText variant="tiny" weight="semiBold" color={getStatusColor(deal.status)}>
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </AppText>
        </View>
      </View>

      <View style={styles.content}>
        <AppText variant="body" weight="bold" numberOfLines={1} style={{ marginBottom: 2 }}>
          Property #{deal.property_id}
        </AppText>

        <View style={[styles.participants, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.participant}>
            <AppText variant="tiny" weight="medium" color={themeColors.subtext} style={styles.label}>Seller</AppText>
            <AppText variant="small" weight="semiBold" numberOfLines={1}>{deal.seller_name_snapshot || 'N/A'}</AppText>
          </View>
          <View style={styles.connector}>
            <Ionicons name="repeat" size={14} color={themeColors.border} />
          </View>
          <View style={styles.participant}>
            <AppText variant="tiny" weight="medium" color={themeColors.subtext} style={styles.label}>Buyer</AppText>
            <AppText variant="small" weight="semiBold" numberOfLines={1}>{deal.buyer_name_snapshot || 'N/A'}</AppText>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
          <View style={styles.priceContainer}>
            <AppText variant="tiny" weight="medium" color={themeColors.subtext} style={styles.label}>Deal Value</AppText>
            <AppText variant="small" weight="semiBold">Rs {parseFloat(deal.price).toLocaleString()}</AppText>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={12} color={themeColors.subtext} style={{ marginRight: 4 }} />
            <AppText variant="tiny" color={themeColors.subtext}>{formatDate(deal.start_date)}</AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    elevation: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    gap: 10,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  participant: {
    flex: 1,
  },
  connector: {
    paddingHorizontal: 8,
  },
  label: {
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
