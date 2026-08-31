import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, X, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { uploadPhotoToS3 } from '../lib/s3Upload';

interface S3PhotoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: 'posts' | 'stories' | 'district' | 'temples' | 'store' | 'slider' | 'qr' | 'photos' | string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  compact?: boolean;
}

export const S3PhotoUploader: React.FC<S3PhotoUploaderProps> = ({
  value,
  onChange,
  folder = 'photos',
  label = 'ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ (Upload Photo)',
  required = false,
  className = '',
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('ଦୟାକରି କେବଳ ଫଟୋ / ଇମେଜ୍ ଫାଇଲ୍ ସିଲେକ୍ଟ କରନ୍ତୁ (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('ଫଟୋ ସାଇଜ୍ ୨୫ MB ରୁ କମ୍ ହେବା ଆବଶ୍ୟକ।');
      return;
    }

    try {
      setIsUploading(true);
      setUploadPercent(10);
      setUploadStage('ଫଟୋ ପ୍ରସ୍ତୁତ ହେଉଛି...');
      setErrorMsg('');
      setUploadSuccess(false);

      const s3Url = await uploadPhotoToS3(file, folder, (percent, stage) => {
        setUploadPercent(percent);
        if (stage) setUploadStage(stage);
      });

      setUploadPercent(100);
      setUploadStage('ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
      onChange(s3Url);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadPercent(0);
        setUploadStage('');
      }, 3500);
    } catch (err: any) {
      console.error('S3 Upload failed:', err);
      setErrorMsg(err.message || 'AWS S3 ରେ ଫଟୋ ଅପଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ।');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Hidden File Input for Native Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
        disabled={isUploading}
      />

      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>{label}</span>
            {required && <span className="text-rose-600 font-black">*</span>}
          </label>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <UploadCloud className="w-3 h-3 text-amber-700" />
            <span>AWS S3 (bhakti-ananda-photos)</span>
          </span>
        </div>
      )}

      {/* Upload in Progress with Real-Time Percentage Display */}
      {isUploading && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-amber-700 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-amber-950">
                  {uploadStage || 'AWS S3 କୁ ଫଟୋ ଅପଲୋଡ୍ ହେଉଛି...'}
                </p>
                <p className="text-[10px] text-amber-800 font-medium">
                  Bucket: bhakti-ananda-photos (ap-south-1)
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-900 bg-amber-200/90 px-3 py-1 rounded-xl font-mono shadow-2xs">
              {uploadPercent}%
            </span>
          </div>

          {/* Real-Time Progress Bar */}
          <div className="w-full bg-amber-200/80 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-200 ease-out flex items-center justify-end"
              style={{ width: `${Math.max(5, uploadPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Mode Selector Tabs: Direct File Upload vs Direct Image URL Input */}
      <div className="flex items-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => {
            setShowUrlInput(false);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
            !showUrlInput
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>ଫାଇଲ୍ ଅପଲୋଡ୍ (Direct File Upload)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setShowUrlInput(true);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
            showUrlInput
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ଇମେଜ୍ URL ଦିଅନ୍ତୁ (Paste Image URL)</span>
        </button>
      </div>

      {/* When Image Exists and Not Currently Uploading: Photo Preview & Control Card */}
      {!isUploading && value && value.trim() && (
        <div className="relative p-3.5 bg-white rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col sm:flex-row items-center gap-3.5">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-900 border-2 border-amber-400 shrink-0 flex items-center justify-center shadow-md">
            <img
              src={value}
              alt="Uploaded Featured Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>ଫଟୋ ସଂଲଗ୍ନ ହୋଇଛି (Featured Image Set)</span>
              </span>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                Social OG Active
              </span>
            </div>
            <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200/80 leading-tight">
              ✅ ଫଟୋ ଅପଲୋଡ୍ ହୋଇଛି (Uploaded successfully)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-300"
              title="Change photo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ବଦଳାନ୍ତୁ (Change)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition cursor-pointer border border-rose-200"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Direct URL Input Mode */}
      {showUrlInput && (
        <div className="p-3.5 bg-white rounded-2xl border-2 border-amber-300 space-y-2">
          <label className="block text-xs font-black text-slate-800">
            🌐 ସିଧାସଳଖ ଫଟୋ URL (Direct Public Image URL for Facebook / WhatsApp / Twitter):
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value.trim())}
              placeholder="https://example.com/photo.jpg or https://...s3.amazonaws.com/..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/30"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* If No Image is Selected and Not Uploading and in File Upload Mode: Interactive Upload Dropzone */}
      {!isUploading && (!value || !value.trim()) && !showUrlInput && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? 'border-amber-500 bg-amber-100/70 scale-[0.99]'
              : 'border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-100/50 shadow-2xs'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-black text-amber-950">
                <span className="text-amber-700 underline underline-offset-2">କ୍ଲିକ୍ କରି ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ</span> କିମ୍ବା ଡ୍ରାଗ୍ କରନ୍ତୁ
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                ଫଟୋ ସିଧାସଳଖ <span className="font-bold text-amber-900">bhakti-ananda-photos</span> AWS S3 ରେ ସେଭ୍ ହେବ
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                JPG, PNG, WEBP
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Instant Social Sharing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✅ ଫଟୋ ୧୦୦% ସଫଳତାର ସହ AWS S3 ରେ ଅପଲୋଡ୍ ଏବଂ ସେଭ୍ ହୋଇଛି!</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-center justify-between text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3.5 py-2 rounded-xl animate-in fade-in">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-600 hover:text-rose-800 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
