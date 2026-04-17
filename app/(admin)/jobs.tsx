import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

const FILTERS = ['All', 'Pending', 'Active', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];

export default function AdminJobsScreen() {
  const [filter, setFilter] = useState<Filter>('All');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.title}>All Jobs</Text>
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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={52} color={BrandColors.border} />
          <Text style={styles.emptyTitle}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}jobs</Text>
          <Text style={styles.emptySub}>Jobs will appear here once submitted by agents</Text>
        </View>
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
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 12,
    textTransform: 'capitalize',
  },
  emptySub: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
