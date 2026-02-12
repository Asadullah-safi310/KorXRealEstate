import { BASE_URL } from '../api/axiosInstance';
import * as FileSystem from 'expo-file-system';

export const getFileUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('content://') || path.startsWith('data:')) return path;
  
  // Ensure we don't have double slashes when joining
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  
  const finalUrl = `${cleanBaseUrl}/${cleanPath.replace(/\\/g, '/')}`;
  return finalUrl;
};

export const getImageUrl = (imagePath: string | null) => {
  return getFileUrl(imagePath);
};

export const validateFileSize = async (fileUri: string, maxSizeMB = 10) => {
  try {
    if (!fileUri || fileUri.startsWith('http')) return true;
    
    const info = await FileSystem.getInfoAsync(fileUri) as any;
    if (!info.exists) return true; // If we can't find info, don't block; let backend handle it
    
    if (info.size === undefined) return true; // Size not available in info
    
    const maxBytes = maxSizeMB * 1024 * 1024;
    return info.size <= maxBytes;
  } catch (err) {
    console.warn('File size validation error:', err);
    return true; // Don't block on error, be permissive
  }
};

export const validateFileTypeByName = (fileName: string, mime?: string) => {
  const allowedMimes = [
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm','video/quicktime','video/x-msvideo','video/avi',
    'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'
  ];
  if (mime && allowedMimes.includes(mime)) return true;
  const allowedExtensions = ['jpg','jpeg','png','gif','webp','mp4','webm','mov','avi','mkv','flv','wmv','mts','m4v','pdf','doc','docx','xls','xlsx','txt'];
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return allowedExtensions.includes(ext);
};

export const getFileTypeCategory = (fileName: string, mime?: string) => {
  if (mime && mime.startsWith('image/')) return 'image';
  if (mime && mime.startsWith('video/')) return 'video';
  const videoExtensions = ['mp4','webm','mov','avi','mkv','flv','wmv','mts','m4v'];
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (videoExtensions.includes(ext)) return 'video';
  return 'attachment';
};

export const getFileExtension = (fileName: string) => {
  return (fileName.split('.').pop() || '').toUpperCase();
};

export const getFileSizeDisplay = async (fileUri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(fileUri) as any;
    const bytes = info.size || 0;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  } catch {
    return '';
  }
};
