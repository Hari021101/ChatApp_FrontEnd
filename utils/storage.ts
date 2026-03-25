import { Platform } from "react-native";
import { UPLOAD_URL, BACKEND_URL } from "../config/api";
import { auth } from "../config/firebase";

/**
 * Uploads a file (image, audio, video, doc) to your C# Backend
 * @param uri Local file URI
 * @param _path Unused (handled by backend)
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

    if (["mp4", "mov", "avi"].includes(extension)) {
      type = "video/mp4";
    } else if (["mp3", "m4a", "wav", "caf"].includes(extension)) {
      type = "audio/mpeg";
    }

    // WEB COMPATIBILITY: Fetch the blobcause FormData doesn't support URI objects in browsers
    if (Platform.OS === "web") {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob, `upload_${Date.now()}.${extension}`);
      } catch (e) {
        console.error("Error creating blob from URI:", e);
        return null;
      }
    } else {
      // @ts-ignore
      formData.append("file", {
        uri: uri,
        type: type,
        name: `upload_${Date.now()}.${extension}`,
      });
    }

    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend Upload Error Status:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Adjust based on your C# Backend response
    const fileUrl = data.url || data.path || data.secure_url;
    
    if (fileUrl) {
      return fileUrl.startsWith("http") ? fileUrl : `${BACKEND_URL}${fileUrl}`;
    }

    return null;
  } catch (error) {
    console.error("Error uploading file to Backend:", error);
    return null;
  }
};

/**
 * @deprecated Use uploadFile instead
 */
export const uploadImage = uploadFile;
