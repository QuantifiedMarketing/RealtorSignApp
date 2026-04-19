import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import type { PanelWidth, PostColour, PanelOrientation } from '@/context/auth';
import { ProfileForm } from '@/components/profile-form';
import type { ProfileFormValues, ProfileFormField } from '@/components/profile-form';
import { uploadProfilePhoto, isLocalUri } from '@/lib/image-utils';
import { BrandColors } from '@/constants/theme';

export default function CompleteProfileScreen() {
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState<ProfileFormValues>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    brokerage: user?.brokerage ?? '',
    brokerageAddress: user?.brokerageAddress ?? '',
    panelWidth: user?.defaultPanelWidth ?? '',
    panelOrientation: user?.defaultPanelOrientation ?? '',
    postColour: user?.defaultPostColour ?? '',
    photoUri: user?.profilePhotoUrl ?? '',
  });
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: ProfileFormField, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
        setForm(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number.');
      return;
    }
    if (!form.brokerage.trim()) {
      Alert.alert('Required', 'Please enter your brokerage name.');
      return;
    }
    if (!form.brokerageAddress.trim()) {
      Alert.alert('Required', 'Please enter your brokerage address.');
      return;
    }
    if (!form.panelWidth) {
      Alert.alert('Required', 'Please select your default panel width.');
      return;
    }
    if (!form.panelOrientation) {
      Alert.alert('Required', 'Please select your default panel orientation.');
      return;
    }
    if (!form.postColour) {
      Alert.alert('Required', 'Please select your default post colour.');
      return;
    }

    setIsSaving(true);
    try {
      let photoUrl = form.photoUri && !isLocalUri(form.photoUri) ? form.photoUri : undefined;

      if (form.photoUri && isLocalUri(form.photoUri) && user) {
        photoUrl = await uploadProfilePhoto(user.id, form.photoUri);
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

      router.replace('/(tabs)/');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-circle-outline" size={36} color={BrandColors.primary} />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Before accessing your dashboard, please fill in your contact and sign preferences.
            </Text>
          </View>

          <ProfileForm
            values={form}
            onChange={handleChange}
            onPanelWidthChange={v => setForm(prev => ({ ...prev, panelWidth: v }))}
            onPanelOrientationChange={v => setForm(prev => ({ ...prev, panelOrientation: v }))}
            onPostColourChange={v => setForm(prev => ({ ...prev, postColour: v }))}
            onPickPhoto={handlePickPhoto}
            isPickingPhoto={isPickingPhoto}
          />

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save & Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 28 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandColors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
});
