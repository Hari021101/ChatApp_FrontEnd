import { CLOUDINARY_CONFIG } from "../config/cloudinary";

/**
 * Uploads a file (image, audio, video, doc) to Cloudinary
 * @param uri Local file URI
 * @param path Unused in Cloudinary (handled by preset)
 * @returns Download URL or null
 */
export const uploadFile = async (
  uri: string,
  _path?: string,
): Promise<string | null> => {
  try {
    const formData = new FormData();
    // @ts-ignore
    formData.append("file", {
      uri: uri,
      type: "image/jpeg", // Default, Cloudinary auto-detects
      name: "upload.jpg",
    });
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }

    if (data.error) {
      console.error("Cloudinary Error:", data.error.message);
    }
    return null;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return null;
  }
};

/**
 * @deprecated Use uploadFile instead
 */
export const uploadImage = uploadFile;
