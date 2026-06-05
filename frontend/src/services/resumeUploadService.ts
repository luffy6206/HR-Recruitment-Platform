import { http } from "./http";

export interface ResumeUploadResponse {
  success: boolean;
  imported: number;
  duplicates?: number;
  failed: number;
  candidates: Array<{
    id: string;
    name: string;
    email: string;
    code: string;
    errors?: string[];
  }>;
}

/**
 * Service for uploading resumes to backend
 * Handles multipart/form-data submission
 */
export const resumeUploadService = {
  /**
   * Upload multiple resume PDFs to backend
   * Backend will parse, extract text, and create candidates
   */
  async uploadResumes(
    files: File[],
    category: string,
    assignedHR: string,
    onProgress?: (progress: number) => void
  ): Promise<ResumeUploadResponse> {
    const formData = new FormData();

    // Append all files to form data
    files.forEach((file, index) => {
      formData.append("resumes", file);
    });

    // Append category and assignedHR
    formData.append("category", category);
    formData.append("assignedHR", assignedHR);

    try {
      const response = await http.post<ResumeUploadResponse>(
        "/candidates/upload-resumes",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress?.(percentCompleted);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      throw error;
    }
  },
};