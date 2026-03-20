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
    const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
    let type = "image/jpeg";
    let resourceType = "image";

    if (["mp4", "mov", "avi"].includes(extension)) {
      type = "video/mp4";
      resourceType = "video";
    } else if (["mp3", "m4a", "wav", "caf"].includes(extension)) {
      type = "audio/mpeg";
      resourceType = "video"; // Cloudinary treats audio as type 'video'
    } else if (["pdf", "doc", "docx", "txt"].includes(extension)) {
      type = "application/pdf";
      resourceType = "raw";
    }

    // @ts-ignore
    formData.append("file", {
      uri: uri,
      type: type,
      name: `upload.${extension}`,
    });
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("resource_type", resourceType);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`,
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
