import React from 'react';
import { Smartphone, X, ExternalLink, Share2, MoreVertical, PlusSquare, ArrowUpRight } from 'lucide-react';
import { isIOS, isAndroid, isInAppBrowser, openInNativeChrome } from '../utils/pwaHelper';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'OD' | 'EN';
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  lang = 'OD'
}) => {
  if (!isOpen) return null;

  const inApp = isInAppBrowser();
  const ios = isIOS();
  const android = isAndroid();

  const handleOpenChrome = () => {
    openInNativeChrome();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-2xl shadow-lg">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-300">
              {lang === 'OD' ? 'ମୋବାଇଲ୍ ଆପ୍ ସଂସ୍ଥାପନ (Install App)' : 'Install Mobile App'}
            </h3>
            <p className="text-xs text-slate-300">
              {lang === 'OD' ? 'ଦୈନିକ ପଞ୍ଜିକା ଓ ପୂଜା ସେବା ପାଇଁ ୧-କ୍ଲିକ୍ ଆପ୍' : 'Fast, offline-ready devotional app'}
            </p>
          </div>
        </div>

        {/* Context-Specific Instruction */}
        {inApp && android ? (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 leading-relaxed">
              {lang === 'OD'
                ? 'ଆପଣ Facebook/Instagram ଭିତରେ ଅଛନ୍ତି। ନିମ୍ନ ବଟନ୍ ଦବାଇ Chrome ବ୍ରାଉଜର୍‌ରେ ଖୋଲନ୍ତୁ, ଯାହାଦ୍ୱାରା ତୁରନ୍ତ ଆପ୍ ଡାଉନଲୋଡ୍ ହୋଇପାରିବ।'
                : 'You are viewing inside an In-App browser (Facebook/Instagram). Tap below to open in Google Chrome for 1-click install.'}
            </div>

            <button
              onClick={handleOpenChrome}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{lang === 'OD' ? 'Chrome ରେ ଖୋଲନ୍ତୁ (Open in Chrome)' : 'Open in Google Chrome'}</span>
            </button>
          </div>
        ) : ios ? (
          <div className="space-y-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-200">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>{lang === 'OD' ? 'iPhone / iPad ରେ ଇନଷ୍ଟଲ୍ କରିବା ନିୟମ:' : 'How to install on iPhone/iPad:'}</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lang === 'OD' ? 'Safari ବ୍ରାଉଜର୍‌ର ତଳେ ଥିବା Share ବଟନ୍ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।' : 'Tap the Share button at the bottom of Safari.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <PlusSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lang === 'OD' ? 'ତଳକୁ ସ୍କ୍ରୋଲ୍ କରି "Add to Home Screen" ବାଛନ୍ତୁ।' : 'Scroll down and select "Add to Home Screen".'}</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lang === 'OD' ? 'ଉପର ଡାହାଣ କୋଣରେ "Add" ଦବାନ୍ତୁ।' : 'Tap "Add" in the top right corner.'}</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-200">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>{lang === 'OD' ? 'ମୋବାଇଲ୍ ବ୍ରାଉଜର୍‌ରେ ଇନଷ୍ଟଲ୍ କରିବା ବିଧି:' : 'How to install on Android Chrome:'}</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <MoreVertical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lang === 'OD' ? 'Chrome ର ଉପର ଡାହାଣ କୋଣରେ ଥିବା ୩ଟି ବିନ୍ଦୁ (⋮) ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।' : 'Tap the 3 dots (⋮) in the top-right corner of Chrome.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{lang === 'OD' ? '"Install App" କିମ୍ବା "Add to Home screen" ଚୟନ କରନ୍ତୁ।' : 'Select "Install app" or "Add to Home screen".'}</span>
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          {lang === 'OD' ? 'ବନ୍ଦ କରନ୍ତୁ (Close)' : 'Close'}
        </button>
      </div>
    </div>
  );
};
