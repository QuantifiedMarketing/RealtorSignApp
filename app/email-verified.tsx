import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { BrandColors } from '@/constants/theme';

type ScreenState = 'verifying' | 'success' | 'error';

export default function EmailVerifiedScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [state, setState] = useState<ScreenState>('verifying');

  useEffect(() => {
    if (!code) {
      setState('error');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setState('error');
      } else {
        setState('success');
        // onAuthStateChange in AuthProvider will fetch the profile and set the user.
        // After a brief success moment, let the router re-evaluate — the tabs layout
        // will redirect to complete-profile (if profile is incomplete) or dashboard.
        setTimeout(() => router.replace('/(tabs)/'), 1800);
      }
    });
  }, [code]);

  const Logo = (
    <View style={styles.logoSection}>
      <View style={styles.logoCircle}>
        <Ionicons name="location" size={44} color="#fff" />
      </View>
      <Text style={styles.appName}>SignTrack</Text>
      <Text style={styles.tagline}>Realtor Sign Management</Text>
    </View>
  );

  if (state === 'verifying') {
    return (
      <SafeAreaView style={styles.safe}>
        {Logo}
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.centredText}>Verifying your email address…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {Logo}
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <Ionicons name="warning-outline" size={36} color={BrandColors.warning} />
            </View>
            <Text style={styles.cardTitle}>Verification Failed</Text>
            <Text style={styles.cardSubtitle}>
              This verification link has expired or is no longer valid. Please sign in and request a new confirmation email, or contact support if this issue continues.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // success
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {Logo}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <Ionicons name="checkmark-circle" size={40} color={BrandColors.success} />
          </View>
          <Text style={styles.cardTitle}>Email Verified!</Text>
          <Text style={styles.cardSubtitle}>
            Your email address has been confirmed. Taking you to the app…
          </Text>
          <ActivityIndicator color={BrandColors.primary} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: { fontSize: 32, fontWeight: '800', color: BrandColors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: BrandColors.textSecondary, marginTop: 4 },

  centred: { alignItems: 'center', paddingTop: 32, gap: 16 },
  centredText: { fontSize: 15, color: BrandColors.textSecondary },

  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary, marginBottom: 4, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: BrandColors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 20 },

  primaryBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
