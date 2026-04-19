import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, isProfileComplete } from '@/context/auth';
import { BrandColors } from '@/constants/theme';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';

export default function AgentTabLayout() {
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().then(token => {
      if (token) savePushToken(user.id, token);
    });
  }, [user?.id]);

  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'agent') return <Redirect href="/(admin)/" />;
  if (!isProfileComplete(user)) return <Redirect href="/complete-profile" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: BrandColors.surface,
          borderTopColor: BrandColors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Sign Out',
          tabBarIcon: ({ size }) => (
            <Ionicons name="log-out-outline" size={size} color={BrandColors.error} />
          ),
          tabBarLabel: 'Sign Out',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: BrandColors.error },
        }}
        listeners={{
          tabPress: e => {
            e.preventDefault();
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ],
            );
          },
        }}
      />
    </Tabs>
  );
}
