import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RecentJobRow({ job }: { job: Job }) {
  const s = STATUS_BADGE[job.status];
  return (
    <View style={styles.recentRow}>
      <View style={styles.recentLeft}>
        <Text style={styles.recentAddr} numberOfLines={1}>{job.address}</Text>
        <Text style={styles.recentDate}>
          {job.preferredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
      </View>
    </View>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const { getJobsByAgent } = useJobs();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const myJobs = user ? getJobsByAgent(user.id) : [];
  const activeCount = myJobs.filter(j => j.status === 'active').length;
  const pendingCount = myJobs.filter(j => j.status === 'pending').length;
  const recentJobs = myJobs.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="layers-outline"
            label="Placards"
            value={user?.placardCount ?? 0}
            color={BrandColors.primary}
          />
          <StatCard icon="location-outline" label="Active Signs" value={activeCount} color={BrandColors.success} />
          <StatCard icon="time-outline" label="Pending" value={pendingCount} color={BrandColors.accent} />
        </View>

        {(user?.placardCount ?? 0) <= 3 && (
          <View style={styles.alert}>
            <Ionicons name="warning-outline" size={18} color={BrandColors.warning} />
            <Text style={styles.alertText}>
              Low placard count — contact the operator to restock.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <TouchableOpacity style={styles.primaryAction} activeOpacity={0.88} onPress={() => router.push('/submit-job')}>
          <Ionicons name="add-circle" size={26} color="#fff" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Submit New Job</Text>
            <Text style={styles.actionSub}>Request sign installation</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Recent Jobs</Text>
        {recentJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={BrandColors.border} />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptySub}>Submit your first job to get started</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {recentJobs.map((job, i) => (
              <View key={job.id} style={i < recentJobs.length - 1 ? styles.recentDivider : undefined}>
                <RecentJobRow job={job} />
              </View>
            ))}
            {myJobs.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View all {myJobs.length} jobs</Text>
                <Ionicons name="chevron-forward" size={14} color={BrandColors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  container: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  greeting: { fontSize: 13, color: BrandColors.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: BrandColors.textPrimary },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: BrandColors.textPrimary },
  statLabel: { fontSize: 11, color: BrandColors.textSecondary, marginTop: 2 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400E' },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionText: { flex: 1 },
  actionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
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
  recentAddr: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  recentDate: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },
  recentDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  viewAllText: { fontSize: 13, fontWeight: '600', color: BrandColors.primary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
