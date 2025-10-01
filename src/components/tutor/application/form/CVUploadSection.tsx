import React from "react";
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CVUploadSectionProps {
  uploadedFile: File | null;
  uploadError: string | null;
  isDragOver: boolean;
  errors: Record<string, string | undefined>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveFile: () => void;
}

const CVUploadSection: React.FC<CVUploadSectionProps> = ({
  uploadedFile,
  uploadError,
  isDragOver,
  errors,
  fileInputRef,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <DocumentArrowUpIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-foreground">
          Upload Your CV *
        </h2>
      </div>

      {uploadedFile ? (
        <div className="bg-success/10 border border-success/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-success mr-3" />
              <div>
                <h4 className="text-lg font-medium text-success">
                  CV Uploaded Successfully
                </h4>
                <p className="text-success/80 mt-1">
                  File: {uploadedFile.name} (
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemoveFile}
              className="text-success hover:text-success/80 p-2 transition-colors"
              title="Remove file"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-background ${
            isDragOver
              ? "border-primary bg-primary/5"
              : errors.cv_file
              ? "border-destructive"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <DocumentArrowUpIcon
            className={`h-12 w-12 mx-auto mb-4 transition-colors ${
              isDragOver 
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          />
          <h4 className="text-lg font-medium text-foreground mb-2">
            {isDragOver
              ? "Drop your CV here"
              : "Upload Your Curriculum Vitae"}
          </h4>
          <p className="text-secondary-foreground mb-6">
            {isDragOver
              ? "Release to upload your CV file"
              : "Drag and drop your resume/CV here, or click to browse"}
          </p>

          {uploadError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          <label className="btn btn-primary cursor-pointer">
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Choose File
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-3">
            PDF or Word documents only, max 5MB
          </p>
        </div>
      )}
      {errors.cv_file && (
        <p className="text-destructive text-sm">{errors.cv_file}</p>
      )}
    </div>
  );
};

export default CVUploadSection;
