import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import authStore from "../../../stores/AuthStore";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useThemeColor } from "../../../hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WELCOME_SEEN_STORAGE_KEY } from "../../../constants/onboarding";

const Index = observer(() => {
  const themeColors = useThemeColor();
  const [isMounted, setIsMounted] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkWelcome = async () => {
      try {
        const seen = await AsyncStorage.getItem(WELCOME_SEEN_STORAGE_KEY);
        if (active) {
          setHasSeenWelcome(seen === "1");
        }
      } catch (error) {
        console.error("Failed to read welcome flag:", error);
        if (active) {
          setHasSeenWelcome(true);
        }
      } finally {
        if (active) {
          setIsMounted(true);
        }
      }
    };

    checkWelcome();
    return () => {
      active = false;
    };
  }, []);

  if (authStore.isLoading || !isMounted || hasSeenWelcome === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Always start on the public dashboard. Authenticated users will see
  // their role-specific dashboard from the dashboard screen itself.
  return <Redirect href="/(tabs)/dashboard" />;
});

export default Index;
