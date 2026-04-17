// Web fallback — react-native-maps is not supported on web.
// centerOn prop is accepted but ignored (coordinates update via the inputs below).
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

export interface Coords {
  latitude: number;
  longitude: number;
}

interface Props {
  coords: Coords | null;
  onChange: (coords: Coords) => void;
  centerOn?: Coords | null;
}

export default function MapPinSelector({ coords, onChange }: Props) {
  const update = (field: 'latitude' | 'longitude', raw: string) => {
    const n = parseFloat(raw);
    if (isNaN(n)) return;
    onChange({
      latitude: field === 'latitude' ? n : (coords?.latitude ?? 0),
      longitude: field === 'longitude' ? n : (coords?.longitude ?? 0),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="map-outline" size={26} color={BrandColors.primary} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Interactive map available on mobile</Text>
          <Text style={styles.bannerSub}>
            Open in Expo Go to drop a pin. When you select an address above the coordinates
            are filled in automatically.
          </Text>
        </View>
      </View>
      <View style={styles.inputs}>
        <View style={styles.field}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 37.7749"
            placeholderTextColor={BrandColors.textSecondary}
            value={coords?.latitude?.toString() ?? ''}
            onChangeText={v => update('latitude', v)}
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. -122.4194"
            placeholderTextColor={BrandColors.textSecondary}
            value={coords?.longitude?.toString() ?? ''}
            onChangeText={v => update('longitude', v)}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    overflow: 'hidden',
    backgroundColor: BrandColors.surface,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: BrandColors.primary + '0D',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: BrandColors.textPrimary },
  bannerSub: { fontSize: 12, color: BrandColors.textSecondary, marginTop: 2, lineHeight: 17 },
  inputs: { flexDirection: 'row', gap: 10, padding: 12 },
  field: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: BrandColors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
});
