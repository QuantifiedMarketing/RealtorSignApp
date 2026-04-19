import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject)
  );
}

/**
 * Compresses a local image URI to max 1200px wide at 70% JPEG quality.
 * Images already ≤1200px wide are re-encoded at 70% quality without resizing.
 * Returns the URI of the compressed image.
 */
export async function compressImage(uri: string): Promise<string> {
  const { width } = await getImageSize(uri);
  const actions: ImageManipulator.Action[] = width > 1200 ? [{ resize: { width: 1200 } }] : [];
  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

/**
 * Compresses and uploads a job completion photo to the Supabase `job-photos` bucket.
 * Path: <jobId>/completion.jpg  (upserted so re-uploads overwrite cleanly).
 * Returns the stable public URL.
 */
export async function uploadJobPhoto(jobId: string, uri: string): Promise<string> {
  const compressed = await compressImage(uri);
  const response = await fetch(compressed);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${jobId}/completion.jpg`;

  const { error } = await supabase.storage
    .from('job-photos')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from('job-photos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Compresses and uploads a profile photo to the Supabase `avatars` bucket.
 * Returns the public URL with a cache-busting timestamp.
 */
export async function uploadProfilePhoto(userId: string, uri: string): Promise<string> {
  const compressed = await compressImage(uri);
  const response = await fetch(compressed);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
