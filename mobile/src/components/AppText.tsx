import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant, FontWeight, fontWeights } from '../theme';
import { useThemeColor } from '../hooks/useThemeColor';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  weight?: FontWeight;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  weight,
  color,
  style,
  children,
  ...props
}) => {
  const themeColors = useThemeColor();
  
  const textStyle = [
    styles[variant],
    weight ? { fontFamily: fontWeights[weight] } : null,
    { color: color || themeColors.text },
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  title: typography.title,
  body: typography.body,
  small: typography.small,
  caption: typography.caption,
  tiny: typography.tiny,
});
