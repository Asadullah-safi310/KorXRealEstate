import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import dealStore from '../../../stores/DealStore';
import Avatar from '../../../components/Avatar';
import ScreenLayout from '../../../components/ScreenLayout';
import { useThemeColor } from '../../../hooks/useThemeColor';

const DealDetailsScreen = observer(() => {
  const theme = useThemeColor();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      const data = await dealStore.fetchDealById(id as string);
      setDeal(data);
      setLoading(false);
    };

    fetchDeal();
  }, [id]);

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleProfilePress = (user: any) => {
    if (!user) return;
    if (user.user_id) {
      router.push(`/person/user_${user.user_id}`);
    } else if (user.id) {
      router.push(`/person/${user.id}`);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': 
        return { color: theme.success, icon: 'check-circle', label: 'Completed' };
      case 'active': 
        return { color: theme.primary, icon: 'clock-outline', label: 'Active' };
      case 'canceled': 
        return { color: theme.danger, icon: 'close-circle-outline', label: 'Canceled' };
      default: 
        return { color: theme.subtext, icon: 'help-circle-outline', label: status || 'Unknown' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!deal) {
    return (
      <ScreenLayout scrollable backgroundColor={theme.background}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="file-search-outline" size={80} color={theme.border} />
          <Text style={[styles.errorText, { color: theme.subtext }]}>Deal record not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.primary }]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: '#fff' }]}>Return to Deals</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const statusConfig = getStatusConfig(deal.status);

  return (
    <ScreenLayout 
      scrollable 
      backgroundColor={theme.background}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Deal Details</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="share-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '15', borderColor: statusConfig.color + '30' }]}>
        <MaterialCommunityIcons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          <Text style={[styles.dealId, { color: theme.subtext }]}>#{deal.deal_id?.toString().padStart(6, '0')}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.typeBadgeText}>{deal.deal_type?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Price Card */}
      <View style={[styles.priceCard, { backgroundColor: theme.primary }]}>
        <View style={styles.priceHeader}>
          <Text style={styles.priceLabel}>Transaction Value</Text>
          <MaterialCommunityIcons name="currency-inr" size={20} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.priceValue}>Rs {parseFloat(deal.price).toLocaleString()}</Text>
        
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.miniLabel}>Initiated On</Text>
            <Text style={styles.dateText}>{new Date(deal.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={styles.miniLabel}>{deal.status === 'completed' ? 'Closed On' : 'Expected Close'}</Text>
            <Text style={styles.dateText}>
              {deal.end_date 
                ? new Date(deal.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'TBD'}
            </Text>
          </View>
        </View>
      </View>

      {/* Property Link */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Associated Property</Text>
      <TouchableOpacity 
        style={[styles.propertyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/property/${deal.property_id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.propertyImagePlaceholder, { backgroundColor: theme.background }]}>
          <MaterialCommunityIcons name="home-city" size={28} color={theme.primary} />
        </View>
        <View style={styles.propertyDetails}>
          <Text style={[styles.propertyTitle, { color: theme.text }]} numberOfLines={1}>
            {deal.Property?.property_type} in {deal.Property?.city}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.subtext} />
            <Text style={[styles.propertyLocation, { color: theme.subtext }]} numberOfLines={1}>
              {deal.Property?.location}
            </Text>
          </View>
        </View>
        <View style={[styles.arrowContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="chevron-forward" size={18} color={theme.primary} />
        </View>
      </TouchableOpacity>

      {/* Participants */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Involved Parties</Text>
      
      <View style={styles.participantsContainer}>
        {/* Seller Card */}
        <View style={[styles.participantCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.roleHeader}>
            <Text style={[styles.roleLabel, { color: theme.primary }]}>PRINCIPAL / SELLER</Text>
            <View style={[styles.roleLine, { backgroundColor: theme.primary + '30' }]} />
          </View>
          <View style={styles.participantMain}>
            <Avatar user={{ full_name: deal.seller_name_snapshot }} size="lg" />
            <View style={styles.participantInfo}>
              <Text style={[styles.participantName, { color: theme.text }]}>{deal.seller_name_snapshot}</Text>
              <Text style={[styles.participantDetail, { color: theme.subtext }]}>{deal.seller_phone_snapshot}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleCall(deal.seller_phone_snapshot)} 
              style={[styles.callBtn, { backgroundColor: theme.primary + '10' }]}
            >
              <Ionicons name="call" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connector */}
        <View style={styles.connectorContainer}>
          <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
          <View style={[styles.connectorCircle, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="swap-vertical" size={16} color={theme.subtext} />
          </View>
          <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Buyer Card */}
        <View style={[styles.participantCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.roleHeader}>
            <Text style={[styles.roleLabel, { color: theme.success }]}>CLIENT / BUYER</Text>
            <View style={[styles.roleLine, { backgroundColor: theme.success + '30' }]} />
          </View>
          <View style={styles.participantMain}>
            <Avatar user={{ full_name: deal.buyer_name_snapshot }} size="lg" />
            <View style={styles.participantInfo}>
              <Text style={[styles.participantName, { color: theme.text }]}>{deal.buyer_name_snapshot}</Text>
              <Text style={[styles.participantDetail, { color: theme.subtext }]}>{deal.buyer_phone_snapshot}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleCall(deal.buyer_phone_snapshot)} 
              style={[styles.callBtn, { backgroundColor: theme.success + '10' }]}
            >
              <Ionicons name="call" size={20} color={theme.success} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notes */}
      {deal.notes && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Deal Notes</Text>
          <View style={[styles.notesBox, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
            <Text style={[styles.notesText, { color: theme.text }]}>{deal.notes}</Text>
          </View>
        </>
      )}

      {/* Agent Charge */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Agent in Charge</Text>
      <TouchableOpacity 
        style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => handleProfilePress(deal.Agent)}
        activeOpacity={0.7}
      >
        <Avatar user={deal.Agent} size="md" />
        <View style={styles.agentInfo}>
          <Text style={[styles.agentName, { color: theme.text }]}>{deal.Agent?.full_name}</Text>
          <Text style={[styles.agentEmail, { color: theme.subtext }]}>{deal.Agent?.email}</Text>
        </View>
        <View style={[styles.agentBadge, { backgroundColor: theme.background }]}>
          <Text style={[styles.agentBadgeText, { color: theme.primary }]}>Verified</Text>
        </View>
      </TouchableOpacity>

    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dealId: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  priceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
  },
  dateItem: {
    flex: 1,
  },
  miniLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dateDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
    marginTop: 10,
    letterSpacing: -0.5,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  propertyImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyDetails: {
    flex: 1,
    marginLeft: 14,
  },
  propertyTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyLocation: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  participantsContainer: {
    marginBottom: 24,
  },
  participantCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginRight: 10,
  },
  roleLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  participantMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 16,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  participantDetail: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorContainer: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 1.5,
    flex: 1,
  },
  connectorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 1,
  },
  notesBox: {
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 6,
    marginBottom: 24,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  agentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '800',
  },
  agentEmail: {
    fontSize: 13,
    marginTop: 1,
    fontWeight: '500',
  },
  agentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  agentBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default DealDetailsScreen;
