'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, RefreshCw, Loader2, Check, AlertCircle } from 'lucide-react';

interface PhotoUploaderProps {
  label?: string;
  initialUrl?: string | null;
  tenantSlug: string;
  entityType?: 'STUDENT' | 'GUARDIAN' | 'ADMISSION_APPLICATION' | 'STAFF' | 'INSTITUTION';
  entityId?: string | null;
  category?: 'PROFILE_PHOTO' | 'FATHER_PHOTO' | 'MOTHER_PHOTO' | 'GUARDIAN_PHOTO' | 'DOCUMENT' | 'ID_CARD_PHOTO';
  onChange: (url: string | null) => void;
  required?: boolean;
  aspectRatio?: '3/4' | '1/1';
  allowCamera?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function PhotoUploader({
  label = 'Photograph',
  initialUrl = null,
  tenantSlug,
  entityType = 'STUDENT',
  entityId = null,
  category = 'PROFILE_PHOTO',
  onChange,
  required = false,
  aspectRatio = '3/4',
  allowCamera = true,
  disabled = false,
  hint = 'Upload a recent passport-style portrait photo (JPG, PNG, WebP up to 5 MB)'
}: PhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    setError(null);

    // Client-side quick checks
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Unsupported format. Please upload JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 5 MB.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantSlug', tenantSlug);
      formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      formData.append('category', category);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload photo.');
      }

      const newUrl = json.data.url;
      setPhotoUrl(newUrl);
      onChange(newUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPhotoUrl(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        handleFileSelected(file);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {required ? (
            <span className="text-[10px] text-amber-600 font-semibold uppercase">Required</span>
          ) : (
            <span className="text-[10px] text-slate-400 uppercase">Optional</span>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Photo Box */}
        <div
          className={`relative shrink-0 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-all ${
            aspectRatio === '3/4' ? 'w-28 h-36' : 'w-28 h-28'
          } ${photoUrl ? 'border-emerald-500 bg-white' : 'border-slate-300 dark:border-slate-700'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center p-2 text-center text-indigo-600">
              <Loader2 className="w-6 h-6 animate-spin mb-1" />
              <span className="text-[10px] font-bold">Uploading...</span>
            </div>
          ) : photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
              <Upload className="w-6 h-6 mb-1 text-slate-300" />
              <span className="text-[10px] font-medium leading-tight">No Photo</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            disabled={disabled || uploading}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {photoUrl ? 'Change Photo' : 'Upload File'}
            </button>

            {allowCamera && typeof navigator !== 'undefined' && (
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || uploading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Camera className="w-3.5 h-3.5" />
                Use Camera
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {hint}
          </p>

          {error && (
            <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      {cameraActive && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Take Photo
              </h4>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-3/4 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none" />
              </div>
            )}

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Capture Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
