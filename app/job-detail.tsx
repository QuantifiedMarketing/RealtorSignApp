import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';
import { JobStatus, useJobs } from '@/context/jobs';

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E',          bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46',          bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Requested', color: '#5B21B6',          bg: '#EDE9FE' },
};


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
  const { jobs } = useJobs();
  const { width: screenWidth } = useWindowDimensions();
  const photoWidth = screenWidth - 40;

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
            <Image
              source={{ uri: job.photoUri }}
              style={{
                width: photoWidth,
                height: (photoWidth / 4) * 3,
                borderRadius: 12,
                marginBottom: 24,
                backgroundColor: BrandColors.border,
              }}
              resizeMode="cover"
            />
          </>
        ) : null}

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
