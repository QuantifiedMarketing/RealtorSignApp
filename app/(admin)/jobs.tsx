import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors } from '@/constants/theme';
import { Job, JobStatus, useJobs } from '@/context/jobs';

const FILTERS = ['All', 'Pending', 'Active', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];

const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',            color: '#92400E', bg: '#FEF3C7' },
  active:             { label: 'Active',             color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',          color: '#065F46', bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Req.',      color: '#5B21B6', bg: '#EDE9FE' },
};

function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type NextAction = { label: string; nextStatus: JobStatus; icon: string } | null;

function nextAction(status: JobStatus): NextAction {
  if (status === 'pending') return { label: 'Mark Active', nextStatus: 'active', icon: 'play-circle-outline' };
  if (status === 'active') return { label: 'Mark Complete', nextStatus: 'completed', icon: 'checkmark-circle-outline' };
  if (status === 'takedown_requested') return { label: 'Mark Removed', nextStatus: 'completed', icon: 'checkmark-circle-outline' };
  return null;
}

function JobCard({ job, onUpdateStatus }: { job: Job; onUpdateStatus: (id: string, s: JobStatus) => void }) {
  const s = STATUS[job.status];
  const action = nextAction(job.status);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/job-detail', params: { id: job.id } })}
    >
      <View style={styles.cardTop}>
        <View style={styles.agentRow}>
          <Ionicons name="person-circle-outline" size={14} color={BrandColors.textSecondary} />
          <Text style={styles.agentText}>{job.agentName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.addrRow}>
        <Ionicons name="location" size={14} color={BrandColors.primary} style={styles.addrIcon} />
        <Text style={styles.addrText} numberOfLines={2}>{job.address}</Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={BrandColors.textSecondary} />
        <Text style={styles.metaText}>
          {job.preferredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Ionicons name="time-outline" size={13} color={BrandColors.textSecondary} />
        <Text style={styles.metaText}>{relativeTime(job.submittedAt)}</Text>
      </View>

      {job.notes ? (
        <View style={styles.notesRow}>
          <Ionicons name="document-text-outline" size={13} color={BrandColors.textSecondary} />
          <Text style={styles.notesText} numberOfLines={1}>{job.notes}</Text>
        </View>
      ) : null}

      {action && (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={e => { e.stopPropagation?.(); onUpdateStatus(job.id, action.nextStatus); }}
        >
          <Ionicons name={action.icon as any} size={15} color={BrandColors.primary} />
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function filterMatch(job: Job, filter: Filter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Pending') return job.status === 'pending';
  if (filter === 'Active') return job.status === 'active' || job.status === 'takedown_requested';
  if (filter === 'Completed') return job.status === 'completed';
  return true;
}

export default function AdminJobsScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const { jobs, updateStatus } = useJobs();
  const filtered = jobs.filter(j => filterMatch(j, filter));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.title}>All Jobs</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{jobs.length}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={j => j.id}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <JobCard job={item} onUpdateStatus={updateStatus} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={52} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>
              No {filter === 'All' ? '' : filter.toLowerCase() + ' '}jobs
            </Text>
            <Text style={styles.emptySub}>Jobs will appear here once submitted by agents</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BrandColors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BrandColors.background,
  },
  filterTabActive: { backgroundColor: BrandColors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: BrandColors.textSecondary },
  filterTextActive: { color: '#fff' },

  list: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 12,
    textTransform: 'capitalize',
  },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 4, textAlign: 'center' },

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
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agentText: { fontSize: 13, fontWeight: '600', color: BrandColors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 8 },
  addrIcon: { marginTop: 2 },
  addrText: { flex: 1, fontSize: 15, fontWeight: '600', color: BrandColors.textPrimary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { fontSize: 12, color: BrandColors.textSecondary },
  metaDot: { fontSize: 12, color: BrandColors.textSecondary },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
    marginTop: 4,
  },
  notesText: { flex: 1, fontSize: 12, color: BrandColors.textSecondary, fontStyle: 'italic' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: BrandColors.primary },
});
