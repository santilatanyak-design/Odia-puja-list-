import React, { useState } from 'react';
import { Share2, X, MessageCircle, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonProps {
  productId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  variant?: 'icon' | 'button';
}

export function ShareButton({ productId, title, description, imageUrl, className = "", variant = "icon" }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use direct S3 domain for 100% reliable social media scraping
  const LIVE_BASE_URL = 'https://bhakti-ananda-photos.s3.ap-south-1.amazonaws.com';
  const cleanId = (productId || '').replace(/\.html?$/i, '').replace(/^(\/)?deal\//i, '').replace(/^(\/)?product\//i, '').trim();
  const url = `${LIVE_BASE_URL}/deal/${encodeURIComponent(cleanId)}.html`;

  const shareTitle = `${title} | Bhakti Store`;
  const shareSummary = description ? `${description.slice(0, 140)}...` : 'Verified spiritual deal on Bhakti Store.';
  const shareText = `🚩 ${title}\n${shareSummary}\n${url}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `🚩 ${title}\n${shareSummary}`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error, fallback to modal
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(false);
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedFullWhatsapp = encodeURIComponent(
    `🚩 *${title}*\n\n` +
    `${description ? description.slice(0, 140) + '...\n\n' : ''}` +
    `👉 କିଣିବା କିମ୍ବା ଡିଲ୍ ଦେଖିବା ପାଇଁ ଏହି ଲିଙ୍କ୍ ଖୋଲନ୍ତୁ:\n${url}`
  );

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={handleShare}
          className={`bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors flex items-center justify-center shrink-0 ${className}`}
          title="Share Deal"
        >
          <Share2 className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleShare}
          className={`flex items-center justify-center gap-2 ${className}`}
        >
          <Share2 className="w-5 h-5" /> Share this Deal
        </button>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Share this Deal</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-4 gap-4">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodedFullWhatsapp}`} 
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-600">WhatsApp</span>
              </a>
              
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} 
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Facebook</span>
              </a>
              
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} 
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Twitter</span>
              </a>

              <button 
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-200'}`}>
                  {copied ? <Check className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                </div>
                <span className="text-xs font-semibold text-slate-600">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
