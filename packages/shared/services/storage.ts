/**
 * Storage Service
 * Handles file uploads/downloads with Supabase Storage
 */

import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// =====================================================
// TYPES
// =====================================================

export type BucketName = 
  | 'avatars'
  | 'portfolios'
  | 'barbershops'
  | 'services'
  | 'reviews'
  | 'documents';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: BucketName;
  folder: string;
  fileName: string;
  fileUri: string;
  contentType?: string;
}

// =====================================================
// UPLOAD FUNCTIONS
// =====================================================

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async ({
  bucket,
  folder,
  fileName,
  fileUri,
  contentType = 'image/jpeg',
}: UploadOptions): Promise<UploadResult> => {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Construct storage path
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true, // Overwrite existing file if it exists
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
};

/**
 * Upload avatar image
 */
export const uploadAvatar = async (
  userId: string,
  fileUri: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `avatar-${timestamp}.jpg`;

  return uploadFile({
    bucket: 'avatars',
    folder: userId,
    fileName,
    fileUri,
    contentType: 'image/jpeg',
  });
};

/**
 * Upload portfolio image for barber
 */
export const uploadPortfolioImage = async (
  userId: string,
  fileUri: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `portfolio-${timestamp}.jpg`;

  return uploadFile({
    bucket: 'portfolios',
    folder: userId,
    fileName,
    fileUri,
    contentType: 'image/jpeg',
  });
};

/**
 * Upload barbershop image (logo or cover)
 */
export const uploadBarbershopImage = async (
  barbershopId: string,
  fileUri: string,
  type: 'logo' | 'cover' = 'cover'
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `${type}-${timestamp}.jpg`;

  return uploadFile({
    bucket: 'barbershops',
    folder: barbershopId,
    fileName,
    fileUri,
    contentType: 'image/jpeg',
  });
};

/**
 * Upload service image
 */
export const uploadServiceImage = async (
  serviceId: string,
  fileUri: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `service-${timestamp}.jpg`;

  return uploadFile({
    bucket: 'services',
    folder: serviceId,
    fileName,
    fileUri,
    contentType: 'image/jpeg',
  });
};

/**
 * Upload review image
 */
export const uploadReviewImage = async (
  reviewId: string,
  fileUri: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `review-${timestamp}.jpg`;

  return uploadFile({
    bucket: 'reviews',
    folder: reviewId,
    fileName,
    fileUri,
    contentType: 'image/jpeg',
  });
};

/**
 * Upload verification document (private)
 */
export const uploadDocument = async (
  userId: string,
  fileUri: string,
  documentType: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `${documentType}-${timestamp}.pdf`;

  return uploadFile({
    bucket: 'documents',
    folder: userId,
    fileName,
    fileUri,
    contentType: 'application/pdf',
  });
};

// =====================================================
// DELETE FUNCTIONS
// =====================================================

/**
 * Delete a file from storage
 */
export const deleteFile = async (
  bucket: BucketName,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Delete failed',
    };
  }
};

/**
 * Delete multiple files from storage
 */
export const deleteFiles = async (
  bucket: BucketName,
  filePaths: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Delete failed',
    };
  }
};

// =====================================================
// URL FUNCTIONS
// =====================================================

/**
 * Get public URL for a file
 */
export const getPublicUrl = (
  bucket: BucketName,
  filePath: string
): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Get signed URL for private file (documents)
 */
export const getSignedUrl = async (
  bucket: BucketName,
  filePath: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
};

// =====================================================
// LIST FUNCTIONS
// =====================================================

/**
 * List files in a folder
 */
export const listFiles = async (
  bucket: BucketName,
  folder: string
): Promise<{ success: boolean; files?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    return {
      success: true,
      files: data,
    };
  } catch (error: any) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list files',
    };
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate unique filename
 */
export const generateFileName = (
  prefix: string = 'file',
  extension: string = 'jpg'
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}.${extension}`;
};

/**
 * Get file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Get content type from extension
 */
export const getContentType = (extension: string): string => {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return types[extension] || 'application/octet-stream';
};

/**
 * Validate image file
 */
export const validateImageFile = (uri: string): {
  valid: boolean;
  error?: string;
} => {
  const extension = getFileExtension(uri);
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file type. Please use JPG, PNG, or WEBP.',
    };
  }

  return { valid: true };
};

/**
 * Convert and compress image to JPG format before upload
 * Ensures all images are consistent JPG format regardless of source (HEIC, PNG, etc)
 */
export const convertToJpg = async (
  uri: string,
  quality: number = 0.8,
  maxWidth: number = 1920
): Promise<string> => {
  try {
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');
    
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }], // Resize if larger than maxWidth
      { compress: quality, format: SaveFormat.JPEG } // Force JPG format
    );
    
    console.log('✅ Converted to JPG:', manipResult.uri);
    return manipResult.uri;
  } catch (error) {
    console.error('❌ JPG conversion failed, using original:', error);
    // Fallback to original URI if conversion fails
    return uri;
  }
};

/**
 * Extract path from URL
 */
export const extractPathFromUrl = (url: string, bucket: BucketName): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split(`/${bucket}/`);
    return pathParts[1] || null;
  } catch (error) {
    return null;
  }
};
