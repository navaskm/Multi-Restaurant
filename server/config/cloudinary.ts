import multer from "multer";
import { v2 as cloudinary } from 'cloudinary'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 5 * 1024 * 1024} // 5MB limits
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer: Buffer): Promise<{secure_url: string}> => {
  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream({folder: 'multi-restaurant'}, (error, result) => {
      if(error) return reject(error);
      if(!result) return reject(new Error("Upload failed"));
      resolve({secure_url: result.secure_url})
    });

    stream.end(fileBuffer)
  });
};