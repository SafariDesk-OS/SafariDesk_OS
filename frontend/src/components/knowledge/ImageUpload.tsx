import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onClear,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      // Create a local URL for immediate preview
      const localUrl = URL.createObjectURL(file);
      
      // For now, we'll use the local URL. In a real app, you'd upload to a server
      // TODO: Implement actual file upload to backend
      // const formData = new FormData();
      // formData.append('image', file);
      // const response = await uploadService.uploadImage(formData);
      // onChange(response.data.url);
      
      onChange(localUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClear = () => {
    if (value) {
      URL.revokeObjectURL(value);
    }
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadError(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Image Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            onError={(e) => {
              console.error('Image failed to load:', value);
              e.currentTarget.style.display = 'none';
            }}
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isUploading ? 'Uploading...' : label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Drag & drop or click to select • Max {maxSize}MB
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="pointer-events-none"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
