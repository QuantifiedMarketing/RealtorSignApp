import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Job, JobStatus, useJobs } from '@/context/jobs';
import { BrandColors } from '@/constants/theme';

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E',          bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46',          bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Requested', color: '#5B21B6',          bg: '#EDE9FE' },
};

function JobCard({ job }: { job: Job }) {
  const s = STATUS[job.status];
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/job-detail', params: { id: job.id } })}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardAddress}>
          <Ionicons name="location" size={14} color={BrandColors.primary} style={styles.addrIcon} />
          <Text style={styles.addrText} numberOfLines={2}>{job.address}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={BrandColors.textSecondary} />
        <Text style={styles.metaText}>
          {job.preferredDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FilteredJobsScreen() {
  const { filter, title } = useLocalSearchParams<{ filter: JobStatus; title: string }>();
  const { user } = useAuth();
  const { getJobsByAgent } = useJobs();

  const allJobs = user ? getJobsByAgent(user.id) : [];
  const jobs = allJobs.filter(j => j.status === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{jobs.length}</Text>
        </View>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={52} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>No {title} jobs</Text>
            <Text style={styles.emptySub}>Nothing here right now — check back later.</Text>
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
    alignItems: 'center',
    backgroundColor: BrandColors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  headerCountText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  list: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emptyState: { alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: BrandColors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 6, textAlign: 'center' },

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
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: BrandColors.textSecondary },
});
