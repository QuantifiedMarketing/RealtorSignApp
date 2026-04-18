import React from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors } from '@/constants/theme';
import { JobStatus, useJobs } from '@/context/jobs';

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E',          bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46',          bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Requested', color: '#5B21B6',          bg: '#EDE9FE' },
};

async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    return result.canceled ? null : result.assets[0].uri;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Photo library access is needed.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
  });
  return result.canceled ? null : result.assets[0].uri;
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailDivider]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={16} color={BrandColors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, updateStatus, setJobPhoto } = useJobs();

  const job = jobs.find(j => j.id === id);

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const s = STATUS[job.status];

  const completeJob = async (isRemoval: boolean) => {
    const title = isRemoval ? 'Upload Removal Photo' : 'Upload Completion Photo';
    const message = isRemoval
      ? 'Add a photo to confirm the sign was removed.'
      : 'Add a photo to confirm the sign was installed.';

    if (Platform.OS === 'web') {
      // Web: skip camera option, go straight to complete
      updateStatus(job.id, 'completed');
      router.back();
      return;
    }

    Alert.alert(title, message, [
      {
        text: 'Take Photo',
        onPress: async () => {
          const uri = await pickPhoto('camera');
          if (uri) setJobPhoto(job.id, uri);
          updateStatus(job.id, 'completed');
          router.back();
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const uri = await pickPhoto('library');
          if (uri) setJobPhoto(job.id, uri);
          updateStatus(job.id, 'completed');
          router.back();
        },
      },
      {
        text: 'Skip',
        style: 'cancel',
        onPress: () => {
          updateStatus(job.id, 'completed');
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Job Detail</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Top card: status + address + agent */}
        <View style={styles.topCard}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
          <Text style={styles.address}>{job.address}</Text>
          <View style={styles.agentRow}>
            <Ionicons name="person-circle-outline" size={15} color={BrandColors.textSecondary} />
            <Text style={styles.agentText}>{job.agentName}</Text>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailCard}>
          <DetailRow
            icon="calendar-outline"
            label="Preferred Date"
            value={job.preferredDate.toLocaleDateString('en-US', {
              weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
            })}
          />
          <DetailRow
            icon="time-outline"
            label="Submitted"
            value={job.submittedAt.toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          />
          {job.notes ? (
            <DetailRow icon="document-text-outline" label="Notes" value={job.notes} last />
          ) : (
            <DetailRow icon="document-text-outline" label="Notes" value="None" last />
          )}
        </View>

        {/* Pin coordinates */}
        {job.pinCoords && (
          <>
            <Text style={styles.sectionLabel}>Sign Placement</Text>
            <View style={styles.detailCard}>
              <DetailRow
                icon="location-outline"
                label="Coordinates"
                value={`${job.pinCoords.latitude.toFixed(5)}, ${job.pinCoords.longitude.toFixed(5)}`}
                last
              />
            </View>
          </>
        )}

        {/* Completion photo */}
        {job.photoUri ? (
          <>
            <Text style={styles.sectionLabel}>Completion Photo</Text>
            <Image source={{ uri: job.photoUri }} style={styles.photo} resizeMode="cover" />
          </>
        ) : null}

        {/* Action buttons */}
        {job.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: BrandColors.primary }]}
            onPress={() => updateStatus(job.id, 'active')}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Active</Text>
          </TouchableOpacity>
        )}

        {job.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: BrandColors.success }]}
            onPress={() => completeJob(false)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {job.status === 'takedown_requested' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
            onPress={() => completeJob(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Mark Sign Removed</Text>
          </TouchableOpacity>
        )}

        {job.status === 'completed' && !job.photoUri && (
          <View style={styles.noPhotoNote}>
            <Ionicons name="image-outline" size={16} color={BrandColors.textSecondary} />
            <Text style={styles.noPhotoText}>No completion photo on file.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: { width: 32 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: BrandColors.textSecondary },

  container: { padding: 20, paddingBottom: 48 },

  topCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  address: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agentText: { fontSize: 13, color: BrandColors.textSecondary, fontWeight: '500' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  detailCard: {
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
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BrandColors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  detailValue: { fontSize: 14, color: BrandColors.textPrimary, lineHeight: 20 },

  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 24,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    marginTop: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  noPhotoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: BrandColors.surface,
    borderRadius: 10,
    marginTop: 8,
  },
  noPhotoText: { fontSize: 13, color: BrandColors.textSecondary },
});
