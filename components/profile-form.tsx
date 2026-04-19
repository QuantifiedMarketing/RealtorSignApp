import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';
import type { PanelWidth, PostColour, PanelOrientation } from '@/context/auth';

export type ProfileFormField = 'name' | 'phone' | 'brokerage' | 'brokerageAddress';

export interface ProfileFormValues {
  name: string;
  phone: string;
  brokerage: string;
  brokerageAddress: string;
  panelWidth: PanelWidth | '';
  panelOrientation: PanelOrientation | '';
  postColour: PostColour | '';
  photoUri: string;
}

interface Props {
  values: ProfileFormValues;
  onChange: (field: ProfileFormField, value: string) => void;
  onPanelWidthChange: (v: PanelWidth) => void;
  onPanelOrientationChange: (v: PanelOrientation) => void;
  onPostColourChange: (v: PostColour) => void;
  onPickPhoto: () => void;
  isPickingPhoto: boolean;
}

const PANEL_OPTIONS: { value: PanelWidth; label: string }[] = [
  { value: 'up_to_24_inches', label: 'Up to 24 inches' },
  { value: 'over_24_inches',  label: 'Over 24 inches' },
];

const ORIENTATION_OPTIONS: { value: PanelOrientation; label: string; icon: string }[] = [
  { value: 'portrait',  label: 'Portrait',  icon: 'phone-portrait-outline' },
  { value: 'landscape', label: 'Landscape', icon: 'phone-landscape-outline' },
];

function OptionPill({
  label,
  selected,
  onPress,
  left,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  left?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {left}
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function StyledInput({
  value,
  onChange,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={BrandColors.textSecondary}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      autoCorrect={false}
    />
  );
}

export function ProfileForm({ values, onChange, onPanelWidthChange, onPanelOrientationChange, onPostColourChange, onPickPhoto, isPickingPhoto }: Props) {
  const hasPhoto = !!values.photoUri;

  return (
    <View style={styles.container}>

      {/* Photo picker */}
      <TouchableOpacity style={styles.photoWrap} onPress={onPickPhoto} activeOpacity={0.8} disabled={isPickingPhoto}>
        {hasPhoto ? (
          <Image source={{ uri: values.photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={40} color={BrandColors.surface} />
          </View>
        )}
        <View style={styles.cameraOverlay}>
          {isPickingPhoto
            ? <ActivityIndicator size="small" color={BrandColors.surface} />
            : <Ionicons name="camera" size={16} color={BrandColors.surface} />
          }
        </View>
      </TouchableOpacity>
      <Text style={styles.photoHint}>Tap to change photo</Text>

      {/* Text fields */}
      <View style={styles.card}>
        <FieldLabel text="Full Name" />
        <StyledInput
          value={values.name}
          onChange={v => onChange('name', v)}
          placeholder="Jane Smith"
          autoCapitalize="words"
        />

        <View style={styles.divider} />
        <FieldLabel text="Phone Number" />
        <StyledInput
          value={values.phone}
          onChange={v => onChange('phone', v)}
          placeholder="e.g. 416-555-0100"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <View style={styles.divider} />
        <FieldLabel text="Brokerage Name" />
        <StyledInput
          value={values.brokerage}
          onChange={v => onChange('brokerage', v)}
          placeholder="e.g. Royal LePage"
          autoCapitalize="words"
        />

        <View style={styles.divider} />
        <FieldLabel text="Brokerage Address" />
        <StyledInput
          value={values.brokerageAddress}
          onChange={v => onChange('brokerageAddress', v)}
          placeholder="e.g. 123 Main St, Toronto, ON"
          autoCapitalize="words"
        />
      </View>

      {/* Default panel width */}
      <Text style={styles.sectionLabel}>Default Panel Width</Text>
      <View style={styles.pillRow}>
        {PANEL_OPTIONS.map(opt => (
          <OptionPill
            key={opt.value}
            label={opt.label}
            selected={values.panelWidth === opt.value}
            onPress={() => onPanelWidthChange(opt.value)}
          />
        ))}
      </View>

      {/* Default panel orientation */}
      <Text style={styles.sectionLabel}>Default Panel Orientation</Text>
      <View style={styles.pillRow}>
        {ORIENTATION_OPTIONS.map(opt => (
          <OptionPill
            key={opt.value}
            label={opt.label}
            selected={values.panelOrientation === opt.value}
            onPress={() => onPanelOrientationChange(opt.value)}
            left={<Ionicons name={opt.icon as any} size={15} color={values.panelOrientation === opt.value ? BrandColors.primary : BrandColors.textSecondary} />}
          />
        ))}
      </View>

      {/* Default post colour */}
      <Text style={styles.sectionLabel}>Default Post Colour</Text>
      <View style={styles.pillRow}>
        <OptionPill
          label="Black"
          selected={values.postColour === 'black'}
          onPress={() => onPostColourChange('black')}
          left={<View style={[styles.colourDot, { backgroundColor: '#1A1A1A' }]} />}
        />
        <OptionPill
          label="White"
          selected={values.postColour === 'white'}
          onPress={() => onPostColourChange('white')}
          left={<View style={[styles.colourDot, styles.colourDotWhite]} />}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },

  photoWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 6,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BrandColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.surface,
  },
  photoHint: {
    alignSelf: 'center',
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 20,
  },

  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  divider: {
    height: 1,
    backgroundColor: BrandColors.divider,
    marginVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    color: BrandColors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: BrandColors.surface,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
  },
  pillSelected: {
    backgroundColor: BrandColors.primary + '14',
    borderColor: BrandColors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  pillTextSelected: {
    color: BrandColors.primary,
  },

  colourDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colourDotWhite: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
});
