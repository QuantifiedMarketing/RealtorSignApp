import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Job, JobStatus, useJobs } from '@/context/jobs';
import { BrandColors } from '@/constants/theme';

const STATUS_BADGE: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pending',       color: '#92400E', bg: '#FEF3C7' },
  active:             { label: 'Active',        color: BrandColors.primary, bg: '#DBEAFE' },
  completed:          { label: 'Completed',     color: '#065F46', bg: '#D1FAE5' },
  takedown_requested: { label: 'Takedown Req.', color: '#5B21B6', bg: '#EDE9FE' },
};

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PendingJobRow({ job }: { job: Job }) {
  return (
    <TouchableOpacity
      style={styles.pendingRow}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/admin-job-detail', params: { id: job.id } })}
    >
      <View style={styles.pendingDot} />
      <View style={styles.pendingContent}>
        <Text style={styles.pendingAddr} numberOfLines={1}>{job.address}</Text>
        <Text style={styles.pendingAgent}>{job.agentName}</Text>
      </View>
      <View style={styles.pendingRight}>
        <Text style={styles.pendingDate}>
          {job.preferredDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={BrandColors.accent} />
      </View>
    </TouchableOpacity>
  );
}

function RecentJobRow({ job }: { job: Job }) {
  const s = STATUS_BADGE[job.status];
  return (
    <TouchableOpacity
      style={styles.recentRow}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/admin-job-detail', params: { id: job.id } })}
    >
      <View style={styles.recentLeft}>
        <Text style={styles.recentAddr} numberOfLines={1}>{job.address}</Text>
        <Text style={styles.recentAgent}>{job.agentName}</Text>
      </View>
      <View style={styles.recentRight}>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={BrandColors.textSecondary} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { jobs } = useJobs();

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const activeCount = jobs.filter(j => j.status === 'active' || j.status === 'takedown_requested').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const agentCount = new Set(jobs.map(j => j.agentId)).size;

  const nonPending = jobs.filter(j => j.status !== 'pending');
  const recent = nonPending.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarLabel}>Admin Panel</Text>
          <Text style={styles.topBarName}>{user?.name}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={13} color={BrandColors.accent} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="time-outline"             label="Pending"      value={pendingJobs.length} color={BrandColors.accent} />
          <StatCard icon="location-outline"         label="Active Signs" value={activeCount}         color={BrandColors.success} />
          <StatCard icon="people-outline"           label="Agents"       value={agentCount}          color={BrandColors.primary} />
          <StatCard icon="checkmark-circle-outline" label="Completed"    value={completedCount}      color={BrandColors.textSecondary} />
        </View>

        {pendingJobs.length > 0 && (
          <>
            <View style={styles.attentionHeader}>
              <View style={styles.attentionTitleRow}>
                <View style={styles.attentionDotLarge} />
                <Text style={styles.attentionTitle}>Needs Attention</Text>
                <View style={styles.attentionCount}>
                  <Text style={styles.attentionCountText}>{pendingJobs.length}</Text>
                </View>
              </View>
              <Text style={styles.attentionSub}>Pending jobs waiting for installation</Text>
            </View>
            <View style={styles.attentionCard}>
              {pendingJobs.map((job, i) => (
                <View key={job.id} style={i < pendingJobs.length - 1 ? styles.pendingDivider : undefined}>
                  <PendingJobRow job={job} />
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, pendingJobs.length > 0 && { marginTop: 20 }]}>Recent Activity</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={52} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySub}>New job requests will appear here</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {recent.map((job, i) => (
              <View key={job.id} style={i < recent.length - 1 ? styles.recentDivider : undefined}>
                <RecentJobRow job={job} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BrandColors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBarLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 },
  topBarName: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  adminBadgeText: { color: BrandColors.accent, fontSize: 12, fontWeight: '700' },
  container: { padding: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: BrandColors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },

  attentionHeader: { marginBottom: 10 },
  attentionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  attentionDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.accent,
  },
  attentionTitle: { fontSize: 14, fontWeight: '700', color: BrandColors.textPrimary },
  attentionCount: {
    backgroundColor: BrandColors.accent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  attentionCountText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  attentionSub: { fontSize: 12, color: BrandColors.textSecondary, marginLeft: 18 },

  attentionCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: BrandColors.accent + '40',
    shadowColor: BrandColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.accent,
    flexShrink: 0,
  },
  pendingContent: { flex: 1 },
  pendingAddr: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  pendingAgent: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },
  pendingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingDate: { fontSize: 12, fontWeight: '600', color: BrandColors.accent },
  pendingDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },

  recentCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  recentLeft: { flex: 1 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron: { marginLeft: 2 },
  recentAddr: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  recentAgent: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },
  recentDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: BrandColors.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 4 },
});
