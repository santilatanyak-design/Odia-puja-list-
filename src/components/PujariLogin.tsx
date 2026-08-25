import React, { useState } from 'react';
import { Pujari } from '../types';
import { loginPujari, findPujariByPhone, resetPujariPin, requestPasswordReset } from '../lib/api';
import { Language, translations } from '../lib/translations';
import {
  sanitizePin,
  sanitizePhone,
  sanitizeIdentifier,
  sanitizeText,
  isActionThrottled,
  GENERIC_ODIA_ERROR_MESSAGE,
} from '../lib/sanitize';
import {
  UserCheck,
  Sparkles,
  AlertCircle,
  KeyRound,
  UserPlus,
  Lock,
  Search,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Send,
  HelpCircle,
} from 'lucide-react';

interface PujariLoginProps {
  onLoginSuccess: (pujari: Pujari) => void;
  onOpenAdminModal?: () => void;
  lang?: Language;
}

export const PujariLogin: React.FC<PujariLoginProps> = ({
  onLoginSuccess,
  lang = 'OD',
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regVoterPin, setRegVoterPin] = useState('');

  // Recovery Mode States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const [recoveryVoterPin, setRecoveryVoterPin] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredPujari, setRegisteredPujari] = useState<Pujari | null>(null);

  const handleQuickSelect = (sampleId: string, samplePin: string) => {
    setActiveTab('login');
    setIsRecovering(false);
    setLoginIdentifier(sampleId);
    setLoginPin(samplePin);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('login_submit', 1500)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ୧-୨ ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }

    const cleanIdentifier = sanitizeIdentifier(loginIdentifier);
    const cleanPin = sanitizePin(loginPin);

    if (!cleanIdentifier) {
      setErrorMsg('ଦୟାକରି ଆପଣଙ୍କ ପୂଜାରୀ ID କିମ୍ବା ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanPin || cleanPin.length !== 4) {
      setErrorMsg('ଦୟାକରି ଆପଣଙ୍କ ୪-ଅଙ୍କ ଗୁପ୍ତ ପିନ୍ ଦିଅନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginPujari({
        pujariIdOrPhone: cleanIdentifier,
        pin: cleanPin,
        isRegistering: false,
      });

      if (res.success && res.pujari) {
        onLoginSuccess(res.pujari);
      } else {
        setErrorMsg(res.message || 'ଭୁଲ୍ ପିନ୍ କିମ୍ବା ID! ଦୟାକରି ସଠିକ୍ ତଥ୍ୟ ଦିଅନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('register_submit', 2000)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ଅଳ୍ପ ସମୟ ପରେ ଚେଷ୍ଟା କରନ୍ତୁ।');
      return;
    }

    const cleanName = sanitizeText(regName);
    const cleanPhone = sanitizePhone(regPhone);
    const cleanAddress = sanitizeText(regAddress);
    const cleanPin = sanitizePin(regPin);
    const cleanVoterPin = sanitizePin(regVoterPin);

    if (!cleanName) {
      setErrorMsg('ଦୟାକରି ଆପଣଙ୍କ ନାମ ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('ଦୟାକରି ସଠିକ୍ ୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanPin || cleanPin.length !== 4) {
      setErrorMsg('ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଲଗଇନ୍ PIN (Field A) ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanVoterPin || cleanVoterPin.length !== 4) {
      setErrorMsg('ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ Secret Voter ID PIN (Field B) ଦିଅନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginPujari({
        pujariIdOrPhone: cleanPhone,
        pin: cleanPin,
        voterIdPin: cleanVoterPin,
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        isRegistering: true,
      });

      if (res.success && res.pujari) {
        setRegisteredPujari(res.pujari);
      } else {
        setErrorMsg(res.message || 'ପଞ୍ଜୀକରଣ ବିଫଳ ହେଲା। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Register Error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  // RECOVERY: Password Recovery Flow via 4-Digit Voter ID PIN
  const handlePasswordRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('password_recovery', 1500)) {
      setRecoveryError('ଦୟାକରି ୧ ସେକେନ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }

    const cleanUserId = sanitizeIdentifier(recoveryUserId);
    const cleanVoterPin = sanitizePin(recoveryVoterPin);
    const cleanNewPin = sanitizePin(recoveryNewPin);

    if (!cleanUserId) {
      setRecoveryError('ଦୟାକରି ଆପଣଙ୍କ ପୂଜାରୀ User ID (ଯେପରିକି PJR-1001) ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanVoterPin || cleanVoterPin.length !== 4) {
      setRecoveryError('ଦୟାକରି ଆପଣଙ୍କ ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଗୁପ୍ତ Voter ID PIN ଦିଅନ୍ତୁ।');
      return;
    }
    if (!cleanNewPin || cleanNewPin.length !== 4) {
      setRecoveryError('ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ନୂତନ ପୂଜାରୀ PIN (New Pujari PIN) ଦିଅନ୍ତୁ।');
      return;
    }

    try {
      setRecoveryLoading(true);
      setRecoveryError('');
      setRecoverySuccess('');

      const res = await requestPasswordReset({
        pujariId: cleanUserId,
        submittedPin: cleanVoterPin,
        newPin: cleanNewPin,
      });

      if (res.isLocked) {
        setRecoveryError(
          res.message ||
            'Please mail Admin (୨୪ ଘଣ୍ଟା ପାଇଁ ଆକାଉଣ୍ଟ ଲକ୍ ଅଛି। ଦୟାକରି ଆଡମିନ୍ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ - Please mail Admin)'
        );
      } else if (res.success) {
        setRecoverySuccess(
          res.message ||
            'ଆପଣଙ୍କ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ଆଡମିନ୍ ପ୍ୟାନେଲକୁ ପଠାଯାଇଛି! ଆଡମିନ୍ ଯାଞ୍ଚ ପରେ ଅନୁମୋଦନ କରିବେ।'
        );
        setRecoveryUserId('');
        setRecoveryVoterPin('');
        setRecoveryNewPin('');
      } else {
        setRecoveryError(res.message || 'ଅନୁରୋଧ ସମ୍ପାଦନ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ତଥ୍ୟ ଯାଞ୍ଚ କରନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Password Recovery Request Error:', err);
      setRecoveryError(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-3 sm:p-4 py-8 w-full max-w-full overflow-x-hidden box-border">
      {/* Traditional Temple Banner Frame Above Login Card */}
      <div className="w-full max-w-lg mb-4 text-center space-y-1 box-border">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-200/80 text-amber-950 border border-amber-400 rounded-full text-xs font-black shadow-2xs">
          <span>🚩 ଜୟ ଜଗନ୍ନାଥ</span>
          <span>•</span>
          <span>ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ, ପୁରୀ</span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border-2 border-amber-300 relative box-border">
        {/* Top Header Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#701a1e] via-[#8B0000] to-amber-800 text-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-md mb-3 font-bold border-2 border-amber-400">
            <span className="text-3xl font-serif">🕉️</span>
          </div>
          <h2 className="text-2xl font-black text-amber-950 tracking-tight">{t.title}</h2>
          <p className="text-xs text-amber-900/80 font-bold mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Highlight 1st List Free Banner */}
        {!isRecovering && (
          <div className="mb-5 p-4 bg-gradient-to-r from-amber-100/80 via-amber-200/60 to-amber-100/80 border-2 border-amber-400/80 rounded-2xl flex items-start gap-3 shadow-2xs">
            <Sparkles className="w-6 h-6 text-amber-900 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <span className="font-black text-sm block mb-0.5">🎉 {t.freeBenefitTitle}</span>
              <span className="font-bold leading-relaxed">
                {t.freeBenefitDesc}
              </span>
            </div>
          </div>
        )}

        {/* Quick Sample Login Option */}
        {!isRecovering && (
          <div className="mb-5 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
            <div className="text-xs font-black text-amber-950 mb-2 flex items-center justify-between">
              <span>{t.presetLoginText}</span>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black border border-amber-400">
                PIN: 1234
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('PJR-1001', '1234')}
                className="p-2.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition cursor-pointer shadow-2xs"
              >
                <div className="text-xs font-black text-amber-950">PJR-1001</div>
                <div className="text-xs text-amber-900 font-bold truncate">
                  {lang === 'OD' ? 'ପଣ୍ଡିତ ରମେଶ ଶର୍ମା' : 'Pt. Ramesh Sharma'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('PJR-1002', '1234')}
                className="p-2.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition cursor-pointer shadow-2xs"
              >
                <div className="text-xs font-black text-amber-950">PJR-1002</div>
                <div className="text-xs text-amber-900 font-bold truncate">
                  {lang === 'OD' ? 'ପଣ୍ଡିତ ସୁରେଶ ଶାସ୍ତ୍ରୀ' : 'Pt. Suresh Shastri'}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* RECOVERY VIEW vs NORMAL VIEW */}
        {isRecovering ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => {
                  setIsRecovering(false);
                  setRecoveryError('');
                  setRecoverySuccess('');
                  setRecoveryUserId('');
                  setRecoveryVoterPin('');
                  setRecoveryNewPin('');
                }}
                className="text-xs font-extrabold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ଫେରନ୍ତୁ (Back)</span>
              </button>
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                ପାସୱାର୍ଡ ରିକଭରୀ (Password Recovery)
              </span>
            </div>

            <form onSubmit={handlePasswordRecoverySubmit} className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 text-xs text-amber-950 font-medium">
                <span className="font-extrabold block mb-1">🔐 ପାସୱାର୍ଡ ରିକଭରୀ ସୂଚନା (4-Digit Secret PIN Recovery)</span>
                <p className="leading-relaxed text-[11px]">
                  ଆପଣଙ୍କ <strong>User ID</strong>, <strong>୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଗୁପ୍ତ Voter ID PIN</strong> ଏବଂ <strong>ନୂତନ ପୂଜାରୀ PIN</strong> ପ୍ରବେଶ କରନ୍ତୁ। ଏହି ଅନୁରୋଧ ଆଡମିନ୍ ପ୍ୟାନେଲକୁ ଯିବ ଏବଂ ଆଡମିନ୍ ଅନୁମୋଦନ କଲେ ଆପଣଙ୍କ PIN ବଦଳିଯିବ।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  (A) ପୂଜାରୀ User ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PJR-1001"
                  value={recoveryUserId}
                  onChange={(e) => setRecoveryUserId(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-extrabold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  (B) ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଗୁପ୍ତ Voter ID PIN <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="[0-9]*"
                  placeholder="••••"
                  value={recoveryVoterPin}
                  onChange={(e) => setRecoveryVoterPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-lg tracking-widest text-center focus:ring-2 focus:ring-amber-500 outline-none font-mono font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  (C) ନୂତନ ପୂଜାରୀ PIN (New Pujari PIN) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="[0-9]*"
                  placeholder="••••"
                  value={recoveryNewPin}
                  onChange={(e) => setRecoveryNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-lg tracking-widest text-center focus:ring-2 focus:ring-amber-500 outline-none font-mono font-black"
                />
                <span className="text-[10px] text-amber-900 font-bold block mt-1">
                  (ଆଡମିନ୍ ଅନୁମୋଦନ କଲେ ଏହି ନୂତନ PIN ଆପଣଙ୍କ ଲଗଇନ୍ PIN ଭାବେ ସେଟ୍ ହେବ)
                </span>
              </div>

              {recoveryError && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 font-bold animate-in fade-in">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold block text-rose-950 text-sm">⚠️ ରିକଭରୀ ସୁରକ୍ଷା ବାରଣ:</span>
                    <p className="leading-relaxed">{recoveryError}</p>
                  </div>
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold block text-emerald-950 text-sm">✅ ଅନୁରୋଧ ଆଡମିନ୍‌ଙ୍କ ପାଖକୁ ପଠାଗଲା</span>
                    <p className="leading-relaxed">{recoverySuccess}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={recoveryLoading}
                className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {recoveryLoading ? 'ଆଡମିନ୍ଙ୍କୁ ପଠାଯାଉଛି...' : 'ଆଡମିନ୍ଙ୍କୁ ରିସେଟ୍ ଅନୁରୋଧ ପଠାନ୍ତୁ (Send Reset Request)'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Switcher: Login vs Register */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.loginBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerBtn}</span>
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.mobileLabel} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.mobilePlaceholder}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-extrabold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>{t.pinLabel} <span className="text-rose-600">*</span></span>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" /> Encrypted
                    </span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-lg tracking-widest text-center focus:ring-2 focus:ring-amber-500 outline-none font-mono font-black"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 font-bold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  {loading ? t.loggingIn : t.enterBtn}
                </button>

                {/* Forgot ID / PIN Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setRecoveryUserId('');
                      setRecoveryVoterPin('');
                      setRecoveryError('');
                      setRecoverySuccess('');
                    }}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    {t.forgotPinLink}
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.regFullName} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.regFullNamePlaceholder}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {t.regMobileNumber} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">{t.regAddress}</label>
                    <input
                      type="text"
                      placeholder={t.regAddressPlaceholder}
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Field A & Field B: Dedicated Login PIN and Secret Voter ID PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      Field A: 4-Digit Login PIN <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      pattern="[0-9]*"
                      placeholder="••••"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base tracking-widest text-center focus:ring-2 focus:ring-amber-500 outline-none font-mono font-black"
                    />
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      (ଦୈନନ୍ଦିନ ଲଗଇନ୍ ପାଇଁ ବ୍ୟବହୃତ ହେବ)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      Field B: Secret Voter ID (4 Digits) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      pattern="[0-9]*"
                      placeholder="••••"
                      value={regVoterPin}
                      onChange={(e) => setRegVoterPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base tracking-widest text-center focus:ring-2 focus:ring-amber-500 outline-none font-mono font-black"
                    />
                    <span className="text-[10px] text-amber-900 font-bold block mt-1">
                      (ପାସୱାର୍ଡ ରିକଭରୀ ଓ ଯାଞ୍ଚ ପାଇଁ ଗୁପ୍ତ ରହିବ)
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 font-bold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  {loading ? t.registering : t.regSubmitBtn}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Auto-Generated Pujari ID Registration Success Modal */}
      {registeredPujari && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-amber-400 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-sm">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              {t.regSuccessTitle}
            </h3>
            <p className="text-xs text-slate-600 font-bold mb-4">
              {registeredPujari.name}, {t.regSuccessSubtitle}
            </p>

            {/* Auto Generated Pujari ID Highlight Card */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 mb-4 text-center shadow-inner">
              <span className="text-xs font-bold text-amber-900 block mb-1 uppercase tracking-wider">
                {t.autoPujariIdLabel}
              </span>
              <div className="text-3xl font-black text-amber-950 tracking-widest font-mono bg-white py-2 px-4 rounded-xl border border-amber-300 inline-block my-1 shadow-sm">
                {registeredPujari.id}
              </div>
              <p className="text-xs font-extrabold text-amber-950 mt-2 leading-relaxed">
                "{t.regSuccessNote1}{' '}
                <strong className="text-amber-800">{registeredPujari.id}</strong>{t.regSuccessNote2}"
              </p>
            </div>

            <button
              onClick={() => {
                const p = registeredPujari;
                setRegisteredPujari(null);
                onLoginSuccess(p);
              }}
              className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-2xl text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t.enterPortalBtn}</span>
              <UserCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
