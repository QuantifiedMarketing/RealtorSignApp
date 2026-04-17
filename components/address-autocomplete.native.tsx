// Native (iOS / Android): uses Google Places Autocomplete + Details API via fetch.
// No CORS restriction in React Native — direct API calls work fine.
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';
import { GOOGLE_MAPS_API_KEY } from '@/constants/keys';

export interface PlaceResult {
  address: string;
  coords: { latitude: number; longitude: number };
}

interface Prediction {
  place_id: string;
  description: string;
}

interface Props {
  value: string;
  onSelect: (result: PlaceResult) => void;
}

const API_READY = GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE';

export default function AddressAutocomplete({ value, onSelect }: Props) {
  const [text, setText] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = async (input: string) => {
    if (!API_READY) return;
    setLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(input)}` +
        `&types=address` +
        `&components=country:us` +
        `&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      setPredictions(json.status === 'OK' ? (json.predictions as Prediction[]).slice(0, 5) : []);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setText(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 3) { setPredictions([]); return; }
    debounce.current = setTimeout(() => fetchPredictions(val), 350);
  };

  const handleSelect = async (prediction: Prediction) => {
    const display = prediction.description;
    setText(display);
    setPredictions([]);
    Keyboard.dismiss();

    if (!API_READY) {
      onSelect({ address: display, coords: { latitude: 0, longitude: 0 } });
      return;
    }
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${prediction.place_id}` +
        `&fields=geometry,formatted_address` +
        `&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        const loc = json.result.geometry.location;
        setText(json.result.formatted_address);
        onSelect({
          address: json.result.formatted_address,
          coords: { latitude: loc.lat, longitude: loc.lng },
        });
      }
    } catch {
      onSelect({ address: display, coords: { latitude: 0, longitude: 0 } });
    }
  };

  const showDropdown = predictions.length > 0;

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
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color={BrandColors.primary} />
        ) : text.length > 0 ? (
          <TouchableOpacity
            onPress={() => { setText(''); setPredictions([]); }}
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={18} color={BrandColors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {!API_READY && text.length > 0 && (
        <View style={styles.apiKeyNotice}>
          <Ionicons name="information-circle-outline" size={13} color={BrandColors.accent} />
          <Text style={styles.apiKeyNoticeText}>
            Add your Google Maps API key in constants/keys.ts to enable suggestions.
          </Text>
        </View>
      )}

      {showDropdown && (
        <View style={styles.dropdown}>
          {predictions.map((p, i) => (
            <TouchableOpacity
              key={p.place_id}
              style={[styles.suggestion, i < predictions.length - 1 && styles.divider]}
              onPress={() => handleSelect(p)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={15} color={BrandColors.textSecondary} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {p.description}
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
  apiKeyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  apiKeyNoticeText: { fontSize: 11, color: BrandColors.accent, flex: 1 },
  dropdown: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: BrandColors.border,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: BrandColors.surface,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.textPrimary,
    lineHeight: 19,
  },
});
