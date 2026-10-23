/**
 * pickImage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable image picker utility.
 *
 * Features:
 *  - Request media library permission automatically
 *  - Single or multiple image selection (controlled by `allowsMultipleSelection`)
 *  - Optional in-picker editing (crop/resize) for single-selection mode
 *  - Compresses and converts selected images to JPEG via ImageManipulator
 *  - Returns ready-to-upload `PickedImage[]` objects (uri + name + type + size)
 *    that can be directly appended to FormData or used as Image sources
 *
 * Usage:
 *  // Single image
 *  const images = await pickImage();
 *  if (images) formData.append('avatar', images[0].file as any);
 *
 *  // Multiple images
 *  const images = await pickImage({ allowsMultipleSelection: true, maxSelected: 5 });
 *  images?.forEach((img, i) => formData.append(`photo_${i}`, img.file as any));
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { extractGpsFromExif, ExifCoordinates } from './exif';

export { extractGpsFromExif, ExifCoordinates } from './exif';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** A fully processed image ready for display and server upload. */
export interface PickedImage {
  /** Local file URI — use as <Image source={{ uri }} /> */
  uri: string;
  /** Filename with extension, e.g. "photo_1712345678_0.jpg" */
  name: string;
  /** MIME type, always "image/jpeg" after processing */
  type: 'image/jpeg';
  /** File size in bytes (after compression) */
  size: number | undefined;
  /** GPS coordinates extracted from photo EXIF metadata */
  coordinates?: ExifCoordinates;
  /** Raw EXIF metadata if available */
  exif?: Record<string, unknown> | null;
  /**
   * Pre-built file object suitable for FormData.append().
   * Cast to `any` when appending: formData.append('key', file as any)
   */
  file: {
    uri: string;
    name: string;
    type: 'image/jpeg';
  };
}

/** Options for pickImage() */
export interface PickImageOptions {
  /**
   * Allow the user to select more than one image.
   * When true, `allowsEditing` is force-disabled (iOS limitation).
   * @default false
   */
  allowsMultipleSelection?: boolean;

  /**
   * Maximum images the user can select (only relevant when allowsMultipleSelection is true).
   * @default 10
   */
  maxSelected?: number;

  /**
   * Show the in-picker crop/resize editor.
   * Automatically disabled when allowsMultipleSelection is true.
   * @default false
   */
  allowsEditing?: boolean;

  /**
   * JPEG compression quality 0–1.
   * @default 0.8
   */
  quality?: number;

  /**
   * Aspect ratio for the editing crop box [width, height].
   * Only used when allowsEditing is true.
   * @default undefined (free crop)
   */
  aspect?: [number, number];
}

// ─── Result Type ───────────────────────────────────────────────────────────────

export type PickImageResult =
  | { success: true; images: PickedImage[] }
  | { success: false; reason: 'permission_denied' | 'cancelled' | 'error'; error?: unknown };

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Opens the device image library and returns processed, upload-ready images.
 *
 * @returns PickImageResult — check `result.success` before using `result.images`
 */
export async function pickImage(options: PickImageOptions = {}): Promise<PickImageResult> {
  const {
    allowsMultipleSelection = false,
    maxSelected = 10,
    allowsEditing = false,
    quality = 0.8,
    aspect,
  } = options;

  // ── 1. Request permission ──────────────────────────────────────────────────
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  // ── 2. Launch picker ───────────────────────────────────────────────────────
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // allowsEditing only works for single selection on iOS
      allowsEditing: allowsMultipleSelection ? false : allowsEditing,
      allowsMultipleSelection,
      // selectionLimit only respected on iOS 14+
      selectionLimit: allowsMultipleSelection ? maxSelected : 1,
      quality: 1,
      aspect: allowsEditing && aspect ? aspect : undefined,
      // Enable EXIF extraction for geo-tagging
      exif: true,
    });
  } catch (error) {
    return { success: false, reason: 'error', error };
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { success: false, reason: 'cancelled' };
  }

  // ── 3. Process each asset through ImageManipulator → JPEG ─────────────────
  const timestamp = Date.now();

  try {
    const processed = await Promise.all(
      result.assets.map(async (asset, index) => {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [], // no resize/rotate transforms; add here if needed
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );

        const fileName = `photo_${timestamp}_${index}.jpg`;
        const coordinates = extractGpsFromExif(asset.exif) ?? undefined;

        return {
          uri: manipulated.uri,
          name: fileName,
          type: 'image/jpeg' as const,
          // ImageManipulator doesn't expose size; use original if available
          size: asset.fileSize,
          coordinates,
          exif: asset.exif,
          file: {
            uri: manipulated.uri,
            name: fileName,
            type: 'image/jpeg' as const,
          },
        } satisfies PickedImage;
      }),
    );

    return { success: true, images: processed };
  } catch (error) {
    return { success: false, reason: 'error', error };
  }
}
