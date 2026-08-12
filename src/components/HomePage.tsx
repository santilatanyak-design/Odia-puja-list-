import React from 'react';
import { Pujari } from '../types';
import { Sparkles, ShoppingBag, ScrollText, CheckCircle2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface HomePageProps {
  activePujari: Pujari | null;
  onNavigateToCreateList: () => void;
  onNavigateToStore: () => void;
  onNavigateToLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activePujari,
  onNavigateToCreateList,
  onNavigateToStore,
  onNavigateToLogin,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 box-border">
      {/* Sacred Welcome Header */}
      <div className="text-center space-y-2 box-border">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-200/90 text-amber-950 border border-amber-400 rounded-full text-xs font-black shadow-2xs">
          <span>🚩 ଜୟ ଜଗନ୍ନାଥ</span>
          <span>•</span>
          <span>ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ, ପୁରୀ</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-amber-950 tracking-tight">
          ପୂଜା ସାମଗ୍ରୀ ଏବଂ ପୂଜାରୀ ପୋର୍ଟାଲ୍
        </h2>
        <p className="text-xs sm:text-sm text-amber-900/90 font-bold max-w-2xl mx-auto leading-relaxed">
          ଓଡ଼ିଶାର ସମସ୍ତ ପୂଜକ, ପଣ୍ଡିତ ଏବଂ ଶ୍ରଦ୍ଧାଳୁଙ୍କ ପାଇଁ ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି ଏବଂ ଦୋକାନ ସେବା।
        </p>

        {activePujari && (
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-950 text-amber-300 rounded-full text-xs font-black border border-amber-400">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ଆପଣ ଲଗଇନ୍ ଅଛନ୍ତି: {activePujari.name} ({activePujari.id})</span>
            </span>
          </div>
        )}
      </div>

      {/* TWO LARGE PROMINENT POSTER / BANNER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Card 1: Create Puja List */}
        <div
          onClick={onNavigateToCreateList}
          className="bg-gradient-to-br from-[#5c0f12] via-[#8B0000] to-[#3a0608] text-white border-2 sm:border-3 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group hover:shadow-3xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[290px]"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-400/25 transition-all pointer-events-none" />
          <div className="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/25 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>୧ - ପୂଜା ଲିଷ୍ଟ୍ ସେବା</span>
              </span>
              <div className="w-14 h-14 bg-amber-400/20 border-2 border-amber-400/60 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                📜
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
                <span>୧- ପୂଜା ଲିଷ୍ଟ୍ ତିଆରି କରନ୍ତୁ</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 font-bold mt-1">
                (Create Puja Samagri List)
              </p>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-3 leading-relaxed">
                ସହଜରେ ପୂଜା ତଥ୍ୟ ପୂରଣ କରନ୍ତୁ, ନୂତନ ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି କରନ୍ତୁ ଏବଂ ସୁନ୍ଦର Odia PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1">
              <span>⚡ ୧ମ ସୂଚୀ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା (Free)</span>
            </span>
            <button
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 group-hover:px-6 cursor-pointer"
            >
              <span>{activePujari ? 'ଲିଷ୍ଟ ତିଆରି କରନ୍ତୁ' : 'ପ୍ରବେଶ କରନ୍ତୁ'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Order from Puja Store */}
        <div
          onClick={onNavigateToStore}
          className="bg-gradient-to-br from-[#3b080b] via-[#701a1e] to-amber-950 text-white border-2 sm:border-3 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group hover:shadow-3xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[260px] sm:min-h-[290px]"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-400/25 transition-all pointer-events-none" />
          <div className="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/25 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span>🚚</span>
                <span>Cash on Delivery (COD)</span>
              </span>
              <div className="w-14 h-14 bg-amber-400/20 border-2 border-amber-400/60 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                🛍️
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
                <span>୨- ପୂଜା ଦୋକାନରୁ କିଣନ୍ତୁ</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 font-bold mt-1">
                (Order from Puja Store)
              </p>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-3 leading-relaxed">
                ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ, ଯଜ୍ଞ କାଠ, ଘିଅ ଏବଂ ସମ୍ପୂର୍ଣ୍ଣ ପୂଜା କିଟ୍ ଘରେ ବସି ସହଜରେ ଅର୍ଡର୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1">
              <span>📦 ସିଧାସଳଖ ଘରକୁ ହୋମ୍ ଡେଲିଭରୀ</span>
            </span>
            <button
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 group-hover:px-6 cursor-pointer"
            >
              <span>ଅର୍ଡର୍ କରନ୍ତୁ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Login / Portal Button for Registered Pujaris */}
      {!activePujari ? (
        <div className="bg-amber-100/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-950 font-black text-sm sm:text-base">
            <ShieldCheck className="w-5 h-5 text-amber-800" />
            <span>ପୂଜାରୀ / ପଣ୍ଡିତ ଅକାଉଣ୍ଟ୍ ଲଗଇନ୍ କିମ୍ବା ପଞ୍ଜୀକରଣ (Pujari Login)</span>
          </div>
          <p className="text-xs text-amber-900 font-bold">
            ଯଦି ଆପଣ ପ୍ରଥମଥର ଆସିଛନ୍ତି, ତେବେ ୧ ମିନିଟ୍ ମଧ୍ୟରେ ମାଗଣାରେ ଆକାଉଣ୍ଟ ଖୋଲି ୧ମ ସୂଚୀ ତିଆରି କରନ୍ତୁ।
          </p>
          <button
            onClick={onNavigateToLogin}
            type="button"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-800 to-amber-950 text-amber-200 hover:text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            🔑 ପୂଜାରୀ ଲଗଇନ୍ / ରେଜିଷ୍ଟ୍ରେସନ୍ କରନ୍ତୁ
          </button>
        </div>
      ) : (
        <div className="bg-amber-100/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center space-y-2">
          <div className="text-xs sm:text-sm font-black text-amber-950">
            ସ୍ୱାଗତମ୍! ଆପଣ ଲଗଇନ୍ ହୋଇସାରିଛନ୍ତି। ଆପଣଙ୍କ ପୂଜାରୀ ଡାସବୋର୍ଡକୁ ଯାଆନ୍ତୁ:
          </div>
          <button
            onClick={onNavigateToCreateList}
            type="button"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-800 to-amber-950 text-amber-200 hover:text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            🙏 ପୂଜାରୀ ଡାସବୋର୍ଡ (Pujari Dashboard) କୁ ଯାଆନ୍ତୁ
          </button>
        </div>
      )}
    </div>
  );
};
