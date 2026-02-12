import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import personStore from '../../../stores/PersonStore';
import { getImageUrl } from '../../../utils/mediaUtils';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';


const PersonCreateScreen = observer(() => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const theme = useThemeColor();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    address: '',
  });

  const [errors, setErrors] = useState<any>({});

  const fetchPerson = useCallback(async () => {
    setDataLoading(true);
    const person = await personStore.fetchPersonById(id as string);
    if (person) {
      setFormData({
        full_name: person.full_name || '',
        phone: person.phone || '',
        email: person.email || '',
        national_id: person.national_id || '',
        address: person.address || '',
      });
      if (person.id_card_path) {
        setIdCardImage(person.id_card_path);
      }
    }
    setDataLoading(false);
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchPerson();
    } else {
      setDataLoading(false);
    }
  }, [id, isEditing, fetchPerson]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload an ID card.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please provide at least a name and phone number.');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('full_name', formData.full_name);
    data.append('phone', formData.phone);
    data.append('email', formData.email);
    data.append('national_id', formData.national_id);
    data.append('address', formData.address);

    if (idCardImage && !idCardImage.startsWith('http')) {
      const uriParts = idCardImage.split('.');
      const fileType = uriParts[uriParts.length - 1];
      data.append('id_card', {
        uri: idCardImage,
        name: `id_card.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    let success = false;
    if (isEditing) {
      success = await personStore.updatePerson(id as string, data);
    } else {
      success = await personStore.createPerson(data);
    }

    setLoading(false);

    if (success) {
      Alert.alert('Success', `Information ${isEditing ? 'updated' : 'saved'} successfully`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', personStore.error || 'Failed to save person information');
    }
  };

  if (dataLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditing ? 'Edit Profile' : 'New Contact'}
          </Text>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
            Enter the essential information for this person.
          </Text>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: errors.full_name ? theme.danger : theme.border }]}>
                <Ionicons name="person-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={theme.subtext}
                  value={formData.full_name}
                  onChangeText={val => setFormData(prev => ({ ...prev, full_name: val }))}
                />
              </View>
              {errors.full_name && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.full_name}</Text>}
            </View>

            {/* Phone & Email Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: errors.phone ? theme.danger : theme.border }]}>
                  <TextInput 
                    style={[styles.input, { color: theme.text }]}
                    placeholder="03xx xxxxxxx"
                    placeholderTextColor={theme.subtext}
                    value={formData.phone}
                    onChangeText={val => setFormData(prev => ({ ...prev, phone: val }))}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.text }]}>ID / CNIC</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <TextInput 
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Optional"
                    placeholderTextColor={theme.subtext}
                    value={formData.national_id}
                    onChangeText={val => setFormData(prev => ({ ...prev, national_id: val }))}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.subtext}
                  value={formData.email}
                  onChangeText={val => setFormData(prev => ({ ...prev, email: val }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Residential Address</Text>
              <View style={[styles.inputBox, styles.textAreaBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput 
                  style={[styles.input, styles.textArea, { color: theme.text }]}
                  placeholder="Street address, City..."
                  placeholderTextColor={theme.subtext}
                  value={formData.address}
                  onChangeText={val => setFormData(prev => ({ ...prev, address: val }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}>Identity Verification</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
              Upload a clear photo of the National ID card for verification.
            </Text>

            <TouchableOpacity 
              style={[styles.imagePicker, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {idCardImage ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: getImageUrl(idCardImage) || undefined }} style={styles.previewImage} />
                  <BlurView intensity={60} style={styles.imageActions}>
                    <TouchableOpacity style={styles.imageActionBtn} onPress={pickImage}>
                      <Ionicons name="camera" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageActionBtn} onPress={() => setIdCardImage(null)}>
                      <Ionicons name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </BlurView>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={[styles.uploadCircle, { backgroundColor: theme.primary + '15' }]}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={32} color={theme.primary} />
                  </View>
                  <Text style={[styles.imagePlaceholderText, { color: theme.text }]}>Upload ID Document</Text>
                  <Text style={[styles.imagePlaceholderSubtext, { color: theme.subtext }]}>Supports JPG, PNG (Max 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary }, loading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>{isEditing ? 'Update Profile' : 'Create Contact'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    borderRadius: 16,
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
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    height: 60,
  },
  textAreaBox: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    marginTop: 4,
  },
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginTop: 8,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  imageActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    height: 68,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
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
});

export default PersonCreateScreen;
