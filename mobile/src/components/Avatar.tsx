import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../utils/mediaUtils';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';
import { observer } from 'mobx-react-lite';

interface AvatarProps {
  user?: {
    full_name?: string;
    profile_picture?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

const AvatarComponent: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  const themeColors = useThemeColor();
  const getAvatarSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 64;
      case 'xl': return 100;
      default: return 48;
    }
  };

  const avatarSize = getAvatarSize();

  // Try to find profile picture in multiple locations (top level or nested User object)
  const profilePic = user?.profile_picture || (user as any)?.User?.profile_picture;
  const finalImageSource = getImageUrl(profilePic);

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => {
    // Reset previous load failures when image source changes.
    setImageError(false);
  }, [finalImageSource]);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <View style={[styles.container, { 
      width: avatarSize, 
      height: avatarSize, 
      borderRadius: avatarSize / 2,
      backgroundColor: themeColors.border
    }]}>
      {finalImageSource && !imageError ? (
        <Image
          key={finalImageSource}
          source={{ uri: finalImageSource }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.placeholder, { 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: avatarSize / 2,
          backgroundColor: themeColors.border
        }]}>
          {initials ? (
            <AppText 
              weight="bold"
              style={{ 
                fontSize: avatarSize / 2.5,
                color: themeColors.mutedText
              }}
            >
              {initials}
            </AppText>
          ) : (
            <Ionicons name="person" size={avatarSize / 1.5} color={themeColors.mutedText} />
          )}
        </View>
      )}
    </View>
  );
};

const Avatar = observer(AvatarComponent);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Avatar;
