import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon, Trash2, Image as ImageIcon, Settings, Key, Sparkles } from 'lucide-react';
import { uploadPhotoToS3, getClientAwsConfig, optimizeImage } from '../lib/s3Upload';
import { AdminAwsSettings } from './AdminAwsSettings';

export interface S3PhotoUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onUploadSuccess?: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  aspectRatio?: '16:9' | '1:1' | 'auto';
  className?: string;
}

export const S3PhotoUploader: React.FC<S3PhotoUploaderProps> = ({
  value = '',
  onChange,
  onUploadSuccess,
  folder = 'slider',
  label = 'ଇମେଜ୍ ଅପଲୋଡ୍ (Image Upload to AWS S3)',
  placeholder = 'https://...',
  required = false,
  aspectRatio = '16:9',
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const awsConfig = getClientAwsConfig();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastSelectedFile(file);
    await executeUpload(file);
  };

  const executeUpload = async (file: File) => {
    // Reset state
    setErrorMsg('');
    setUploading(true);
    setProgress(5);
    setProgressStage('ଛବି ପ୍ରସ୍ତୁତ ହେଉଛି...');

    try {
      const s3Url = await uploadPhotoToS3(file, folder, (percent, stage) => {
        setProgress(percent);
        if (stage) setProgressStage(stage);
      });

      if (s3Url) {
        onChange?.(s3Url);
        onUploadSuccess?.(s3Url);
        setProgress(100);
        setProgressStage('✅ AWS S3 କୁ ସଫଳତାର ସହ ଅପଲୋଡ୍ ହେଲା!');
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setProgressStage('');
        }, 1500);
      } else {
        throw new Error('Upload failed - empty URL returned');
      }
    } catch (err: any) {
      console.error('S3 upload error:', err);
      setErrorMsg(err.message || 'AWS S3 କୁ ଅପଲୋଡ୍ କରିବାରେ ବିଫଳ ହେଲା। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।');
      setUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFallbackCompressed = async () => {
    if (!lastSelectedFile) return;
    try {
      setUploading(true);
      setProgressStage('କମ୍ପ୍ରେସ୍ ହେଉଛି...');
      const optimized = await optimizeImage(lastSelectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange?.(base64);
        onUploadSuccess?.(base64);
        setUploading(false);
        setErrorMsg('');
        setProgressStage('');
      };
      reader.readAsDataURL(optimized);
    } catch (err: any) {
      setUploading(false);
      setErrorMsg('କମ୍ପ୍ରେସନ୍ ବିଫଳ ହେଲା: ' + err.message);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    onUploadSuccess?.('');
  };

  const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Settings Modal */}
      {showSettingsModal && (
        <AdminAwsSettings
          isModal
          onClose={() => setShowSettingsModal(false)}
          onSaved={() => {
            setShowSettingsModal(false);
            setErrorMsg('');
            if (lastSelectedFile) {
              executeUpload(lastSelectedFile);
            }
          }}
        />
      )}

      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black text-slate-800 tracking-wide">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="text-[10px] font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              title="AWS S3 Keys Settings"
            >
              <Key className="w-3 h-3 text-amber-600" />
              <span>S3 Keys</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Hide URL' : 'Image URL'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview or Upload Trigger Area */}
      {value ? (
        <div className="space-y-2">
          <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-300 shadow-sm group`}>
            <img
              src={value}
              alt="Uploaded Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
              }}
            />
            {aspectRatio === '16:9' && (
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md border border-white/20">
                16:9 Banner
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-amber-600" />
                <span>Change (ବଦଳାନ୍ତୁ)</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative w-full ${aspectClass} rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group`}
        >
          {uploading ? (
            <div className="space-y-3 w-full max-w-xs px-4">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <div className="text-xs font-black text-amber-950">{progressStage || 'AWS S3 କୁ ଅପଲୋଡ୍ ହେଉଛି...'}</div>
              <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-amber-800">{progress}%</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#8B0000] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-slate-800">
                  {aspectRatio === '16:9' ? '୧୬:୯ ବ୍ୟାନର୍ ଛବି ଅପଲୋଡ୍ କରନ୍ତୁ' : 'ଡିଭାଇସ୍‌ରୁ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Click to choose file from device (Direct AWS S3 Upload)
                </div>
              </div>
              {aspectRatio === '16:9' && (
                <span className="inline-block text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                  Strict 16:9 Widescreen Ratio
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Uploading indicator bar if triggered while existing image displayed */}
      {uploading && value && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              {progressStage || 'AWS S3 Uploading...'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message & Actionable Recovery */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-semibold space-y-2.5 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-bold leading-relaxed">{errorMsg}</div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>⚙️ AWS S3 ସେଟିଂସ୍ ଖୋଲନ୍ତୁ (Enter AWS Keys)</span>
            </button>

            {lastSelectedFile && (
              <button
                type="button"
                onClick={handleFallbackCompressed}
                disabled={uploading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Save As Compressed Image (କମ୍ପ୍ରେସ୍ ଫଟୋ ବ୍ୟବହାର କରନ୍ତୁ)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual URL Input Fallback */}
      {showUrlInput && (
        <div className="pt-1">
          <div className="flex rounded-xl shadow-xs overflow-hidden border border-slate-300 focus-within:border-amber-500">
            <span className="inline-flex items-center px-3 bg-slate-100 text-slate-500 text-xs">
              <LinkIcon className="w-3.5 h-3.5" />
            </span>
            <input
              type="url"
              value={value}
              onChange={(e) => {
                onChange?.(e.target.value);
                onUploadSuccess?.(e.target.value);
              }}
              placeholder={placeholder}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
