import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface UploadResponse {
  objectPath: string;
  publicUrl: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json() as UploadResponse;
      setProgress(100);
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      options.onError?.(error as Error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options.onSuccess, options.onError]);

  return {
    uploadFile,
    isUploading,
    progress,
  };
}
