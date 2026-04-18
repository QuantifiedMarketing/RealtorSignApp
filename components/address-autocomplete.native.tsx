// Native (iOS / Android): uses Google Places Autocomplete + Details API via fetch.
// Predictions are rendered in a Modal so they always appear above native views
// (e.g. the MapView SurfaceView) which otherwise paint over JS-layer dropdowns.
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  // Position of the input on screen — used to anchor the Modal dropdown
  const [dropdownAnchor, setDropdownAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputWrapperRef = useRef<View>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureInput = () => {
    inputWrapperRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownAnchor({ x, y, width, height });
    });
  };

  const fetchPredictions = async (input: string) => {
    if (!API_READY) return;
    setLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(input)}` +
        `&types=address` +
        `&components=country:ca` +
        `&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        setPredictions((json.predictions as Prediction[]).slice(0, 5));
        measureInput();
      } else {
        setPredictions([]);
      }
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setText(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 3) {
      setPredictions([]);
      return;
    }
    debounce.current = setTimeout(() => fetchPredictions(val), 400);
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

  const dismissDropdown = () => setPredictions([]);

  return (
    <View>
      {/* Input row — measure its screen position so the Modal dropdown aligns with it */}
      <View
        ref={inputWrapperRef}
        onLayout={measureInput}
        style={[styles.inputRow, predictions.length > 0 && styles.inputRowOpen]}
      >
        <Ionicons name="search-outline" size={18} color={BrandColors.textSecondary} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          placeholder="123 Main St, City, State"
          placeholderTextColor={BrandColors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          disableFullscreenUI
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

      {/* Modal keeps the list in a separate window layer, above MapView's SurfaceView */}
      <Modal
        visible={predictions.length > 0}
        transparent
        animationType="none"
        onRequestClose={dismissDropdown}
      >
        <TouchableWithoutFeedback onPress={dismissDropdown}>
          <View style={StyleSheet.absoluteFill}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdown,
                  {
                    position: 'absolute',
                    top: dropdownAnchor.y + dropdownAnchor.height,
                    left: dropdownAnchor.x,
                    width: dropdownAnchor.width,
                  },
                ]}
              >
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: BrandColors.primary,
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
    backgroundColor: BrandColors.surface,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    backgroundColor: BrandColors.surface,
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
