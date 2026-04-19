import React, { forwardRef, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

type Mode = 'signin' | 'register' | 'forgot';

function friendlySignInError(msg: string): string {
  if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
    return 'The email address or password you entered is incorrect. Please check your details and try again.';
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for a confirmation link.';
  }
  return 'Sign-in failed. Please try again.';
}

function friendlyRegisterError(msg: string): string {
  if (msg.toLowerCase().includes('password should be at least')) {
    return 'Your password must be at least 6 characters.';
  }
  if (msg.toLowerCase().includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  return 'Registration failed. Please try again.';
}

const PasswordInput = forwardRef<TextInput, {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  returnKeyType?: 'next' | 'done';
  onSubmit?: () => void;
}>(function PasswordInput({ value, onChange, placeholder, show, onToggleShow, returnKeyType, onSubmit }, ref) {
  return (
    <View style={styles.passwordRow}>
      <TextInput
        ref={ref}
        style={styles.passwordInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={BrandColors.textSecondary}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType ?? 'done'}
        onSubmitEditing={onSubmit}
      />
      <TouchableOpacity
        onPress={onToggleShow}
        style={styles.eyeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={show ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={BrandColors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
});

export default function LoginScreen() {
  const { login, register, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const clearFormState = () => {
    setError('');
    setEmailTaken(false);
    setResetSent(false);
    setVerificationSent(false);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (next: Mode) => {
    clearFormState();
    setMode(next);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }
    setError('');
    setIsBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(friendlySignInError(e.message ?? ''));
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
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
    setEmailTaken(false);
    setIsBusy(true);
    try {
      const { needsVerification } = await register(email.trim().toLowerCase(), password);
      if (needsVerification) {
        setVerificationSent(true);
      }
      // If no verification needed, onAuthStateChange fires and navigates automatically.
    } catch (e: any) {
      if (e.message === 'email-already-exists') {
        setEmailTaken(true);
        setError('An account with this email address already exists.');
      } else {
        setError(friendlyRegisterError(e.message ?? ''));
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setIsBusy(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch {
      setError('Could not send the reset email. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  // ── Shared elements ────────────────────────────────────────────────────────

  const Logo = (
    <View style={styles.logoSection}>
      <View style={styles.logoCircle}>
        <Ionicons name="location" size={44} color="#fff" />
      </View>
      <Text style={styles.appName}>SignTrack</Text>
      <Text style={styles.tagline}>Realtor Sign Management</Text>
    </View>
  );

  const ErrorBox = error ? (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={16} color={BrandColors.error} />
      <View style={styles.errorContent}>
        <Text style={styles.errorText}>{error}</Text>
        {emailTaken && (
          <TouchableOpacity onPress={() => { setEmailTaken(false); setError(''); setMode('signin'); }} activeOpacity={0.7}>
            <Text style={styles.errorLink}>Sign in instead →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ) : null;

  // ── Forgot Password card ───────────────────────────────────────────────────

  if (mode === 'forgot') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            {Logo}

            <View style={styles.card}>
              <TouchableOpacity style={styles.backRow} onPress={() => switchMode('signin')} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={18} color={BrandColors.primary} />
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSubtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              {ErrorBox}

              {resetSent ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color={BrandColors.success} />
                  <Text style={styles.successText}>
                    If an account exists with that email address, you'll receive a reset link shortly. Please check your inbox.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={BrandColors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, isBusy && styles.primaryBtnDisabled]}
                    onPress={handleResetPassword}
                    disabled={isBusy}
                    activeOpacity={0.85}
                  >
                    {isBusy
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign In / Register card ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {Logo}

          <View style={styles.card}>

            {/* Mode toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleBtnActive]}
                onPress={() => switchMode('signin')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
                onPress={() => switchMode('register')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>
              {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {mode === 'signin'
                ? 'Sign in to your SignTrack account.'
                : 'Register to start managing your signs.'}
            </Text>

            {/* Verification success (register path) */}
            {verificationSent && (
              <View style={styles.successBox}>
                <Ionicons name="mail" size={18} color={BrandColors.success} />
                <Text style={styles.successText}>
                  Account created! Please check your email to verify your address before signing in.
                </Text>
              </View>
            )}

            {!verificationSent && (
              <>
                {ErrorBox}

                {/* Email */}
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={BrandColors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                {/* Password */}
                <Text style={styles.label}>Password</Text>
                <PasswordInput
                  ref={passwordRef}
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                  show={showPassword}
                  onToggleShow={() => setShowPassword(v => !v)}
                  returnKeyType={mode === 'register' ? 'next' : 'done'}
                  onSubmit={mode === 'register'
                    ? () => confirmRef.current?.focus()
                    : handleSignIn
                  }
                />

                {/* Confirm Password (register only) */}
                {mode === 'register' && (
                  <>
                    <Text style={styles.label}>Confirm Password</Text>
                    <PasswordInput
                      ref={confirmRef}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Re-enter your password"
                      show={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword(v => !v)}
                      returnKeyType="done"
                      onSubmit={handleRegister}
                    />
                  </>
                )}

                {/* Forgot password link (sign-in only) */}
                {mode === 'signin' && (
                  <TouchableOpacity
                    style={styles.forgotRow}
                    onPress={() => switchMode('forgot')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                {/* Primary action */}
                <TouchableOpacity
                  style={[styles.primaryBtn, isBusy && styles.primaryBtnDisabled]}
                  onPress={mode === 'signin' ? handleSignIn : handleRegister}
                  disabled={isBusy}
                  activeOpacity={0.85}
                >
                  {isBusy
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>
                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      </Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* Demo credentials hint (sign-in only) */}
            {mode === 'signin' && !verificationSent && (
              <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>Demo Credentials</Text>
                <Text style={styles.hintText}>Agent:  agent@test.com / Password123</Text>
                <Text style={styles.hintText}>Admin:  admin@test.com / Password123</Text>
              </View>
            )}

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
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 14, color: BrandColors.textSecondary, marginTop: 4 },

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

  toggle: {
    flexDirection: 'row',
    backgroundColor: BrandColors.divider,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: BrandColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: BrandColors.textSecondary },
  toggleTextActive: { color: BrandColors.primary },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: 24,
  },

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
  errorContent: { flex: 1 },
  errorText: { color: BrandColors.error, fontSize: 14, lineHeight: 20 },
  errorLink: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: { flex: 1, color: '#166534', fontSize: 14, lineHeight: 20 },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: BrandColors.textPrimary,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
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

  forgotRow: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 20 },
  forgotText: { fontSize: 13, fontWeight: '600', color: BrandColors.primary },

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
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '600', color: BrandColors.primary },

  hintBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: BrandColors.divider,
    borderRadius: 8,
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hintText: { fontSize: 12, color: BrandColors.textSecondary, lineHeight: 18 },
});
