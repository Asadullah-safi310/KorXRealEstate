import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Platform
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import authStore from '../../../stores/AuthStore';
import { personService } from '../../../services/person.service';
import Avatar from '../../../components/Avatar';
import ScreenLayout from '../../../components/ScreenLayout';
import { useThemeColor } from '../../../hooks/useThemeColor';


const ProfileEditScreen = observer(() => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const theme = useThemeColor();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    address: '',
  });
  const [profilePicture, setProfilePicture] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await personService.getProfile();
      const profile = response.data;
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        national_id: profile.national_id || '',
        address: profile.address || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.full_name || !formData.phone) {
      Alert.alert('Incomplete Form', 'Full name and phone are required');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('national_id', formData.national_id);
      data.append('address', formData.address);

      if (profilePicture?.uri) {
        const fallbackName = `profile-${Date.now()}.jpg`;
        const fileName = profilePicture.fileName || profilePicture.uri.split('/').pop() || fallbackName;
        const lowerName = String(fileName).toLowerCase();
        const inferredType =
          lowerName.endsWith('.png') ? 'image/png' :
          lowerName.endsWith('.webp') ? 'image/webp' :
          lowerName.endsWith('.gif') ? 'image/gif' :
          'image/jpeg';
        const mimeType = profilePicture.mimeType || inferredType;

        data.append('profile_picture', {
          uri: profilePicture.uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      const updateResponse = await personService.updateProfile(data, true);
      const updatedProfile = updateResponse?.data?.user || updateResponse?.data?.data || updateResponse?.data;
      if (updatedProfile && typeof updatedProfile === 'object') {
        authStore.updateUserData({
          full_name: updatedProfile.full_name ?? authStore.user?.full_name,
          phone: updatedProfile.phone ?? authStore.user?.phone,
          email: updatedProfile.email ?? authStore.user?.email,
          national_id: updatedProfile.national_id ?? authStore.user?.national_id,
          address: updatedProfile.address ?? authStore.user?.address,
          profile_picture: updatedProfile.profile_picture ?? authStore.user?.profile_picture,
        });
      }
      
      // Refresh user data from server
      await authStore.checkAuth();
      
      // Clear the local profile picture to force re-render with server data
      setProfilePicture(null);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Update failed', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0]);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScreenLayout scrollable backgroundColor={theme.background} keyboardAware>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.headerBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleUpdate} 
          disabled={loading}
          style={[styles.headerBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.avatarWrapper}>
            {profilePicture ? (
              <Avatar user={{ profile_picture: profilePicture.uri, full_name: formData.full_name }} size="xl" />
            ) : (
              <Avatar user={authStore.user as any} size="xl" />
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarLabel, { color: theme.text }]}>Change Profile Photo</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={formData.full_name}
                onChangeText={(v) => setFormData(prev => ({ ...prev, full_name: v }))}
                placeholder="Enter your full name"
                placeholderTextColor={theme.subtext + '80'}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={formData.phone}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                  placeholder="03xx xxxxxxx"
                  placeholderTextColor={theme.subtext + '80'}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>National ID</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={formData.national_id}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, national_id: v }))}
                  placeholder="Optional"
                  placeholderTextColor={theme.subtext + '80'}
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
                value={formData.email}
                onChangeText={(v) => setFormData(prev => ({ ...prev, email: v }))}
                placeholder="Enter your email"
                placeholderTextColor={theme.subtext + '80'}
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
                value={formData.address}
                onChangeText={(v) => setFormData(prev => ({ ...prev, address: v }))}
                placeholder="Enter your full address"
                placeholderTextColor={theme.subtext + '80'}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary }, loading && { opacity: 0.8 }]} 
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Profile Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 36,
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    marginLeft: 4,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  textAreaBox: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  submitButton: {
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});

export default ProfileEditScreen;
