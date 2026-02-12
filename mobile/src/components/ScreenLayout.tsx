import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

type ScreenLayoutProps = {
  children: React.ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  scrollable?: boolean;
  scrollProps?: ScrollViewProps;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  bottomSpacing?: number;
  keyboardAware?: boolean;
};

const ScreenLayout = ({
  children,
  backgroundColor,
  edges = ['top', 'bottom', 'left', 'right'],
  scrollable = false,
  scrollProps = {},
  contentContainerStyle,
  style,
  bottomSpacing = 90,
  keyboardAware = false,
}: ScreenLayoutProps) => {
  const { colors } = useTheme();
  const bgColor = backgroundColor || colors.background;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const scrollContainerStyles = scrollable
    ? [
        styles.scrollContent,
        { paddingBottom: bottomInset + bottomSpacing },
        contentContainerStyle,
        scrollProps.contentContainerStyle,
      ]
    : undefined;
  const scrollStyle = scrollable ? [styles.scrollView, scrollProps.style] : undefined;

  const layoutContent = scrollable ? (
    <ScrollView
      {...scrollProps}
      style={scrollStyle}
      contentContainerStyle={scrollContainerStyles}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  if (keyboardAware) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={edges}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {layoutContent}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={edges}>
      {layoutContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default ScreenLayout;
