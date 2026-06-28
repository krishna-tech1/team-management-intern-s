import cloudinary from '../config/cloudinary';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

/**
 * Upload a file buffer directly to Cloudinary using a stream.
 */
export const uploadImage = (
  fileBuffer: Buffer,
  folder: string,
  options: { filename?: string; resourceType?: 'image' | 'raw' | 'auto' } = {}
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.filename,
        resource_type: options.resourceType || 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty response'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an asset from Cloudinary using its public_id.
 */
export const deleteImage = async (
  publicId: string,
  options: { resourceType?: 'image' | 'raw' | 'auto' } = {}
): Promise<any> => {
  try {
    const resourceType = options.resourceType || 'image';
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error: any) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Replace an old asset on Cloudinary with a new one.
 */
export const replaceImage = async (
  oldPublicId: string | null | undefined,
  newFileBuffer: Buffer,
  folder: string,
  options: { filename?: string; resourceType?: 'image' | 'raw' | 'auto' } = {}
): Promise<CloudinaryUploadResponse> => {
  if (oldPublicId) {
    try {
      await deleteImage(oldPublicId, { resourceType: options.resourceType });
    } catch (err: any) {
      console.warn(`⚠️ Failed to delete old asset: ${oldPublicId}. Error: ${err.message}`);
    }
  }
  return uploadImage(newFileBuffer, folder, options);
};
