/**
 * Constants used throughout the application
 */

// Input validation constants
export const MAX_AUTHOR_LENGTH = 50
export const MAX_CONTENT_LENGTH = 1000
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Allowed file types for image upload
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
]

// Rate limiting configuration
export const RATE_LIMIT = {
  messages: 10, // messages per minute
  uploads: 5,   // uploads per minute
}

// Image processing constants
export const IMAGE_PREVIEW_MAX_SIZE = 600
export const IMAGE_MAX_DIMENSION = 2000 