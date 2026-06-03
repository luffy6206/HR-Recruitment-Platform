/**
 * useResumeUpload Hook
 * 
 * Manages resume upload mutation with TanStack Query
 * Handles:
 * - File upload via FormData
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

export function useResumeUpload(options: UseResumeUploadOptions = {}) {
  return useMutation<ResumeUploadResponse, Error, File[]>({
    mutationFn: async (files: File[]) => {
      return resumeUploadService.uploadResumes(files, options.onProgress);
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
