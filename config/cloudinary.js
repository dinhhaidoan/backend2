const cloudinary = require('cloudinary').v2;

// Use CLOUDINARY_URL if provided, but guard against invalid values to avoid crashing the app.
// Expected format: cloudinary://<api_key>:<api_secret>@<cloud_name>
const url = process.env.CLOUDINARY_URL;
const haveSeparate = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (url) {
  if (typeof url === 'string' && url.trim().startsWith('cloudinary://')) {
    cloudinary.config({ url: url.trim() });
  } else {
    // Provide a helpful warning and attempt fallback to separated env vars
    console.warn('Warning: CLOUDINARY_URL is present but invalid. It must begin with "cloudinary://<api_key>:<api_secret>@<cloud_name>"');
    if (haveSeparate) {
      console.log('Falling back to CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET environment variables.');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } else {
      console.warn('Cloudinary not configured. Uploads will fail until correct Cloudinary credentials are provided.');
    }
  }
} else if (haveSeparate) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('Cloudinary environment variables not found. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET to enable uploads.');
}

module.exports = cloudinary;
