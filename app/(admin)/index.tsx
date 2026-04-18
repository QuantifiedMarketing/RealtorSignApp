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

function RecentJobRow({ job }: { job: Job }) {
  const s = STATUS_BADGE[job.status];
  return (
    <TouchableOpacity
      style={styles.recentRow}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/job-detail', params: { id: job.id } })}
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

  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const activeCount = jobs.filter(j => j.status === 'active' || j.status === 'takedown_requested').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const agentCount = new Set(jobs.map(j => j.agentId)).size;

  const recent = jobs.slice(0, 5);

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
          <StatCard icon="time-outline"            label="Pending"      value={pendingCount}   color={BrandColors.accent} />
          <StatCard icon="location-outline"        label="Active Signs" value={activeCount}    color={BrandColors.success} />
          <StatCard icon="people-outline"          label="Agents"       value={agentCount}     color={BrandColors.primary} />
          <StatCard icon="checkmark-circle-outline" label="Completed"   value={completedCount} color={BrandColors.textSecondary} />
        </View>

        <Text style={styles.sectionLabel}>Recent Submissions</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={52} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>No submissions yet</Text>
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
