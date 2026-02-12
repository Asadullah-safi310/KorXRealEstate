import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import authStore from "../../../stores/AuthStore";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useThemeColor } from "../../../hooks/useThemeColor";

const Index = observer(() => {
  const themeColors = useThemeColor();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (authStore.isLoading || !isMounted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // Always start on the public dashboard. Authenticated users will see
  // their role-specific dashboard from the dashboard screen itself.
  return <Redirect href="/(tabs)/dashboard" />;
});

export default Index;
