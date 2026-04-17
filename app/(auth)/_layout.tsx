import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth';

export default function AuthLayout() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <Redirect href="/(admin)/" />;
  if (user?.role === 'agent') return <Redirect href="/(tabs)/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
