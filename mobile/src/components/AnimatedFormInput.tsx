import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TextInputProps,
  ColorValue
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  FadeInDown,
  FadeOutUp,
  interpolateColor
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';

interface AnimatedFormInputProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  icon?: React.ReactNode;
  containerStyle?: any;
}

export const AnimatedFormInput: React.FC<AnimatedFormInputProps> = ({ 
  label, 
  error, 
  touched, 
  icon,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...props 
}) => {
  const theme = useThemeColor();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [theme.border, theme.primary]
    );

    return {
      borderColor: error && touched ? theme.danger : borderColor,
      borderWidth: isFocused || (error && touched) ? 2 : 1.5,
      backgroundColor: 'transparent',
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      <AppText variant="caption" weight="semiBold" style={{ color: theme.text, marginBottom: 8 }}>
        {label}
      </AppText>
      
      <Animated.View style={[styles.inputWrapper, animatedContainerStyle, containerStyle]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.text + '40'}
          {...props}
        />
      </Animated.View>

      {touched && error && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutUp.duration(200)}
          style={styles.errorContainer}
        >
          <AppText variant="tiny" weight="semiBold" style={{ color: theme.danger }}>
            {error}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    height: '100%',
  },
  errorContainer: {
    marginTop: 4,
    marginLeft: 4,
  },
});
