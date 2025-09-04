import React, { useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your note content here...",
  rows = 12,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Function to strip HTML tags and convert to plain text
  const stripHtml = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  // Handle content changes
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Initialize editor content - convert HTML to plain text
  useEffect(() => {
    if (editorRef.current) {
      const plainText = stripHtml(value);
      if (plainText !== editorRef.current.value) {
        editorRef.current.value = plainText;
      }
    }
  }, [value]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* Simple Text Editor */}
      <textarea
        ref={editorRef}
        defaultValue={stripHtml(value)}
        onChange={handleInput}
        placeholder={placeholder}
        className="w-full px-4 py-3 min-h-[300px] focus:outline-none resize-none text-sm leading-relaxed"
        style={{ minHeight: `${rows * 1.5}rem` }}
        rows={rows}
      />
    </div>
  );
};

export default RichTextEditor;
