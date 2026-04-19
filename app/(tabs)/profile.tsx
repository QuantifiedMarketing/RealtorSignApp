import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/auth';
import { useJobs } from '@/context/jobs';
import type { PanelWidth, PostColour, PanelOrientation } from '@/context/auth';
import { ProfileForm } from '@/components/profile-form';
import type { ProfileFormValues, ProfileFormField } from '@/components/profile-form';
import { uploadProfilePhoto, isLocalUri } from '@/lib/image-utils';
import { BrandColors } from '@/constants/theme';

const PANEL_LABELS: Record<string, string> = {
  up_to_24_inches: 'Up to 24 inches',
  over_24_inches:  'Over 24 inches',
};

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={17} color={BrandColors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, isLoading, logout, updateProfile } = useAuth();
  const { jobs } = useJobs();
  const liveCount = user ? jobs.filter(j => j.agentId === user.id && j.status === 'active').length : 0;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [form, setForm] = useState<ProfileFormValues | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={56} color={BrandColors.border} />
          <Text style={styles.emptyTitle}>Profile unavailable</Text>
          <Text style={styles.emptySub}>Could not load your profile. Please sign out and sign in again.</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const enterEdit = () => {
    setForm({
      name: user.name,
      phone: user.phone ?? '',
      brokerage: user.brokerage ?? '',
      brokerageAddress: user.brokerageAddress ?? '',
      panelWidth: user.defaultPanelWidth ?? '',
      panelOrientation: user.defaultPanelOrientation ?? '',
      postColour: user.defaultPostColour ?? '',
      photoUri: user.profilePhotoUrl ?? '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setForm(null);
  };

  const handleChange = (field: ProfileFormField, value: string) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile photo.');
      return;
    }
    setIsPickingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setForm(prev => prev ? { ...prev, photoUri: result.assets[0].uri } : prev);
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;

    if (!form.name.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!form.phone.trim()) { Alert.alert('Required', 'Please enter your phone number.'); return; }
    if (!form.brokerage.trim()) { Alert.alert('Required', 'Please enter your brokerage name.'); return; }
    if (!form.brokerageAddress.trim()) { Alert.alert('Required', 'Please enter your brokerage address.'); return; }
    if (!form.panelWidth) { Alert.alert('Required', 'Please select your default panel width.'); return; }
    if (!form.panelOrientation) { Alert.alert('Required', 'Please select your default panel orientation.'); return; }
    if (!form.postColour) { Alert.alert('Required', 'Please select your default post colour.'); return; }

    setIsSaving(true);
    try {
      let photoUrl: string | undefined = undefined;

      if (form.photoUri && isLocalUri(form.photoUri)) {
        photoUrl = await uploadProfilePhoto(user.id, form.photoUri);
      } else if (form.photoUri && form.photoUri !== user.profilePhotoUrl) {
        photoUrl = form.photoUri;
      }

      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        brokerage: form.brokerage.trim(),
        brokerageAddress: form.brokerageAddress.trim(),
        defaultPanelWidth: form.panelWidth as PanelWidth,
        defaultPanelOrientation: form.panelOrientation as PanelOrientation,
        defaultPostColour: form.postColour as PostColour,
        ...(photoUrl !== undefined && { profilePhotoUrl: photoUrl }),
      });

      setIsEditing(false);
      setForm(null);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing && form) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={BrandColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ProfileForm
              values={form}
              onChange={handleChange}
              onPanelWidthChange={v => setForm(prev => prev ? { ...prev, panelWidth: v } : prev)}
              onPanelOrientationChange={v => setForm(prev => prev ? { ...prev, panelOrientation: v } : prev)}
              onPostColourChange={v => setForm(prev => prev ? { ...prev, postColour: v } : prev)}
              onPickPhoto={handlePickPhoto}
              isPickingPhoto={isPickingPhoto}
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} activeOpacity={0.75}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  const accountRows: { icon: string; label: string; value: string }[] = [
    { icon: 'mail-outline',       label: 'Email',             value: user.email },
    ...(user.phone           ? [{ icon: 'call-outline',      label: 'Phone',             value: user.phone }]           : []),
    ...(user.brokerage       ? [{ icon: 'business-outline',  label: 'Brokerage',          value: user.brokerage }]       : []),
    ...(user.brokerageAddress ? [{ icon: 'location-outline', label: 'Brokerage Address', value: user.brokerageAddress }] : []),
  ];

  const prefRows: { icon: string; label: string; value: string }[] = [
    ...(user.defaultPanelWidth       ? [{ icon: 'resize-outline',           label: 'Default Panel Width',       value: PANEL_LABELS[user.defaultPanelWidth] ?? user.defaultPanelWidth }] : []),
    ...(user.defaultPanelOrientation ? [{ icon: 'phone-portrait-outline',   label: 'Default Panel Orientation', value: user.defaultPanelOrientation.charAt(0).toUpperCase() + user.defaultPanelOrientation.slice(1) }] : []),
    ...(user.defaultPostColour       ? [{ icon: 'color-palette-outline',    label: 'Default Post Colour',       value: user.defaultPostColour.charAt(0).toUpperCase() + user.defaultPostColour.slice(1) }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Avatar + edit button */}
        <View style={styles.avatarSection}>
          {user.profilePhotoUrl ? (
            <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarPhoto} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.role === 'admin' ? 'Admin' : 'Agent'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={enterEdit} activeOpacity={0.8}>
            <Ionicons name="pencil-outline" size={16} color={BrandColors.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Panel metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricTile, user.panelCount <= 3 && styles.metricTileLow]}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="layers" size={20} color={user.panelCount <= 3 ? BrandColors.error : BrandColors.primary} />
            </View>
            <Text style={[styles.metricCount, user.panelCount <= 3 && styles.metricCountLow]}>
              {user.panelCount}
            </Text>
            <Text style={styles.metricLabel}>In Storage</Text>
            <Text style={styles.metricSub}>At our facility</Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="location" size={20} color={BrandColors.success} />
            </View>
            <Text style={[styles.metricCount, { color: BrandColors.success }]}>
              {liveCount}
            </Text>
            <Text style={styles.metricLabel}>Live</Text>
            <Text style={styles.metricSub}>Currently installed</Text>
          </View>
        </View>

        {user.panelCount <= 3 && (
          <View style={styles.alert}>
            <Ionicons name="warning-outline" size={16} color={BrandColors.warning} />
            <Text style={styles.alertText}>Low panel inventory — contact the operator to restock.</Text>
          </View>
        )}

        {/* Account info */}
        <Text style={styles.sectionLabel}>Account Info</Text>
        <View style={styles.card}>
          {accountRows.map((r, i) => (
            <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} last={i === accountRows.length - 1} />
          ))}
        </View>

        {/* Sign preferences */}
        {prefRows.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Sign Preferences</Text>
            <View style={styles.card}>
              {prefRows.map((r, i) => (
                <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} last={i === prefRows.length - 1} />
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  flex: { flex: 1 },
  container: { padding: 20 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: BrandColors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },
  userEmail: { fontSize: 14, color: BrandColors.textSecondary, marginTop: 2 },
  badgeRow: { marginTop: 8, marginBottom: 12 },
  badge: {
    backgroundColor: BrandColors.primary + '18',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: BrandColors.primary },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BrandColors.primary + '40',
    backgroundColor: BrandColors.primary + '08',
  },
  editProfileText: { fontSize: 13, fontWeight: '600', color: BrandColors.primary },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.primary + '28',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricTileLow: {
    borderColor: BrandColors.error + '50',
    backgroundColor: '#FFF5F5',
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BrandColors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricCount: {
    fontSize: 36,
    fontWeight: '800',
    color: BrandColors.primary,
    lineHeight: 40,
  },
  metricCountLow: { color: BrandColors.error },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: BrandColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400E' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: BrandColors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: BrandColors.textSecondary },
  rowValue: { fontSize: 15, color: BrandColors.textPrimary, fontWeight: '500', marginTop: 1 },

  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  editTitle: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },

  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: BrandColors.textSecondary },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.error + '40',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: BrandColors.error },
});
