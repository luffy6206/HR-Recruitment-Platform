import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface ProcessingFile {
  name: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  progress: number;
}

interface ResumeUploadProgressProps {
  files: ProcessingFile[];
  totalProcessing: number;
  isComplete: boolean;
  successCount: number;
  errorCount: number;
}

/**
 * ResumeUploadProgress Component
 * Shows real-time progress of resume processing
 */
export function ResumeUploadProgress({
  files,
  totalProcessing,
  isComplete,
  successCount,
  errorCount,
}: ResumeUploadProgressProps) {
  const overallProgress = totalProcessing > 0 ? (successCount + errorCount) / totalProcessing * 100 : 0;

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Processing Resumes</h3>
        <p className="text-sm text-gray-600">
          {successCount + errorCount} of {totalProcessing} processed
        </p>
      </div>

      <Progress value={overallProgress} className="h-2" />

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {files.map((file, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 rounded bg-gray-50">
            <div className="mt-1">
              {file.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
              {(file.status === "pending" || file.status === "processing") && (
                <Clock className="h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              {file.error && <p className="text-xs text-red-600">{file.error}</p>}
              {file.status === "processing" && <p className="text-xs text-blue-600">Processing...</p>}
            </div>
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="p-3 rounded bg-blue-50 border border-blue-200">
          <p className="text-sm">
            <span className="font-semibold text-green-600">{successCount}</span> candidates imported •{" "}
            {errorCount > 0 && <span className="text-red-600">{errorCount} failed</span>}
          </p>
        </div>
      )}
    </Card>
  );
}