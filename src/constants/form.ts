// Form validation constants
export const DESCRIPTION_MAX_LENGTH = 500;
export const NOTE_TITLE_MAX_LENGTH = 100;

// File validation constants
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx"] as const;

// Helper function to validate document files
export const validateDocumentFile = (file: File): boolean => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isValidMimeType = ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_MIME_TYPES[number]);
  const isValidExtension = file.type === "" && ext ? ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as typeof ALLOWED_DOCUMENT_EXTENSIONS[number]) : false;
  return isValidMimeType || isValidExtension;
};
