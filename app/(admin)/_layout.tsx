import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

export default function AdminTabLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'admin') return <Redirect href="/(tabs)/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarStyle: {
          backgroundColor: BrandColors.primaryDark,
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
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
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'All Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
