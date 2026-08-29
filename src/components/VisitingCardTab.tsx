import React, { useState } from 'react';
import { Pujari, QrConfig } from '../types';
import { VisitingCard } from './VisitingCard';
import { S3PhotoUploader } from './S3PhotoUploader';
import {
  Sparkles,
  Edit3,
  Check,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface VisitingCardTabProps {
  pujari: Pujari;
  qrConfig?: QrConfig;
  onRefreshPujari?: () => void;
  onSubmitUtr?: (utrRef: string) => Promise<void>;
  onUpdateProfile?: (updatedData: Partial<Pujari>) => Promise<void>;
}

const DEFAULT_SPECIALIZATIONS = [
  'ଗୃହ ପ୍ରବେଶ',
  'ସତ୍ୟନାରାୟଣ ପୂଜା',
  'ବିବାହ ବ୍ରତ',
  'ନାମ ଯଜ୍ଞ',
  'ରୁଦ୍ରାଭିଷେକ',
  'ବାସ୍ତୁ ପୂଜା',
  'ନବଗ୍ରହ ଶାନ୍ତି',
  'ଶ୍ରାଦ୍ଧ କର୍ମ',
];

const ORDER_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSexBKl72HKhKqPxB9K7DpcoAFyIPcRNnGlz2BW4QMJycgoHng/viewform';

export const VisitingCardTab: React.FC<VisitingCardTabProps> = ({
  pujari,
  onUpdateProfile,
}) => {
  // Profile customization states for preview
  const [title, setTitle] = useState(
    pujari.title || 'ଅଭିଜ୍ଞ ବୈଦିକ ପୂଜାରୀ ଓ ଜ୍ୟୋତିଷ ବିଶାରଦ'
  );
  const [specializations, setSpecializations] = useState<string[]>(
    pujari.specializations && pujari.specializations.length > 0
      ? pujari.specializations
      : ['ଗୃହ ପ୍ରବେଶ', 'ସତ୍ୟନାରାୟଣ ପୂଜା', 'ବିବାହ ବ୍ରତ', 'ନାମ ଯଜ୍ଞ', 'ରୁଦ୍ରାଭିଷେକ']
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(pujari.profilePhotoUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Handle Tag Toggle
  const handleToggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      if (specializations.length === 1) return; // Keep at least 1
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      if (specializations.length >= 6) return; // Limit to 6
      setSpecializations([...specializations, spec]);
    }
  };

  // Save profile updates to Pujari document
  const handleSaveProfile = async () => {
    if (onUpdateProfile) {
      await onUpdateProfile({
        title,
        specializations,
        profilePhotoUrl,
      });
      setSaveSuccessMsg('ପ୍ରୋଫାଇଲ୍ ସଫଳତାର ସହ ଅପଡେଟ୍ ହେଲା!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-4 py-3">
      {/* SECTION HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white p-4 sm:p-6 rounded-3xl shadow-xl border-2 border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎴</span>
            <h2 className="text-lg sm:text-2xl font-black text-amber-100 tracking-tight">
              ଡିଜିଟାଲ୍ ଭିଜିଟିଂ କାର୍ଡ (Digital Visiting Card)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
            ଆମ ଷ୍ଟୁଡିଓ ଦ୍ୱାରା ଆପଣଙ୍କ ନିଜସ୍ୱ ପ୍ରୋଫେସନାଲ୍ Odia Devotional Visiting Card ଡିଜାଇନ୍ କରାନ୍ତୁ
          </p>
        </div>
      </div>

      {/* CARD SAMPLE PREVIEW CONTAINER */}
      <div className="bg-amber-50/80 border-2 border-amber-200 rounded-3xl p-4 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>ସାମ୍ପୁଲ୍ ପ୍ରିଭ୍ୟୁ (Sample Preview)</span>
          </h3>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs border border-amber-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'ପ୍ରିଭ୍ୟୁ ଦେଖନ୍ତୁ' : 'ତଥ୍ୟ ବଦଳାନ୍ତୁ (Edit)'}</span>
          </button>
        </div>

        {/* CUSTOMIZATION DRAWER FORM */}
        {isEditing && (
          <div className="p-4 bg-white border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              କାର୍ଡ ତଥ୍ୟ କଷ୍ଟମାଇଜ୍ କରନ୍ତୁ:
            </h4>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                ପଦବୀ / Title (e.g. ଅଭିଜ୍ଞ ବୈଦିକ ପୂଜାରୀ):
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                ବିଶେଷଜ୍ଞତା (Specializations - Choose up to 5):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SPECIALIZATIONS.map((spec) => {
                  const selected = specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleToggleSpecialization(spec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        selected
                          ? 'bg-amber-700 text-white border-amber-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      }`}
                    >
                      {selected && '✓ '}
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
              <S3PhotoUploader
                value={profilePhotoUrl}
                onChange={(url) => setProfilePhotoUrl(url)}
                folder="photos"
                label="ପ୍ରୋଫାଇଲ୍ ଫଟୋ (Visiting Card Profile Photo / S3 Storage)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ସେଭ୍ କରନ୍ତୁ (Save Changes)</span>
              </button>
            </div>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* 16:9 CARD SAMPLE PREVIEW COMPONENT */}
        <div className="flex items-center justify-center py-2 overflow-x-auto">
          <VisitingCard
            pujari={pujari}
            title={title}
            specializations={specializations}
            profilePhotoUrl={profilePhotoUrl}
          />
        </div>

        {/* PREMIUM SERVICE BANNER & ORDER BUTTON */}
        <div className="mt-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 border-2 border-amber-400 rounded-2xl p-5 text-center shadow-md space-y-4">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-black text-amber-950">
              ପ୍ରିମିୟମ୍ HD ଭିଜିଟିଂ କାର୍ଡ (Premium HD Visiting Card)
            </h4>
            <p className="text-xs sm:text-sm font-bold text-amber-900 max-w-xl mx-auto leading-relaxed">
              ଆମ ଷ୍ଟୁଡିଓ ଦ୍ୱାରା ନିଜର ଏକ ସୁନ୍ଦର ଭିଜିଟିଂ କାର୍ଡ ଡିଜାଇନ୍ କରାନ୍ତୁ।
            </p>
          </div>

          <div className="pt-1 flex justify-center">
            <a
              href={ORDER_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-red-800 via-red-700 to-red-800 hover:from-red-900 hover:to-red-800 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg border-2 border-amber-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Order Now (ଏବେ ଅର୍ଡର କରନ୍ତୁ)</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </div>

      {/* FEATURE HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-black shrink-0">
            🎨
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950">Custom Design</h4>
            <p className="text-[11px] text-slate-600 font-medium">
              ଆମ ପ୍ରୋଫେସନାଲ୍ ଡିଜାଇନରଙ୍କ ଦ୍ୱାରା ପ୍ରସ୍ତୁତ
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-black shrink-0">
            📱
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950">Dynamic QR Code</h4>
            <p className="text-[11px] text-slate-600 font-medium">
              ସ୍କାନ୍ କରି ସିଧା କଲ୍ କିମ୍ବା କଣ୍ଟାକ୍ଟ ସେଭ୍
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-black shrink-0">
            ✨
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950">High Quality HD</h4>
            <p className="text-[11px] text-slate-600 font-medium">
              ପ୍ରିଣ୍ଟ-ରେଡି ହାଇ-ରିଜୋଲ୍ୟୁସନ୍ ଆଉଟପୁଟ୍
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
