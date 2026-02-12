import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormScreenLayoutProps = ScrollViewProps & {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
};

const FormScreenLayout = ({
  children,
  contentContainerStyle,
  keyboardVerticalOffset,
  ...scrollProps
}: FormScreenLayoutProps) => {
  const insets = useSafeAreaInsets();
  const offset = keyboardVerticalOffset ?? (Platform.OS === 'ios' ? 90 : 0);

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 24 },
          contentContainerStyle
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  contentContainer: {
    padding: 24,
    flexGrow: 1
  }
});

export default FormScreenLayout;
