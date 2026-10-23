import api from "./axios";

// Uploads one photo to Cloudinary and returns its link
export async function uploadImage(file) {
  // 1. ask our server for permission (it adds your login token)
  const { data: sign } = await api.get("/uploads/signature");

  // 2. send the photo straight to Cloudinary.
  //    Plain fetch is used here on purpose, so our login token is not sent to Cloudinary.
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", sign.timestamp);
  body.append("folder", sign.folder);
  body.append("signature", sign.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body }
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.message || "Upload failed.");
  }

  return result.secure_url;
}