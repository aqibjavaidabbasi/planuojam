// lib/strapiUpload.ts
export async function uploadToStrapi(
    files: File[] | File,
  ): Promise<UploadedFile[]> {
  const formData = new FormData();

  // Handle single or multiple
  if (Array.isArray(files)) {
    files.forEach((file) => formData.append("files", file));
  } else {
    formData.append("files", files);
  }

  // Add folder info so files go into that folder in Strapi Media Library
  formData.append("path", "/user-uploads");
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : "";

  if(!token){
      throw new Error("No Token found!");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Upload failed:", errorData);
    throw new Error(errorData.error?.message || "Upload failed");
  }

  const uploaded = await res.json();
  return uploaded as UploadedFile[];
}

// Strapi returns an array of uploaded file objects. We type only common fields
export type UploadedFile = {
  id: number;
  url: string;
  name: string;
} & Record<string, unknown>;

export type StrapiUploadResponse = UploadedFile[];

// Optimistic deletion helper for Strapi media (non-blocking usage recommended)
export async function deleteStrapiFile(id: number): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  if (!token) throw new Error('No Token found!');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/files/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    // Swallow errors at callsite if used optimistically; still throw here to allow optional catch
    const err = await res.text().catch(() => 'Delete failed');
    throw new Error(err || 'Delete failed');
  }
}