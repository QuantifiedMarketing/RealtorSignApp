import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { BrandColors } from '@/constants/theme';

type ScreenState = 'exchanging' | 'invalid' | 'form' | 'saving' | 'success';

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const [state, setState] = useState<ScreenState>('exchanging');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!code) {
      setState('invalid');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setState('invalid');
      } else {
        setState('form');
      }
    });
  }, [code]);

  const handleSubmit = async () => {
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords you entered do not match.');
      return;
    }

    setError('');
    setState('saving');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message ?? 'Could not update your password. Please try again.');
      setState('form');
      return;
    }

    setState('success');
    setTimeout(() => router.replace('/(tabs)/'), 1800);
  };

  const Logo = (
    <View style={styles.logoSection}>
      <View style={styles.logoCircle}>
        <Ionicons name="location" size={44} color="#fff" />
      </View>
      <Text style={styles.appName}>SignTrack</Text>
      <Text style={styles.tagline}>Realtor Sign Management</Text>
    </View>
  );

  // ── Exchanging code ────────────────────────────────────────────────────────
  if (state === 'exchanging') {
    return (
      <SafeAreaView style={styles.safe}>
        {Logo}
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.centredText}>Verifying your reset link…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (state === 'invalid') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {Logo}
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <Ionicons name="warning-outline" size={36} color={BrandColors.warning} />
            </View>
            <Text style={styles.cardTitle}>Link Expired or Invalid</Text>
            <Text style={styles.cardSubtitle}>
              This password reset link has expired or has already been used. Please request a new one from the sign-in screen.
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

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {Logo}
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <Ionicons name="checkmark-circle" size={40} color={BrandColors.success} />
            </View>
            <Text style={styles.cardTitle}>Password Updated</Text>
            <Text style={styles.cardSubtitle}>
              Your password has been changed successfully. Taking you to the app…
            </Text>
            <ActivityIndicator color={BrandColors.primary} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Password form ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {Logo}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Password</Text>
            <Text style={styles.cardSubtitle}>
              Choose a new password for your SignTrack account.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={BrandColors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={BrandColors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={BrandColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={confirmRef}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={BrandColors.textSecondary}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(v => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={BrandColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, state === 'saving' && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={state === 'saving'}
              activeOpacity={0.85}
            >
              {state === 'saving'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.primaryBtnText}>Update Password</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  flex: { flex: 1 },
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

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, color: BrandColors.error, fontSize: 14, lineHeight: 20 },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: BrandColors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: 14 },

  primaryBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
