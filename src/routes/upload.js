import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireSupabaseUser } from '../middleware/auth.js';

const uploadRouter = Router();

// Upload property images to Supabase Storage
uploadRouter.post('/images', requireSupabaseUser, async (req, res, next) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'No images provided. Please provide an array of base64 images.'
      });
    }

    if (images.length > 8) {
      return res.status(400).json({
        error: 'Maximum 8 images allowed per listing.'
      });
    }

    const uploadedUrls = [];
    const bucketName = 'property-images'; // You need to create this bucket in Supabase

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      // Extract base64 data (handle both with and without data:image prefix)
      let base64Data = imageData;
      if (imageData.includes('base64,')) {
        base64Data = imageData.split('base64,')[1];
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${req.user.id}/${timestamp}-${i}-${randomString}.jpg`;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        // If upload fails, clean up previously uploaded images
        for (const url of uploadedUrls) {
          const path = url.split(`${bucketName}/`)[1];
          await supabase.storage.from(bucketName).remove([path]);
        }
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return res.status(200).json({
      success: true,
      message: `${uploadedUrls.length} image(s) uploaded successfully.`,
      data: {
        urls: uploadedUrls
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload images.',
      message: error.message
    });
  }
});

// Delete images from Supabase Storage
uploadRouter.delete('/images', requireSupabaseUser, async (req, res, next) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: 'No image URLs provided.'
      });
    }

    const bucketName = 'property-images';
    const filePaths = urls.map(url => {
      // Extract file path from URL
      const parts = url.split(`${bucketName}/`);
      return parts[1];
    }).filter(path => path && path.startsWith(req.user.id)); // Only allow deletion of own images

    if (filePaths.length === 0) {
      return res.status(403).json({
        error: 'You can only delete your own images.'
      });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (error) throw error;

    return res.json({
      success: true,
      message: `${filePaths.length} image(s) deleted successfully.`
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return res.status(500).json({
      error: 'Failed to delete images.',
      message: error.message
    });
  }
});

// Get presigned upload URL (Alternative approach - more efficient for mobile apps)
uploadRouter.post('/images/presigned-url', requireSupabaseUser, async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({
        error: 'fileName is required.'
      });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const uniqueFileName = `${req.user.id}/${timestamp}-${randomString}-${fileName}`;
    const bucketName = 'property-images';

    // Create a signed URL for direct upload from mobile app
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(uniqueFileName);

    if (error) throw error;

    // Get the public URL that will be available after upload
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    return res.json({
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        path: uniqueFileName,
        token: data.token
      }
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    return res.status(500).json({
      error: 'Failed to generate upload URL.',
      message: error.message
    });
  }
});

export { uploadRouter };
