/**
 * useResumeUpload Hook
 * 
 * Manages resume upload mutation with TanStack Query
 * Handles:
 * - File upload via FormData
 * - Category and HR assignment
 * - Progress tracking
 * - Error handling
 * - Success callback
 */

import { useMutation } from '@tanstack/react-query';
import { resumeUploadService } from '@/services/resumeUploadService';
import { ResumeUploadResponse } from '@/types/resume';

interface UseResumeUploadOptions {
  onSuccess?: (data: ResumeUploadResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface UploadParams {
  files: File[];
  category: string;
  assignedHR: string;
}

export function useResumeUpload(options: UseResumeUploadOptions = {}) {
  return useMutation<ResumeUploadResponse, Error, UploadParams>({
    mutationFn: async ({ files, category, assignedHR }: UploadParams) => {
      return resumeUploadService.uploadResumes(files, category, assignedHR, options.onProgress);
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
