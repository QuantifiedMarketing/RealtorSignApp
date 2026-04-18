import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

export default function AgentTabLayout() {
  const { user, isLoading } = useAuth();

  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'agent') return <Redirect href="/(admin)/" />;

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
    </Tabs>
  );
}
