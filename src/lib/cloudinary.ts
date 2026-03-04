export async function uploadBufferToCloudinary(
  buffer: Buffer,
  uploadPreset: string,
  fileName?: string
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not defined in environment variables");
  }
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  // Convert the Buffer to a Uint8Array, which is a valid BlobPart
  const blob = new Blob([new Uint8Array(buffer)]);
  const formData = new FormData();
  formData.append("upload_preset", uploadPreset || "");
  formData.append("file", blob, fileName || "uploaded_file");

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  console.log("🚀 ~ uploadBufferToCloudinary ~ response:", response)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Cloudinary upload failed:", errorData);
    throw new Error("Failed to upload file to Cloudinary");
  }

  const data = await response.json();
  console.log("🚀 Cloudinary Upload Success:", data);
  return data;
}
