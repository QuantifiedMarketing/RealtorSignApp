import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

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
          <StatCard icon="time-outline" label="Pending" value={0} color={BrandColors.accent} />
          <StatCard
            icon="location-outline"
            label="Active Signs"
            value={0}
            color={BrandColors.success}
          />
          <StatCard
            icon="people-outline"
            label="Agents"
            value={0}
            color={BrandColors.primary}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={0}
            color={BrandColors.textSecondary}
          />
        </View>

        <Text style={styles.sectionLabel}>Recent Submissions</Text>
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={52} color={BrandColors.border} />
          <Text style={styles.emptyTitle}>No submissions yet</Text>
          <Text style={styles.emptySub}>New job requests will appear here</Text>
        </View>
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
  topBarLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 12,
  },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 4 },
});
