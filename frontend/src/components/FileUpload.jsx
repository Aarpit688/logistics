import React, { useRef, useState } from "react";
import { Upload, X, CheckCircle, FileText } from "lucide-react";

export const FileUpload = ({
  label,
  file,
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!file ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200
            flex flex-col items-center justify-center text-center
            ${
              isDragging
                ? "border-accent bg-blue-50"
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            }
          `}
        >
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            accept={accept}
            onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
          />
          <Upload
            className={`w-8 h-8 mb-2 ${
              isDragging ? "text-accent" : "text-slate-400"
            }`}
          />
          <p className="text-sm text-slate-600 font-medium">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
