import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useEffect } from 'react';
import { springConfig } from '../../src/utils/animations';
import filterStore from '../../src/stores/FilterStore';
import authStore from '../../src/stores/AuthStore';

const TabIcon = ({ name, color, focused }: { name: any, color: string, focused: boolean }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.2, springConfig),
        withSpring(1, springConfig)
      );
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
};

export default observer(function TabLayout() {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColor();
  const router = useRouter();
  const isAgentUser = authStore.user?.role === 'agent';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subtext,
        tabBarStyle: {
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 5,
          backgroundColor: themeColors.card,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "business" : "business-outline"} color={color} focused={focused} />
          ),
        }}
      />
      
      {/* Sell/Rent FAB - Show only if authenticated and has ADD_PROPERTY permission */}
      <Tabs.Screen
        name="create-property"
        options={{
          title: 'Add',
          href: (isAuthenticated && authStore.hasPermission('ADD_PROPERTY')) ? '/(tabs)/create-property' : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.fabContainer, { backgroundColor: themeColors.card }]}>
              <View style={[styles.fab, { backgroundColor: themeColors.primary }]}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </View>
          ),
          tabBarLabelStyle: {
            marginTop: 15,
          },
          listeners: {
            tabPress: (event) => {
              event.preventDefault();
              if (isLoading) return;
              
              if (!isAuthenticated) {
                router.push('/(auth)/login');
              } else if (authStore.hasPermission('ADD_PROPERTY')) {
                router.push('/property/create');
              }
            },
          },
        }}
      />

      {/* Filters Tab - Available to Everyone */}
      <Tabs.Screen
        name="filters"
        options={{
          title: filterStore.hasActiveFilters ? 'Reset' : 'Filters',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name={filterStore.hasActiveFilters ? (focused ? "refresh" : "refresh-outline") : (focused ? "options" : "options-outline")} 
              color={color} 
              focused={focused} 
            />
          ),
          listeners: {
            tabPress: (event) => {
              if (filterStore.hasActiveFilters) {
                event.preventDefault();
                filterStore.clearFilters();
                setTimeout(() => {
                  router.replace('/(tabs)/properties');
                }, 0);
              }
            },
          },
        }}
      />

      {/* Insights Tab - Only for Authenticated Users */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          href: (isAuthenticated && !isAgentUser) ? '/(tabs)/insights' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "bulb" : "bulb-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* People Tab - Only for Agents/Admins */}
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          href: (isAdmin && !isAgentUser) ? '/(tabs)/people' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "people" : "people-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* Menus Tab - Only for Unauthenticated Users */}
      <Tabs.Screen
        name="menus"
        options={{
          title: 'Menus',
          href: !isAuthenticated ? '/(tabs)/menus' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "menu" : "menu-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* Profile Tab - Only for Authenticated Users */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: isAuthenticated ? '/(tabs)/profile' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
});

const styles = StyleSheet.create({
  fabContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
