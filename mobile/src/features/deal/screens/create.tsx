import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { propertyService } from '../../../services/property.service';
import { dealService } from '../../../services/deal.service';
import propertyStore from '../../../stores/PropertyStore';
import personStore from '../../../stores/PersonStore';
import PropertyCard from '../../../components/PropertyCard';
import PersonCard from '../../../components/PersonCard';
import authStore from '../../../stores/AuthStore';
import ScreenLayout from '../../../components/ScreenLayout';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { BlurView } from 'expo-blur';
import Avatar from '../../../components/Avatar';


const CreateDealScreen = observer(() => {
  const theme = useThemeColor();
  const router = useRouter();
  const { propertyId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentOwner, setCurrentOwner] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    deal_type: 'SALE' as 'SALE' | 'RENT',
    property_id: '',
    seller_person_id: '',
    buyer_person_id: '',
    price: '',
    start_date: '',
    notes: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [personModalVisible, setPersonModalVisible] = useState(false);

  const fetchOwnerData = useCallback(async (propId: string) => {
    try {
      const res = await propertyService.getCurrentOwner(propId);
      const owner = res.data.Person;
      if (owner) {
        setCurrentOwner(owner);
        setFormData(prev => ({ ...prev, seller_person_id: String(owner.id) }));
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error('Error fetching owner:', err);
      }
      setCurrentOwner(null);
    }
  }, []);

  const handlePropertySelect = useCallback(async (prop: any, dealType?: 'SALE' | 'RENT') => {
    const type = dealType || (prop.is_available_for_sale ? 'SALE' : 'RENT');
    setSelectedProperty(prop);
    setFormData(prev => ({
      ...prev,
      property_id: String(prop.property_id),
      deal_type: type,
      buyer_person_id: '',
      price: String(type === 'RENT' ? prop.rent_price : prop.sale_price),
    }));
    setSelectedBuyer(null);
    setPropertyModalVisible(false);
    await fetchOwnerData(String(prop.property_id));
  }, [fetchOwnerData]);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          propertyStore.fetchProperties(true),
          personStore.fetchPersons(),
        ]);

        if (propertyId) {
          const prop = propertyStore.properties.find(p => p.property_id === parseInt(propertyId as string));
          if (prop) {
            const dealType = prop.is_available_for_sale ? 'SALE' : 'RENT';
            handlePropertySelect(prop, dealType);
          }
        }
      } catch {
        Alert.alert('Error', 'Failed to load initial data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchInitialData();
  }, [propertyId, handlePropertySelect, router]);

  const handlePersonSelect = (person: any) => {
    setSelectedBuyer(person);
    setFormData(prev => ({ ...prev, buyer_person_id: String(person.id) }));
    setPersonModalVisible(false);
  };

  const handleProfilePress = (user: any) => {
    if (!user) return;
    if (user.user_id) {
      router.push(`/person/user_${user.user_id}`);
    } else if (user.id) {
      router.push(`/person/${user.id}`);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.property_id) newErrors.property_id = 'Property selection is required';
    if (!formData.buyer_person_id) newErrors.buyer_person_id = 'Client selection is required';
    if (formData.deal_type === 'RENT' && !formData.start_date) newErrors.start_date = 'Start date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deal_type: formData.deal_type,
        property_id: parseInt(formData.property_id),
        seller_person_id: parseInt(formData.seller_person_id),
        buyer_person_id: parseInt(formData.buyer_person_id),
        price: formData.price ? parseFloat(formData.price) : null,
        start_date: formData.deal_type === 'RENT' ? formData.start_date : null,
        notes: formData.notes,
      };

      await dealService.createDeal(payload);
      Alert.alert('Success', 'Deal has been recorded successfully', [
        { text: 'View Deals', onPress: () => router.push('/(tabs)/deals') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'System failed to process the deal');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const filteredProperties = propertyStore.properties.filter(p => 
    formData.deal_type === 'SALE' ? Boolean(p.is_available_for_sale) : Boolean(p.is_available_for_rent)
  );

  const availableBuyers = personStore.persons.filter(p => 
    currentOwner ? p.id !== currentOwner.id : true
  );

  return (
    <ScreenLayout scrollable backgroundColor={theme.background} keyboardAware>
      <View style={styles.container}>
        {/* Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.iconButton, { backgroundColor: theme.card }]}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Transaction</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={loading}
            style={[styles.iconButton, { backgroundColor: theme.primary }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Deal Information</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
            Select a property and a client to record a new transaction.
          </Text>

          <View style={styles.form}>
            {/* Deal Type Switcher */}
            <View style={[styles.typeSwitcher, { backgroundColor: theme.card }]}>
              <TouchableOpacity 
                style={[styles.typeOption, formData.deal_type === 'SALE' && { backgroundColor: theme.primary }]}
                onPress={() => setFormData(prev => ({ ...prev, deal_type: 'SALE' }))}
              >
                <MaterialCommunityIcons 
                  name="handshake" 
                  size={20} 
                  color={formData.deal_type === 'SALE' ? '#fff' : theme.subtext} 
                />
                <Text style={[styles.typeText, { color: formData.deal_type === 'SALE' ? '#fff' : theme.subtext }]}>Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeOption, formData.deal_type === 'RENT' && { backgroundColor: theme.primary }]}
                onPress={() => setFormData(prev => ({ ...prev, deal_type: 'RENT' }))}
              >
                <MaterialCommunityIcons 
                  name="calendar-clock" 
                  size={20} 
                  color={formData.deal_type === 'RENT' ? '#fff' : theme.subtext} 
                />
                <Text style={[styles.typeText, { color: formData.deal_type === 'RENT' ? '#fff' : theme.subtext }]}>Rent</Text>
              </TouchableOpacity>
            </View>

            {/* Property Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Property</Text>
              <TouchableOpacity 
                style={[styles.cardSelector, { backgroundColor: theme.card, borderColor: errors.property_id ? theme.danger : theme.border }]}
                onPress={() => setPropertyModalVisible(true)}
                activeOpacity={0.7}
              >
                {selectedProperty ? (
                  <View style={styles.selectionInfo}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                      <MaterialCommunityIcons name="home-city" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.selectionText}>
                      <Text style={[styles.mainText, { color: theme.text }]} numberOfLines={1}>
                        {selectedProperty.property_type} in {selectedProperty.city}
                      </Text>
                      <Text style={[styles.subText, { color: theme.subtext }]} numberOfLines={1}>
                        {selectedProperty.location}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholder}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                      <Ionicons name="search" size={20} color={theme.subtext} />
                    </View>
                    <Text style={[styles.placeholderText, { color: theme.subtext }]}>Tap to select property</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={theme.border} />
              </TouchableOpacity>
              {errors.property_id && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.property_id}</Text>}
            </View>

            {/* Owner Info (Read-only) */}
            {currentOwner && (
              <TouchableOpacity 
                style={[styles.ownerCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}
                onPress={() => handleProfilePress(currentOwner)}
                activeOpacity={0.7}
              >
                <View style={styles.ownerHeader}>
                  <Avatar user={currentOwner} size="sm" />
                  <View style={styles.ownerText}>
                    <Text style={[styles.ownerLabel, { color: theme.primary }]}>PRINCIPAL OWNER</Text>
                    <Text style={[styles.ownerName, { color: theme.text }]}>{currentOwner.full_name}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="shield-check" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}

            {/* Buyer Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                {formData.deal_type === 'SALE' ? 'Purchasing Client' : 'Prospective Tenant'}
              </Text>
              <TouchableOpacity 
                style={[styles.cardSelector, { backgroundColor: theme.card, borderColor: errors.buyer_person_id ? theme.danger : theme.border }]}
                onPress={() => setPersonModalVisible(true)}
                activeOpacity={0.7}
              >
                {selectedBuyer ? (
                  <View style={styles.selectionInfo}>
                    <Avatar user={selectedBuyer} size="sm" />
                    <View style={styles.selectionText}>
                      <Text style={[styles.mainText, { color: theme.text }]}>{selectedBuyer.full_name}</Text>
                      <Text style={[styles.subText, { color: theme.subtext }]}>{selectedBuyer.phone}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholder}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                      <Ionicons name="person-add" size={20} color={theme.subtext} />
                    </View>
                    <Text style={[styles.placeholderText, { color: theme.subtext }]}>Tap to select client</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={theme.border} />
              </TouchableOpacity>
              {errors.buyer_person_id && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.buyer_person_id}</Text>}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}>Agreement Terms</Text>
            
            {/* Price & Date Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: theme.text }]}>Agreed Price</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.prefix, { color: theme.primary }]}>Rs</Text>
                  <TextInput 
                    style={[styles.input, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.subtext}
                    value={formData.price}
                    onChangeText={(val) => setFormData(prev => ({ ...prev, price: val }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              {formData.deal_type === 'RENT' && (
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: errors.start_date ? theme.danger : theme.border }]}>
                    <TextInput 
                      style={[styles.input, { color: theme.text }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.subtext}
                      value={formData.start_date}
                      onChangeText={(val) => setFormData(prev => ({ ...prev, start_date: val }))}
                    />
                    <Ionicons name="calendar-outline" size={18} color={theme.subtext} />
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Closing Notes</Text>
              <View style={[styles.inputBox, styles.textAreaBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput 
                  style={[styles.input, styles.textArea, { color: theme.text }]}
                  placeholder="Details of the agreement..."
                  placeholderTextColor={theme.subtext}
                  value={formData.notes}
                  onChangeText={(val) => setFormData(prev => ({ ...prev, notes: val }))}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary }, loading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Finalize {formData.deal_type === 'SALE' ? 'Sale' : 'Lease'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Property Modal */}
      <Modal visible={propertyModalVisible} animationType="slide" transparent>
        <BlurView intensity={30} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choose Property</Text>
              <TouchableOpacity onPress={() => setPropertyModalVisible(false)} style={[styles.modalClose, { backgroundColor: theme.card }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item.property_id.toString()}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <PropertyCard property={item} onPress={() => handlePropertySelect(item)} />
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <MaterialCommunityIcons name="home-search" size={64} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.subtext }]}>
                    No properties available for {formData.deal_type.toLowerCase()}
                  </Text>
                </View>
              }
            />
          </View>
        </BlurView>
      </Modal>

      {/* Person Modal */}
      <Modal visible={personModalVisible} animationType="slide" transparent>
        <BlurView intensity={30} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Client</Text>
              <TouchableOpacity onPress={() => setPersonModalVisible(false)} style={[styles.modalClose, { backgroundColor: theme.card }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableBuyers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <PersonCard person={item} onPress={() => handlePersonSelect(item)} />
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <MaterialCommunityIcons name="account-search" size={64} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.subtext }]}>No contacts found</Text>
                </View>
              }
            />
          </View>
        </BlurView>
      </Modal>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  typeSwitcher: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 22,
    gap: 8,
    borderWidth: 1.5,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  selectionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    marginTop: -4,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ownerText: {
    gap: 2,
  },
  ownerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 18,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  textAreaBox: {
    height: 140,
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },
  modalContent: {
    flex: 1,
    marginTop: 80,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  modalClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalList: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  modalEmpty: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CreateDealScreen;
