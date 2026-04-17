// Web fallback: uses OpenStreetMap Nominatim — free, no key, CORS-safe.
// The native version (address-autocomplete.native.tsx) uses Google Places API.
// Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

export interface PlaceResult {
  address: string;
  coords: { latitude: number; longitude: number };
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: string;
  onSelect: (result: PlaceResult) => void;
}

export default function AddressAutocomplete({ value, onSelect }: Props) {
  const [text, setText] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = async (query: string) => {
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&format=json&limit=5&countrycodes=us&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SignTrack-DevApp/1.0' },
      });
      const json: NominatimResult[] = await res.json();
      setResults(json);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setText(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 4) { setResults([]); return; }
    debounce.current = setTimeout(() => fetchResults(val), 400);
  };

  const handleSelect = (r: NominatimResult) => {
    setText(r.display_name);
    setResults([]);
    onSelect({
      address: r.display_name,
      coords: { latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) },
    });
  };

  const showDropdown = results.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputRow, showDropdown && styles.inputRowOpen]}>
        <Ionicons name="search-outline" size={18} color={BrandColors.textSecondary} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          placeholder="123 Main St, City, State"
          placeholderTextColor={BrandColors.textSecondary}
          autoCorrect={false}
        />
        {loading ? (
          <ActivityIndicator size="small" color={BrandColors.primary} />
        ) : text.length > 0 ? (
          <TouchableOpacity onPress={() => { setText(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color={BrandColors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.webNote}>
        <Ionicons name="information-circle-outline" size={12} color={BrandColors.textSecondary} />
        <Text style={styles.webNoteText}>
          Web preview uses OpenStreetMap. Mobile app uses Google Places.
        </Text>
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <TouchableOpacity
              key={r.place_id}
              style={[styles.suggestion, i < results.length - 1 && styles.divider]}
              onPress={() => handleSelect(r)}
            >
              <Ionicons name="location-outline" size={15} color={BrandColors.textSecondary} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {r.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { zIndex: 99 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: BrandColors.surface,
    gap: 8,
  },
  inputRowOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: BrandColors.divider,
  },
  input: { flex: 1, fontSize: 15, color: BrandColors.textPrimary },
  webNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  webNoteText: { fontSize: 11, color: BrandColors.textSecondary },
  dropdown: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: BrandColors.border,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: BrandColors.surface,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: BrandColors.divider },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.textPrimary,
    lineHeight: 19,
  },
});
