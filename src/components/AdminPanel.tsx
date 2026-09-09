import React, { useState, useEffect } from 'react';
import { 
  PackageOpen, 
  ArrowLeft, 
  Image as ImageIcon, 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Cloud
} from 'lucide-react';
import { AdminAffiliateManagement } from './AdminAffiliateManagement';
import { AdminSliderManagement } from './AdminSliderManagement';
import { AdminAwsSettings } from './AdminAwsSettings';

const AWS_AUTH_STORAGE_KEY = 'bhakti_aws_admin_session_auth';

type AdminTab = 'affiliate' | 'sliders' | 'settings';

interface AdminPanelProps {
  onBack: () => void;
  onLogout?: () => void;
  lang?: string;
}

export function AdminPanel({ onBack, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('affiliate');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [checkingInitialAuth, setCheckingInitialAuth] = useState<boolean>(true);

  // Security Lock: Verify existing active session on mount
  useEffect(() => {
    try {
      const storedAuth = sessionStorage.getItem(AWS_AUTH_STORAGE_KEY);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (
          parsed &&
          parsed.email === 'nayakjitu986@gmail.com' &&
          parsed.token &&
          parsed.isAuthenticated === true
        ) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem(AWS_AUTH_STORAGE_KEY);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      sessionStorage.removeItem(AWS_AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
    } finally {
      setCheckingInitialAuth(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const email = authEmail.trim();
    const password = authPassword;

    // 1. Strict Credential Check:
    // Email MUST exactly match: "nayakjitu986@gmail.com"
    // Password MUST exactly match: "543213"
    if (email === 'nayakjitu986@gmail.com' && password === '543213') {
      const sessionData = {
        email: 'nayakjitu986@gmail.com',
        isAuthenticated: true,
        token: `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        timestamp: Date.now()
      };
      sessionStorage.setItem(AWS_AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setAuthLoading(false);
      setAuthError('');
      setAuthPassword('');
    } else {
      // 2. Reject Everything Else:
      setIsAuthenticated(false);
      sessionStorage.removeItem(AWS_AUTH_STORAGE_KEY);
      setAuthError('Access Denied');
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(AWS_AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    if (onLogout) onLogout();
  };

  if (checkingInitialAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verifying Security Credentials...</p>
      </div>
    );
  }

  // Security Lock: If not authenticated, dashboard is completely blocked
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-amber-500/20">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Bhakti Store
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Admin Portal Login</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xs font-medium">
                Enter your administrative credentials to manage store products and promotions.
              </p>
            </div>

            {/* Bold Red Error Message on Failed Authentication */}
            {authError && (
              <div className="mb-6 p-4 bg-red-950/50 border-2 border-red-600 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-bold text-red-500 tracking-wide">{authError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => {
                      setAuthEmail(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Enter email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => {
                      setAuthPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login to Admin Panel</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Protected Admin Area
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white"
                title="Return to Store"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Admin Control Panel
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authenticated Administrator</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700 rounded-xl transition-colors text-xs font-bold text-slate-300 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> 
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-28">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('affiliate')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === 'affiliate' 
                    ? 'bg-amber-50/70 text-slate-900 border-l-4 border-amber-500' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <PackageOpen className={`w-5 h-5 ${activeTab === 'affiliate' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Manage Products</span>
              </button>
              
              <button
                onClick={() => setActiveTab('sliders')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-colors border-t border-slate-100 cursor-pointer ${
                  activeTab === 'sliders' 
                    ? 'bg-amber-50/70 text-slate-900 border-l-4 border-amber-500' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <ImageIcon className={`w-5 h-5 ${activeTab === 'sliders' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Inline Ad Banners</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-colors border-t border-slate-100 cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-amber-50/70 text-slate-900 border-l-4 border-amber-500' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <Cloud className={`w-5 h-5 ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>AWS S3 Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-[500px]">
          {activeTab === 'affiliate' && <AdminAffiliateManagement />}
          {activeTab === 'sliders' && <AdminSliderManagement />}
          {activeTab === 'settings' && <AdminAwsSettings />}
        </div>

      </div>
    </div>
  );
}
