# Cloudinary Setup Guide

Complete guide for setting up Cloudinary image optimization and CDN for Mari-Gunting.

## Table of Contents
- [Account Setup](#account-setup)
- [Upload Presets Configuration](#upload-presets-configuration)
- [Environment Configuration](#environment-configuration)
- [Usage Examples](#usage-examples)
- [Image Transformations](#image-transformations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Account Setup

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Click **Sign Up** (Free tier includes 25GB storage, 25GB bandwidth/month)
3. Verify your email
4. Complete account setup

### 2. Get API Credentials

1. Go to **Dashboard**
2. Find your credentials:
   - **Cloud Name** (e.g., `dk123abc`)
   - **API Key**
   - **API Secret** (keep this secret!)

3. Add to your `.env` file:

```bash
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret # Server-side only!
```

---

## Upload Presets Configuration

Upload presets define upload settings without exposing your API secret.

### 1. Create Upload Presets

Go to **Settings → Upload → Upload presets**

#### Avatar Preset

**Preset Name:** `mari-gunting-avatars`

**Settings:**
- Signing Mode: **Unsigned**
- Folder: `mari-gunting/avatars`
- Allowed formats: `jpg,png,webp`
- Max file size: `5MB`
- Transformations:
  - Crop: `fill`
  - Width: `500`
  - Height: `500`
  - Gravity: `face`
  - Quality: `auto:good`
  - Format: `auto`

#### Portfolio Preset

**Preset Name:** `mari-gunting-portfolios`

**Settings:**
- Signing Mode: **Unsigned**
- Folder: `mari-gunting/portfolios`
- Allowed formats: `jpg,png,webp`
- Max file size: `10MB`
- Transformations:
  - Crop: `limit`
  - Width: `1200`
  - Height: `900`
  - Quality: `auto:good`
  - Format: `auto`

#### Barbershop Preset

**Preset Name:** `mari-gunting-barbershops`

**Settings:**
- Signing Mode: **Unsigned**
- Folder: `mari-gunting/barbershops`
- Allowed formats: `jpg,png,webp`
- Max file size: `10MB`
- Transformations:
  - Crop: `limit`
  - Width: `1200`
  - Height: `900`
  - Quality: `auto:good`
  - Format: `auto`

#### Service Images Preset

**Preset Name:** `mari-gunting-services`

**Settings:**
- Signing Mode: **Unsigned**
- Folder: `mari-gunting/services`
- Allowed formats: `jpg,png,webp`
- Max file size: `5MB`
- Transformations:
  - Crop: `fill`
  - Width: `600`
  - Height: `400`
  - Quality: `auto:good`
  - Format: `auto`

#### Review Images Preset

**Preset Name:** `mari-gunting-reviews`

**Settings:**
- Signing Mode: **Unsigned**
- Folder: `mari-gunting/reviews`
- Allowed formats: `jpg,png,webp`
- Max file size: `5MB`
- Transformations:
  - Crop: `limit`
  - Width: `800`
  - Height: `800`
  - Quality: `auto:good`
  - Format: `auto`

### 2. Save Preset Names in Environment

```bash
EXPO_PUBLIC_CLOUDINARY_AVATAR_PRESET=mari-gunting-avatars
EXPO_PUBLIC_CLOUDINARY_PORTFOLIO_PRESET=mari-gunting-portfolios
EXPO_PUBLIC_CLOUDINARY_BARBERSHOP_PRESET=mari-gunting-barbershops
```

---

## Environment Configuration

Complete `.env` setup:

```bash
# Cloudinary Configuration
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Upload Presets
EXPO_PUBLIC_CLOUDINARY_AVATAR_PRESET=mari-gunting-avatars
EXPO_PUBLIC_CLOUDINARY_PORTFOLIO_PRESET=mari-gunting-portfolios
EXPO_PUBLIC_CLOUDINARY_BARBERSHOP_PRESET=mari-gunting-barbershops
```

---

## Usage Examples

### Example 1: Pick and Upload Avatar

```typescript
import { pickAndUploadImage } from '@shared';
import { useAuth } from '@shared';

async function uploadAvatar() {
  const { user } = useAuth();
  if (!user) return;

  const result = await pickAndUploadImage(
    'AVATAR',
    user.id,
    {
      compress: true,
      quality: 0.8,
      aspect: [1, 1] // Square crop
    }
  );

  if (result?.success) {
    console.log('Avatar uploaded:', result.url);
    // Update user profile with result.url
  } else {
    console.error('Upload failed:', result?.error);
  }
}
```

### Example 2: Take and Upload Photo

```typescript
import { takeAndUploadPhoto } from '@shared';

async function uploadPortfolioPhoto(barberId: string) {
  const result = await takeAndUploadPhoto(
    'PORTFOLIO',
    barberId,
    {
      compress: true,
      quality: 0.9
    }
  );

  if (result?.success) {
    console.log('Portfolio photo uploaded:', result.url);
    console.log('Public ID:', result.publicId);
  }
}
```

### Example 3: Upload Multiple Images

```typescript
import { pickImage, uploadMultipleImages } from '@shared';

async function uploadMultiplePortfolioPhotos(barberId: string) {
  // Pick multiple images
  const images = await pickImage({ allowsMultiple: true });
  if (!images || !Array.isArray(images)) return;

  const uris = images.map(img => img.uri);

  // Upload all images
  const results = await uploadMultipleImages(
    uris,
    'PORTFOLIO',
    barberId
  );

  const successful = results.filter(r => r.success);
  console.log(`Uploaded ${successful.length}/${results.length} images`);

  return successful.map(r => r.url);
}
```

### Example 4: Get Optimized Image URL

```typescript
import { getOptimizedImageUrl } from '@shared';

function DisplayAvatar({ publicId }: { publicId: string }) {
  // Get thumbnail version
  const thumbnailUrl = getOptimizedImageUrl(publicId, 'AVATAR_THUMBNAIL');
  
  // Get medium version
  const mediumUrl = getOptimizedImageUrl(publicId, 'AVATAR_MEDIUM');
  
  return (
    <Image
      source={{ uri: thumbnailUrl }}
      style={{ width: 100, height: 100 }}
    />
  );
}
```

### Example 5: Manual Upload to Cloudinary

```typescript
import { uploadToCloudinary } from '@shared';

async function manualUpload(imageUri: string) {
  const result = await uploadToCloudinary(
    imageUri,
    'AVATAR',
    {
      folder: 'mari-gunting/custom-folder',
      quality: 0.85
    }
  );

  if (result.success) {
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.publicId);
    console.log('Width:', result.width);
    console.log('Height:', result.height);
    console.log('Format:', result.format);
    console.log('Size:', result.bytes);
  }
}
```

### Example 6: Fallback to Supabase Storage

```typescript
import { uploadImage } from '@shared';

async function uploadWithFallback(imageUri: string, userId: string) {
  // Automatically tries Cloudinary first, falls back to Supabase
  const result = await uploadImage(imageUri, 'AVATAR', userId);
  
  if (result.success) {
    console.log('Uploaded to:', result.url);
    // result.publicId exists if uploaded to Cloudinary
    // otherwise it's a Supabase Storage URL
  }
}
```

---

## Image Transformations

### Available Presets

```typescript
import { IMAGE_TRANSFORMATIONS, getCloudinaryUrl } from '@shared';

// Avatar sizes
AVATAR_THUMBNAIL  // 100x100, face crop
AVATAR_MEDIUM     // 300x300, face crop
AVATAR_LARGE      // 500x500, face crop

// Portfolio/Barbershop sizes
PORTFOLIO_THUMBNAIL  // 300x200, fill
PORTFOLIO_MEDIUM     // 800x600, limit
PORTFOLIO_LARGE      // 1200x900, limit

// Service sizes
SERVICE_THUMBNAIL  // 200x200, fill
SERVICE_MEDIUM     // 600x400, fill

// Review sizes
REVIEW_THUMBNAIL  // 150x150, fill
REVIEW_MEDIUM     // 600x600, limit
```

### Custom Transformations

```typescript
import { getCloudinaryUrl } from '@shared';

const url = getCloudinaryUrl(publicId, {
  width: 400,
  height: 300,
  crop: 'fill',
  gravity: 'auto',
  quality: 'auto:good',
  fetch_format: 'auto',
  effect: 'sharpen', // Optional effects
});
```

### Responsive Images

```typescript
function ResponsiveImage({ publicId }: { publicId: string }) {
  const sizes = {
    thumbnail: getOptimizedImageUrl(publicId, 'AVATAR_THUMBNAIL'),
    medium: getOptimizedImageUrl(publicId, 'AVATAR_MEDIUM'),
    large: getOptimizedImageUrl(publicId, 'AVATAR_LARGE'),
  };

  return (
    <Image
      source={{
        uri: sizes.medium,
        // Provide multiple sizes for responsive loading
      }}
      style={{ width: 300, height: 300 }}
    />
  );
}
```

---

## Best Practices

### 1. Image Compression

Always compress images before upload:

```typescript
import { compressImage, uploadImage } from '@shared';

async function uploadCompressed(imageUri: string, userId: string) {
  // Compress to max 1200px width, 70% quality
  const compressed = await compressImage(imageUri, 0.7);
  
  if (compressed) {
    return await uploadImage(compressed, 'PORTFOLIO', userId);
  }
}
```

### 2. Validate Before Upload

```typescript
import { validateImageFile, MAX_FILE_SIZES } from '@shared';

async function safeUpload(imageUri: string, fileSize: number) {
  const validation = validateImageFile(
    imageUri,
    fileSize,
    'image/jpeg',
    'AVATAR'
  );

  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // Proceed with upload
}
```

### 3. Handle Upload Errors

```typescript
async function robustUpload(imageUri: string, userId: string) {
  const result = await uploadImage(imageUri, 'AVATAR', userId);

  if (!result.success) {
    // Show user-friendly error
    if (result.error?.includes('size')) {
      alert('Image is too large. Please choose a smaller image.');
    } else if (result.error?.includes('format')) {
      alert('Invalid image format. Please use JPEG or PNG.');
    } else {
      alert('Upload failed. Please try again.');
    }
    return null;
  }

  return result.url;
}
```

### 4. Store Public IDs

When saving to database, store both URL and public ID:

```sql
-- In database schema
avatar_url TEXT,
avatar_public_id TEXT
```

This allows you to:
- Generate different image sizes on-the-fly
- Delete images from Cloudinary
- Update transformations without re-uploading

### 5. Use CDN URLs

Always use `secure_url` (HTTPS) from upload results:

```typescript
const result = await uploadToCloudinary(uri, 'AVATAR');
const cdnUrl = result.secure_url; // Use this, not result.url
```

---

## Troubleshooting

### Upload Fails with "Preset not found"

**Cause:** Upload preset not configured or wrong name

**Solution:**
1. Check preset exists in Cloudinary Dashboard
2. Verify preset name in `.env` matches exactly
3. Ensure preset is set to "Unsigned"

### Images Not Optimizing

**Cause:** Transformations not applied

**Solution:**
```typescript
// Use preset transformations
const url = getOptimizedImageUrl(publicId, 'AVATAR_MEDIUM');

// Or apply custom transformations
const url = getCloudinaryUrl(publicId, {
  width: 300,
  quality: 'auto:good',
  fetch_format: 'auto'
});
```

### Upload Too Slow

**Causes:**
1. Large image files
2. Slow internet
3. No compression

**Solutions:**
```typescript
// 1. Always compress
const compressed = await compressImage(uri, 0.7);

// 2. Show progress (implement progress callback)
// 3. Reduce quality for large images
const quality = fileSize > 5MB ? 0.6 : 0.8;
```

### "Cloudinary not configured" Error

**Cause:** Missing environment variables

**Solution:**
```bash
# Add to .env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Then restart app:
```bash
npx expo start --clear
```

### Images Showing 404

**Causes:**
1. Wrong public ID
2. Image deleted
3. Wrong cloud name

**Solutions:**
1. Verify public ID is correct
2. Check image exists in Cloudinary Media Library
3. Verify `CLOUDINARY_CLOUD_NAME` in `.env`

---

## API Limits

### Free Tier

- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Credits:** 25 credits/month

### Monitoring Usage

1. Go to **Dashboard → Usage**
2. Monitor:
   - Storage used
   - Bandwidth used
   - Transformations used
3. Set up usage alerts

---

## Migration from Supabase Storage

If you need to migrate existing images:

1. **Download from Supabase:**
   ```typescript
   const { data } = await supabase.storage
     .from('avatars')
     .download(path);
   ```

2. **Upload to Cloudinary:**
   ```typescript
   const result = await uploadToCloudinary(localUri, 'AVATAR');
   ```

3. **Update Database:**
   ```typescript
   await supabase
     .from('profiles')
     .update({
       avatar_url: result.secure_url,
       avatar_public_id: result.publicId
     })
     .eq('id', userId);
   ```

---

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [React Native SDK](https://cloudinary.com/documentation/react_native_integration)

---

**Need Help?** Check the troubleshooting section or contact support.
