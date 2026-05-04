import AsyncStorage from "@react-native-async-storage/async-storage";

// Format bytes to human-readable size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Validate file size
export const validateFileSize = (bytes, maxMB) => {
  const maxBytes = maxMB * 1024 * 1024;
  return bytes <= maxBytes;
};

// Upload file with XMLHttpRequest for progress tracking
export const uploadFile = async (file, uploadUrl, onProgress) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const formData = new FormData();

    // Determine field name based on URL
    const fieldName = uploadUrl.includes("upload-video") ? "video" : "document";
    formData.append(fieldName, {
      uri:  file.uri,
      type: file.mimeType || (uploadUrl.includes("upload-video") ? "video/mp4" : "application/pdf"),
      name: file.name || (uploadUrl.includes("upload-video") ? "video.mp4" : "document.pdf"),
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          if (onProgress) onProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ success: true, url: response.data?.url || "", response });
          } catch (e) {
            resolve({ success: true, url: "", response: xhr.responseText });
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject({ success: false, error: err.message || "Upload failed" });
          } catch (e) {
            reject({ success: false, error: `Upload failed (${xhr.status})` });
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject({ success: false, error: "Network error during upload" });
      });

      xhr.addEventListener("abort", () => {
        reject({ success: false, error: "Upload cancelled" });
      });

      // Get base URL from env or fallback
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.103.129.69:5000/api";
      const fullUrl = uploadUrl.startsWith("http") ? uploadUrl : `${baseUrl}${uploadUrl}`;

      xhr.open("POST", fullUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (err) {
    return { success: false, error: err.message || "Upload failed" };
  }
};
