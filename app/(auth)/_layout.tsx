import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background }}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
      </View>
    );
  }

  if (user?.role === 'admin') return <Redirect href="/(admin)/" />;
  if (user?.role === 'agent') return <Redirect href="/(tabs)/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
