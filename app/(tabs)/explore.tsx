import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Job, JobStatus, useJobs } from '@/context/jobs';
import { BrandColors } from '@/constants/theme';

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E', bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46', bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Requested', color: '#5B21B6', bg: '#EDE9FE' },
};

function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function JobCard({ job }: { job: Job }) {
  const s = STATUS[job.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardAddress}>
          <Ionicons name="location" size={14} color={BrandColors.primary} style={styles.addrIcon} />
          <Text style={styles.addrText} numberOfLines={2}>{job.address}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={BrandColors.textSecondary} />
          <Text style={styles.metaText}>
            Preferred: {job.preferredDate.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={BrandColors.textSecondary} />
          <Text style={styles.metaText}>Submitted {relativeTime(job.submittedAt)}</Text>
        </View>
      </View>

      {job.notes ? (
        <View style={styles.notesRow}>
          <Ionicons name="document-text-outline" size={13} color={BrandColors.textSecondary} />
          <Text style={styles.notesText} numberOfLines={1}>{job.notes}</Text>
        </View>
      ) : null}

      {job.status === 'completed' && (
        <TouchableOpacity style={styles.takedownBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-undo-outline" size={14} color={BrandColors.primary} />
          <Text style={styles.takedownText}>Request Takedown</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MyJobsScreen() {
  const { user } = useAuth();
  const { getJobsByAgent } = useJobs();
  const jobs = user ? getJobsByAgent(user.id) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.subtitle}>{jobs.length} total</Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={56} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptySub}>
              Your submitted jobs will appear here once you request an installation.
            </Text>
            <TouchableOpacity
              style={styles.submitCta}
              onPress={() => router.push('/submit-job')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.submitCtaText}>Submit Your First Job</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: BrandColors.textPrimary },
  subtitle: { fontSize: 13, color: BrandColors.textSecondary },

  list: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },

  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  cardAddress: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  addrIcon: { marginTop: 2 },
  addrText: { flex: 1, fontSize: 15, fontWeight: '600', color: BrandColors.textPrimary, lineHeight: 20 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardMeta: { gap: 4, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: BrandColors.textSecondary },

  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  notesText: { flex: 1, fontSize: 12, color: BrandColors.textSecondary, fontStyle: 'italic' },

  takedownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  takedownText: { fontSize: 13, fontWeight: '600', color: BrandColors.primary },

  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: BrandColors.textPrimary, marginTop: 16 },
  emptySub: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  submitCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  submitCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
