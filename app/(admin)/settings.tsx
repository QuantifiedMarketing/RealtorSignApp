import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { BrandColors } from '@/constants/theme';

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={17} color={BrandColors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={BrandColors.textSecondary} />
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function AdminSettingsScreen() {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Section title="Scheduling">
          <SettingsRow
            icon="calendar-outline"
            label="Available Dates"
            subtitle="Choose which dates agents can book"
          />
          <SettingsRow
            icon="ban-outline"
            label="Blackout Dates"
            subtitle="Block out unavailable dates"
          />
        </Section>

        <Section title="Agents & Inventory">
          <SettingsRow
            icon="people-outline"
            label="Manage Agents"
            subtitle="View profiles and panel counts"
          />
          <SettingsRow
            icon="layers-outline"
            label="Panel Inventory"
            subtitle="Adjust panel counts per agent"
          />
          <SettingsRow
            icon="alert-circle-outline"
            label="Low Stock Threshold"
            subtitle="Alert when count falls below this number"
          />
        </Section>

        <Section title="Notifications">
          <SettingsRow
            icon="notifications-outline"
            label="Push Notifications"
            subtitle="Configure operator alert preferences"
          />
          <SettingsRow
            icon="mail-outline"
            label="30-Day Reminders"
            subtitle="Auto-remind agents about long-standing signs"
          />
        </Section>

        <Section title="Payments">
          <SettingsRow
            icon="card-outline"
            label="Stripe Configuration"
            subtitle="Connect and manage Stripe account"
          />
          <SettingsRow
            icon="pricetag-outline"
            label="Pricing"
            subtitle="Set install and removal fees"
          />
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={BrandColors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  topBar: {
    backgroundColor: BrandColors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  container: { padding: 20 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: BrandColors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: BrandColors.textPrimary, fontWeight: '500' },
  rowSub: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.error + '40',
    gap: 8,
    marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: BrandColors.error },
});
