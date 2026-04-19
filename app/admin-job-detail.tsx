import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { supabase } from '@/lib/supabase';
import { uploadJobPhoto } from '@/lib/image-utils';
import { sendInstallationNotification } from '@/lib/notifications';
import { BrandColors } from '@/constants/theme';
import { JobStatus, useJobs } from '@/context/jobs';

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E',          bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46',          bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Requested', color: '#5B21B6',          bg: '#EDE9FE' },
};

const PANEL_LABEL: Record<string, string> = {
  up_to_24_inches: 'Up to 24 inches',
  over_24_inches:  'Over 24 inches',
};

const PANEL_ORIENTATION_LABEL: Record<string, string> = {
  portrait:  'Portrait',
  landscape: 'Landscape',
};

const POST_COLOUR_LABEL: Record<string, string> = {
  black: 'Black',
  white: 'White',
};

interface AgentProfile {
  id: string;
  phone?: string;
  brokerage?: string;
  brokerageAddress?: string;
  defaultPanelWidth?: string;
  defaultPanelOrientation?: string;
  defaultPostColour?: string;
  pushToken?: string;
}

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

export default function AdminJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, updateStatus, setJobPhoto } = useJobs();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const job = jobs.find(j => j.id === id);

  useEffect(() => {
    if (!job) return;
    supabase
      .from('users')
      .select('id, phone, brokerage, brokerage_address, default_panel_width, default_panel_orientation, default_post_colour, push_token')
      .eq('id', job.agentId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAgentProfile({
            id: data.id,
            phone: data.phone ?? undefined,
            brokerage: data.brokerage ?? undefined,
            brokerageAddress: data.brokerage_address ?? undefined,
            defaultPanelWidth: data.default_panel_width ?? undefined,
            defaultPanelOrientation: data.default_panel_orientation ?? undefined,
            defaultPostColour: data.default_post_colour ?? undefined,
            pushToken: data.push_token ?? undefined,
          });
        }
      });
  }, [job?.agentId]);

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

  const openInMaps = () => {
    if (!job.pinCoords) return;
    const { latitude, longitude } = job.pinCoords;
    const url = Platform.select({
      ios:     `maps:?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}`,
      default: `https://maps.google.com/?q=${latitude},${longitude}`,
    })!;
    Linking.openURL(url);
  };

  const completeJob = async (isRemoval: boolean) => {
    if (Platform.OS === 'web') {
      await updateStatus(job.id, 'completed');
      router.back();
      return;
    }

    const title   = isRemoval ? 'Upload Removal Photo'     : 'Upload Completion Photo';
    const message = isRemoval
      ? 'Add a photo to confirm the sign was removed.'
      : 'Add a photo to confirm the sign was installed.';

    const finish = async (uri: string | null) => {
      let publicUrl: string | undefined;

      if (uri) {
        setIsUploading(true);
        try {
          publicUrl = await uploadJobPhoto(job.id, uri);
          await setJobPhoto(job.id, publicUrl);
        } catch {
          Alert.alert(
            'Upload Failed',
            'The photo could not be saved. The job will be marked complete without a photo.',
          );
          publicUrl = undefined;
        } finally {
          setIsUploading(false);
        }
      }

      await updateStatus(job.id, 'completed');

      // Notify the agent if they have a push token and this is an installation
      if (!isRemoval && agentProfile?.pushToken) {
        try {
          await sendInstallationNotification(agentProfile.pushToken, job.address, job.id, publicUrl);
        } catch {
          // Notification failure is non-fatal
        }
      }

      router.back();
    };

    Alert.alert(title, message, [
      { text: 'Take Photo',           onPress: async () => finish(await pickPhoto('camera'))  },
      { text: 'Choose from Library',  onPress: async () => finish(await pickPhoto('library')) },
      { text: 'Skip', style: 'cancel', onPress: () => finish(null) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadOverlayText}>Uploading photo…</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Job Detail</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Status + address + agent */}
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

        {/* Job details */}
        <Text style={styles.sectionLabel}>Job Details</Text>
        <View style={styles.detailCard}>
          <DetailRow
            icon="calendar-outline"
            label="Preferred Date"
            value={job.preferredDate.toLocaleDateString('en-CA', {
              weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
            })}
          />
          <DetailRow
            icon="time-outline"
            label="Submitted"
            value={job.submittedAt.toLocaleString('en-CA', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          />
          <DetailRow
            icon="document-text-outline"
            label="Notes"
            value={job.notes || 'None'}
            last
          />
        </View>

        {/* Agent profile details */}
        <Text style={styles.sectionLabel}>Agent Preferences</Text>
        <View style={styles.detailCard}>
          {agentProfile?.brokerage ? (
            <DetailRow icon="business-outline" label="Brokerage" value={agentProfile.brokerage} />
          ) : null}
          {agentProfile?.brokerageAddress ? (
            <DetailRow icon="location-outline" label="Brokerage Address" value={agentProfile.brokerageAddress} />
          ) : null}
          <DetailRow
            icon="resize-outline"
            label="Default Panel Width"
            value={agentProfile?.defaultPanelWidth
              ? PANEL_LABEL[agentProfile.defaultPanelWidth] ?? agentProfile.defaultPanelWidth
              : 'Not set'}
          />
          <DetailRow
            icon="phone-portrait-outline"
            label="Default Panel Orientation"
            value={agentProfile?.defaultPanelOrientation
              ? PANEL_ORIENTATION_LABEL[agentProfile.defaultPanelOrientation] ?? agentProfile.defaultPanelOrientation
              : 'Not set'}
          />
          <DetailRow
            icon="color-palette-outline"
            label="Default Post Colour"
            value={agentProfile?.defaultPostColour
              ? POST_COLOUR_LABEL[agentProfile.defaultPostColour] ?? agentProfile.defaultPostColour
              : 'Not set'}
            last
          />
        </View>

        {/* Sign placement + map link */}
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
            <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={16} color={BrandColors.primary} />
              <Text style={styles.mapsBtnText}>Open in Maps</Text>
              <Ionicons name="open-outline" size={14} color={BrandColors.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* Completion photo */}
        {job.photoUri ? (
          <>
            <Text style={styles.sectionLabel}>Completion Photo</Text>
            <Image source={{ uri: job.photoUri }} style={styles.photo} resizeMode="cover" />
          </>
        ) : null}

        {/* Workflow action buttons */}
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

  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: BrandColors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: -18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: BrandColors.primary + '30',
  },
  mapsBtnText: { fontSize: 14, fontWeight: '600', color: BrandColors.primary },

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

  uploadOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  uploadOverlayText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
