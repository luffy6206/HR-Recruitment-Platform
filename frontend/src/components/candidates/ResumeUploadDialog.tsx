import { useState, useRef, useEffect } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services";

interface SelectedFile {
  file: File;
  id: string;
}

interface ResumeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[], category: string, assignedHR: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * ResumeUploadDialog Component
 * Handles PDF file selection, category selection, HR assignment, and validation before upload
 * Features: Category selection, HR dropdown, Multiple file selection, PDF validation, size checks, drag-drop
 */
export function ResumeUploadDialog({
  open,
  onOpenChange,
  onFilesSelected,
  isLoading = false,
}: ResumeUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [category, setCategory] = useState<string>("");
  const [assignedHR, setAssignedHR] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch HR users
  const { data: hrUsers = [] } = useQuery({
    queryKey: ["hr-users"],
    queryFn: () => userService.listHR(),
  });

  const validateFile = (file: File): boolean => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx");
    const isDoc = file.type === "application/msword" || fileName.endsWith(".doc");

    if (!isPdf && !isDocx && !isDoc) {
      setError("Only PDF and DOCX files are allowed");
      return false;
    }
    if (file.size === 0) {
      setError("Empty files not allowed");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds 10MB limit");
      return false;
    }
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      if (!validateFile(file)) return;
    }
    const newFiles: SelectedFile[] = files.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    // Validate category and assignedHR
    if (!category.trim()) {
      setError("Please select a category");
      return;
    }

    if (!assignedHR.trim()) {
      setError("Please select an HR");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setError("");
    try {
      const files = selectedFiles.map((f) => f.file);
      await onFilesSelected(files, category, assignedHR);
      setSelectedFiles([]);
      setCategory("");
      setAssignedHR("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDialogOpenChange = (value: boolean) => {
    if (isLoading) return;
    if (!value) {
      setSelectedFiles([]);
      setCategory("");
      setAssignedHR("");
      setError("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resumes</DialogTitle>
          <DialogDescription>
            Select category, assign HR, and upload resume files to auto-create candidates
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Uploading resumes. Please keep this dialog open until processing completes.</AlertDescription>
            </Alert>
          )}

          {/* Category Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a category</option>
              <option value="MERN Developer">MERN Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* HR Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Assigned HR *</label>
            <select
              value={assignedHR}
              onChange={(e) => setAssignedHR(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select an HR</option>
              {hrUsers.map((hr) => (
                <option key={hr.id} value={hr.id}>
                  {hr.name} ({hr.email})
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium">Click to select PDF or DOCX files</p>
            <p className="text-xs text-gray-500">or drag and drop</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Selected: {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm truncate">{item.file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(item.id)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || !category.trim() || !assignedHR.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}