import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

export interface Coords {
  latitude: number;
  longitude: number;
}

interface Props {
  coords: Coords | null;
  onChange: (coords: Coords) => void;
  /** When set/changed, the map animates to this position (e.g. after address autocomplete). */
  centerOn?: Coords | null;
}

const US_CENTER = { latitude: 39.5, longitude: -98.35, latitudeDelta: 30, longitudeDelta: 30 };

export default function MapPinSelector({ coords, onChange, centerOn }: Props) {
  const mapRef = useRef<MapView>(null);
  const [locating, setLocating] = useState(true);

  // Animate to current GPS location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          mapRef.current?.animateToRegion(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            },
            600,
          );
        }
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  // Animate to geocoded address when centerOn changes
  useEffect(() => {
    if (!centerOn) return;
    mapRef.current?.animateToRegion(
      {
        latitude: centerOn.latitude,
        longitude: centerOn.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      600,
    );
  }, [centerOn]);

  const handlePress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onChange({ latitude, longitude });
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      400,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={US_CENTER}
        onPress={handlePress}
        provider={PROVIDER_DEFAULT}
      >
        {coords && (
          <Marker
            coordinate={coords}
            draggable
            onDragEnd={e => onChange(e.nativeEvent.coordinate)}
            pinColor={BrandColors.primary}
          />
        )}
      </MapView>

      {locating && (
        <View style={styles.locatingBadge}>
          <ActivityIndicator size="small" color={BrandColors.primary} />
          <Text style={styles.locatingText}>Finding location…</Text>
        </View>
      )}

      {!coords ? (
        <View style={styles.hintBadge}>
          <Ionicons name="location-outline" size={13} color={BrandColors.primary} />
          <Text style={styles.hintText}>Tap to place sign pin · drag to adjust</Text>
        </View>
      ) : (
        <View style={styles.coordBadge}>
          <Ionicons name="location" size={12} color="#fff" />
          <Text style={styles.coordText}>
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 240, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  locatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  locatingText: { fontSize: 12, color: BrandColors.textSecondary },
  hintBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  hintText: { fontSize: 12, fontWeight: '600', color: BrandColors.primary },
  coordBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  coordText: { fontSize: 11, fontWeight: '600', color: '#fff' },
});
