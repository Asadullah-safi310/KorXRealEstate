import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFormikContext } from 'formik';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { validateFileSize, getFileTypeCategory, getImageUrl } from '../../../../utils/mediaUtils';
import { AppText } from '../../../AppText';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const ITEM_WIDTH = (width - 40 - (GRID_SPACING * 2)) / 3;

const StepMedia = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [loading, setLoading] = useState(false);

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      
      const currentMedia = Array.isArray(values.media) ? values.media : [];

      if (!result.canceled) {
        const newMedia = [...currentMedia];
        for (const asset of result.assets) {
          const isValidSize = await validateFileSize(asset.uri, 10);
          if (!isValidSize) {
            Alert.alert('File too large', `Image ${asset.fileName || ''} exceeds 10MB limit.`);
            continue;
          }
          newMedia.push({
            uri: asset.uri,
            name: asset.fileName || `img_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            category: 'image',
          });
        }
        setFieldValue('media', newMedia);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick images');
    } finally {
      setLoading(false);
    }
  };

  const handlePickOtherMedia = async (category: 'video' | 'attachment') => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: category === 'video' ? 'video/*' : '*/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isValidSize = await validateFileSize(asset.uri, 20);
        if (!isValidSize) {
          Alert.alert('File too large', 'File exceeds size limit.');
          return;
        }

        const currentMedia = Array.isArray(values.media) ? values.media : [];
        const type = getFileTypeCategory(asset.name, asset.mimeType);
        const newMedia = [...currentMedia, {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          category: type,
        }];
        setFieldValue('media', newMedia);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = (index: number, isExisting: boolean) => {
    if (isExisting) {
        Alert.alert(
            'Remove Photo',
            'Are you sure you want to remove this existing photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive', 
                    onPress: () => {
                        const currentExisting = Array.isArray(values.existingMedia) ? values.existingMedia : [];
                        const existing = [...currentExisting];
                        const deletedItem = existing[index];
                        existing.splice(index, 1);
                        setFieldValue('existingMedia', existing);
                        
                        // Track deleted media URL for backend deletion
                        const currentDeleted = Array.isArray(values.deletedMedia) ? values.deletedMedia : [];
                        setFieldValue('deletedMedia', [...currentDeleted, deletedItem.url]);
                    } 
                }
            ]
        );
    } else {
        const currentMedia = Array.isArray(values.media) ? values.media : [];
        const newMedia = [...currentMedia];
        newMedia.splice(index, 1);
        setFieldValue('media', newMedia);
    }
  };

  const renderMediaItem = (item: any, index: number, isExisting: boolean) => (
    <View key={isExisting ? `ext-${index}` : `new-${index}`} style={styles.mediaWrapper}>
      <View style={[styles.mediaItemContainer, { backgroundColor: 'transparent', borderColor: theme.border }]}>
        {item.category === 'image' || isExisting ? (
          <Image source={{ uri: isExisting ? getImageUrl(item.url) : item.uri }} style={styles.mediaPreview} />
        ) : (
          <View style={styles.filePlaceholder}>
            <MaterialCommunityIcons 
              name={item.category === 'video' ? 'video-outline' : 'file-document-outline'} 
              size={32} 
              color={theme.primary} 
            />
            <AppText variant="tiny" weight="semiBold" style={[{ color: theme.text }, styles.fileName]} numberOfLines={1}>{item.name}</AppText>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.removeBtn} 
          activeOpacity={0.8}
          onPress={() => removeMedia(index, isExisting)}
        >
          <BlurView intensity={60} tint="dark" style={styles.blurRemove}>
            <Ionicons name="close" size={14} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        {!isExisting && item.category === 'video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Visual Assets</AppText>
      <AppText variant="caption" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Properties with 5+ high-quality photos get 3x more inquiries.
      </AppText>

      <View style={styles.uploadCards}>
        <TouchableOpacity 
          style={[styles.mainUploadCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]} 
          onPress={handlePickImages}
          activeOpacity={0.7}
        >
          <View style={[styles.uploadIconCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="camera" size={28} color="#fff" />
          </View>
          <AppText variant="title" weight="bold" style={{ color: theme.text }}>Add Property Photos</AppText>
          <AppText variant="caption" weight="medium" style={{ color: theme.subtext }}>Upload up to 15 images</AppText>
        </TouchableOpacity>
        
        <View style={styles.secondaryUploads}>
          <TouchableOpacity 
            style={[styles.smallUploadCard, { backgroundColor: 'transparent', borderColor: theme.border }]} 
            onPress={() => handlePickOtherMedia('video')}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={24} color={theme.primary} />
            <AppText variant="tiny" weight="semiBold" style={{ color: theme.text }}>Add Video</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallUploadCard, { backgroundColor: 'transparent', borderColor: theme.border }]} 
            onPress={() => handlePickOtherMedia('attachment')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-attach-outline" size={24} color={theme.primary} />
            <AppText variant="tiny" weight="semiBold" style={{ color: theme.text }}>Documents</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primary} />
          <AppText variant="caption" weight="medium" style={{ color: theme.subtext }}>Processing files...</AppText>
        </View>
      )}

      <View style={styles.mediaGrid}>
        {(values.existingMedia || []).map((item: any, index: number) => renderMediaItem(item, index, true))}
        {(values.media || []).map((item: any, index: number) => renderMediaItem(item, index, false))}
        
        {(!values.existingMedia?.length && !values.media?.length) && (
          <View style={[styles.emptyGrid, { backgroundColor: theme.border + '10' }]}>
            <MaterialCommunityIcons name="image-multiple-outline" size={40} color={theme.border} />
            <AppText variant="caption" weight="semiBold" style={{ color: theme.subtext }}>No media added yet</AppText>
          </View>
        )}
      </View>

      {touched.media && errors.media && (
        <View style={[styles.errorBox, { backgroundColor: theme.danger + '10' }]}>
          <AppText variant="caption" weight="semiBold" style={{ color: theme.danger }}>{errors.media as string}</AppText>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: { 
    letterSpacing: -0.5,
  },
  sectionSubtitle: { 
    marginBottom: 24,
    marginTop: 2,
  },
  uploadCards: {
    gap: 12,
  },
  mainUploadCard: {
    height: 160,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadTitle: {
  },
  uploadSub: {
  },
  secondaryUploads: {
    flexDirection: 'row',
    gap: 12,
  },
  smallUploadCard: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  smallUploadText: {
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  loadingText: {
  },
  mediaGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: GRID_SPACING, 
    marginTop: 30,
  },
  mediaWrapper: { 
    width: ITEM_WIDTH, 
    aspectRatio: 1,
  },
  mediaItemContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreview: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'cover',
  },
  filePlaceholder: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 10,
  },
  fileName: { 
    marginTop: 6, 
    textAlign: 'center',
  },
  removeBtn: { 
    position: 'absolute', 
    top: 6, 
    right: 6,
    zIndex: 10,
  },
  blurRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGrid: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyGridText: {
  },
  errorBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: { 
  },
});

export default StepMedia;
