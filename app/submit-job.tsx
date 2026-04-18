import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AddressAutocomplete, { PlaceResult } from '@/components/address-autocomplete';
import MapPinSelector, { Coords } from '@/components/map-pin-selector';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useJobs } from '@/context/jobs';

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon as any} size={15} color={BrandColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function SubmitJobScreen() {
  const { user } = useAuth();
  const { submitJob } = useJobs();

  const [address, setAddress] = useState('');
  const [date, setDate] = useState<Date>(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'web');
  const [notes, setNotes] = useState('');
  const [pinCoords, setPinCoords] = useState<Coords | null>(null);
  // Separate state drives map centering without overwriting a manually-placed pin
  const [mapCenter, setMapCenter] = useState<Coords | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const handlePlaceSelect = (result: PlaceResult) => {
    setAddress(result.address);
    if (result.coords.latitude !== 0 || result.coords.longitude !== 0) {
      setPinCoords(result.coords);
      setMapCenter(result.coords);
    }
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please select a property address.');
      return;
    }
    if (!pinCoords) {
      Alert.alert('Pin Required', 'Please place a pin on the map to mark the exact sign location.');
      return;
    }
    setSubmitting(true);
    try {
      await submitJob(
        { address, preferredDate: date, notes, pinCoords },
        user!.id,
        user!.name,
      );
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Job Submitted!</Text>
          <Text style={styles.successSub}>
            Your installation request has been received.{'\n'}
            You'll get a push notification once it's complete.
          </Text>
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Ionicons name="location-outline" size={16} color={BrandColors.textSecondary} />
              <Text style={styles.successRowText} numberOfLines={2}>{address}</Text>
            </View>
            <View style={styles.successRow}>
              <Ionicons name="calendar-outline" size={16} color={BrandColors.textSecondary} />
              <Text style={styles.successRowText}>{formatDate(date)}</Text>
            </View>
          </View>
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={[styles.successBtn, styles.successBtnSecondary]}
              onPress={() => router.replace('/(tabs)/')}
              activeOpacity={0.85}
            >
              <Text style={styles.successBtnSecondaryText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace('/(tabs)/explore')}
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase" size={16} color="#fff" />
              <Text style={styles.successBtnText}>View My Jobs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={BrandColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Job</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Address autocomplete — high zIndex so dropdown overlays form below */}
          <View style={styles.autocompleteSection}>
            <SectionHeader icon="location-outline" title="Property Address" />
            <AddressAutocomplete value={address} onSelect={handlePlaceSelect} />
          </View>

          {/* Date */}
          <SectionHeader icon="calendar-outline" title="Preferred Install Date" />
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker(v => !v)}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar" size={18} color={BrandColors.primary} />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <Ionicons
              name={showDatePicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={BrandColors.textSecondary}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={tomorrow()}
                onChange={onDateChange}
                style={Platform.OS === 'web' ? styles.webDatePicker : undefined}
              />
            </View>
          )}

          {/* Map */}
          <SectionHeader icon="pin-outline" title="Sign Placement" />
          <Text style={styles.mapHint}>
            {Platform.OS === 'web'
              ? 'Use the mobile app to drop a precise pin. Selecting an address fills the coordinates automatically.'
              : 'Select an address above to auto-place the pin, or tap the map directly. Drag to adjust.'}
          </Text>
          <MapPinSelector coords={pinCoords} onChange={setPinCoords} centerOn={mapCenter} />
          {!pinCoords && (
            <View style={styles.pinWarning}>
              <Ionicons name="information-circle-outline" size={14} color={BrandColors.accent} />
              <Text style={styles.pinWarningText}>Pin placement is required to submit.</Text>
            </View>
          )}

          {/* Notes */}
          <SectionHeader icon="document-text-outline" title="Notes" />
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={t => setNotes(t.slice(0, 500))}
            placeholder="Gate code, obstacles, HOA rules, sign size preference…"
            placeholderTextColor={BrandColors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{notes.length} / 500</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitBtnText}>Submitting…</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Job</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  headerSpacer: { width: 32 },

  form: { padding: 20, paddingBottom: 40 },

  // The autocomplete section needs a high zIndex so the dropdown overlays content below it
  autocompleteSection: { zIndex: 99 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: BrandColors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.textPrimary,
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
    backgroundColor: BrandColors.surface,
  },
  notesInput: { height: 100, paddingTop: 12 },
  charCount: {
    fontSize: 11,
    color: BrandColors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateText: { flex: 1, fontSize: 15, color: BrandColors.textPrimary, fontWeight: '500' },
  datePickerWrap: {
    marginTop: 8,
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
    backgroundColor: Platform.OS === 'ios' ? BrandColors.surface : 'transparent',
    borderRadius: Platform.OS === 'ios' ? 10 : 0,
    overflow: 'hidden',
  },
  webDatePicker: { height: 40 },

  mapHint: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  pinWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  pinWarningText: { fontSize: 12, color: BrandColors.accent, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 32,
    gap: 8,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success screen
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BrandColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: BrandColors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: { fontSize: 28, fontWeight: '800', color: BrandColors.textPrimary, marginBottom: 10 },
  successSub: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successRowText: { fontSize: 14, color: BrandColors.textPrimary, flex: 1 },
  successButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  successBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  successBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successBtnSecondaryText: { color: BrandColors.textPrimary, fontSize: 15, fontWeight: '600' },
});
