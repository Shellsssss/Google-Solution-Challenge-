'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';
import { Upload, Camera, X, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageReady: (file: File) => void;
  onClear: () => void;
  imageFile: File | null;
}

export default function ImageUploader({ onImageReady, onClear, imageFile }: ImageUploaderProps) {
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) {
        const url = URL.createObjectURL(accepted[0]);
        setPreview(url);
        onImageReady(accepted[0]);
        setWebcamOpen(false);
      }
    },
    [onImageReady]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10_000_000,
    noClick: webcamOpen,
  });

  const capturePhoto = () => {
    const imgSrc = webcamRef.current?.getScreenshot();
    if (!imgSrc) return;

    // Convert base64 to File
    fetch(imgSrc)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
        setPreview(imgSrc);
        onImageReady(file);
        setWebcamOpen(false);
      })
      .catch(console.error);
  };

  const handleClear = () => {
    setPreview(null);
    setWebcamOpen(false);
    onClear();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Image</label>

      {!imageFile && !webcamOpen && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-border-light hover:bg-background-card'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-background-secondary border border-border flex items-center justify-center">
              <Upload className="h-7 w-7 text-muted" />
            </div>
            <div>
              <p className="text-white font-medium">Drop image here or click to browse</p>
              <p className="text-muted text-sm mt-1">JPG, PNG, WEBP · Max 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Webcam */}
      {webcamOpen && !imageFile && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full"
            videoConstraints={{ facingMode: 'user' }}
          />
          <div className="flex gap-3 p-4 bg-background-card">
            <Button onClick={capturePhoto} className="flex-1" size="lg">
              <Camera className="h-4 w-4" />
              Capture Photo
            </Button>
            <Button
              variant="secondary"
              onClick={() => setWebcamOpen(false)}
              size="lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview */}
      {imageFile && preview && (
        <div className="relative rounded-2xl overflow-hidden border border-success/30 bg-background-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Scan preview"
            className="w-full max-h-56 object-cover"
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={handleClear}
              className="w-8 h-8 rounded-full bg-danger/90 text-white flex items-center justify-center hover:bg-danger transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 flex items-center gap-2 border-t border-border">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">Image ready</span>
            <span className="text-xs text-muted ml-auto">{imageFile.name}</span>
          </div>
        </div>
      )}

      {/* Camera toggle button */}
      {!imageFile && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setWebcamOpen(!webcamOpen)}
        >
          {webcamOpen ? (
            <>
              <RotateCcw className="h-4 w-4" /> Back to Upload
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Use Camera Instead
            </>
          )}
        </Button>
      )}
    </div>
  );
}
