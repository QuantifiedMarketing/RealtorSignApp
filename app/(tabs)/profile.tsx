import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={17} color={BrandColors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={56} color={BrandColors.border} />
          <Text style={styles.emptyTitle}>Profile unavailable</Text>
          <Text style={styles.emptySub}>Could not load your profile. Please sign out and sign in again.</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const infoRows: { icon: string; label: string; value: string }[] = [
    { icon: 'mail-outline',     label: 'Email',     value: user.email },
    ...(user.brokerage ? [{ icon: 'business-outline', label: 'Brokerage', value: user.brokerage }] : []),
    ...(user.phone     ? [{ icon: 'call-outline',     label: 'Phone',     value: user.phone }]     : []),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role === 'admin' ? 'Admin' : 'Agent'}</Text>
          </View>
        </View>

        <View style={styles.placardCard}>
          <View style={styles.placardLeft}>
            <View style={styles.placardIconWrap}>
              <Ionicons name="layers" size={24} color={BrandColors.primary} />
            </View>
            <View>
              <Text style={styles.placardLabel}>Your Placard Count</Text>
              <Text style={styles.placardSub}>Available at our facility</Text>
            </View>
          </View>
          <Text style={[styles.placardCount, user.placardCount <= 3 && styles.placardCountLow]}>
            {user.placardCount}
          </Text>
        </View>

        {user.placardCount <= 3 && (
          <View style={styles.alert}>
            <Ionicons name="warning-outline" size={16} color={BrandColors.warning} />
            <Text style={styles.alertText}>Low placard count — contact the operator to restock.</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Account Info</Text>
        <View style={styles.card}>
          {infoRows.map((r, i) => (
            <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} last={i === infoRows.length - 1} />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  container: { padding: 20 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: BrandColors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },
  userEmail: { fontSize: 14, color: BrandColors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: BrandColors.primary + '18',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: BrandColors.primary },

  placardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: BrandColors.primary + '28',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  placardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: BrandColors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placardLabel: { fontSize: 15, fontWeight: '600', color: BrandColors.textPrimary },
  placardSub: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },
  placardCount: { fontSize: 38, fontWeight: '800', color: BrandColors.primary },
  placardCountLow: { color: BrandColors.error },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400E' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
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
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: BrandColors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: BrandColors.textSecondary },
  rowValue: { fontSize: 15, color: BrandColors.textPrimary, fontWeight: '500', marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.error + '40',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: BrandColors.error },
});
