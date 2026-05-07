/**
 * Cloudinary helper to generate optimized image URLs.
 * Free tier includes generous transformations.
 */

const CLOUD_NAME = 'your-cloud-name'; // Get this from Cloudinary Dashboard

export const getOptimizedImage = (publicId: string, width = 800) => {
  if (!publicId) return '';
  
  // Example Cloudinary URL with auto-format and auto-quality
  // f_auto: chooses best format (WebP/AVIF)
  // q_auto: optimizes quality/file size ratio
  // w_: resizes to specific width
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
};

export const getThumbnail = (publicId: string) => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_100,h_100,c_fill/${publicId}`;
};
