import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) throw new Error("No file path provided");

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // handles images, videos, etc.
    });

    // Remove local file after successful upload
    // fs.unlinkSync(localFilePath);

    console.log("File uploaded to Cloudinary:", result.secure_url);
    return result;
  } catch (err) {
    // Remove file if it exists
    try {
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    } catch (cleanupError) {
      console.error("Failed to delete local file:", cleanupError.message);
    }

    console.error("Cloudinary upload error:", err.message);
    return null;
  }
};

export default uploadOnCloudinary;