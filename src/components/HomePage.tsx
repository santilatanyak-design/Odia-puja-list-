import React from 'react';
import { Pujari } from '../types';
import {
  Sparkles,
  ShoppingBag,
  ScrollText,
  Calendar,
  BookOpen,
  Video,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface HomePageProps {
  activePujari: Pujari | null;
  onNavigateToCreateList: () => void;
  onNavigateToStore: () => void;
  onNavigateToTemple?: () => void;
  onNavigateToPanchang?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToShorts?: () => void;
  onNavigateToLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activePujari,
  onNavigateToCreateList,
  onNavigateToStore,
  onNavigateToTemple,
  onNavigateToPanchang,
  onNavigateToBlog,
  onNavigateToShorts,
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

      {/* TOP PRIMARY CARDS: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Section 1: Create Puja List */}
        <div
          id="home-card-create-list"
          onClick={onNavigateToCreateList}
          className="bg-gradient-to-br from-[#5c0f12] via-[#8B0000] to-[#3a0608] text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[250px]"
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>୧ - ପୂଜା ଲିଷ୍ଟ୍ ସେବା</span>
              </span>
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/60 rounded-2xl flex items-center justify-center text-2xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                📜
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight">
                ୧- ପୂଜା ଲିଷ୍ଟ୍ ତିଆରି କରନ୍ତୁ
              </h3>
              <p className="text-xs text-amber-200/90 font-bold mt-0.5">
                (Create Puja Samagri List)
              </p>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-2 leading-relaxed">
                ସହଜରେ ପୂଜା ତଥ୍ୟ ପୂରଣ କରନ୍ତୁ, ନୂତନ ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି କରନ୍ତୁ ଏବଂ ସୁନ୍ଦର Odia PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-3 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-black text-amber-300">
              ⚡ ୧ମ ସୂଚୀ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା (Free)
            </span>
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:px-5 cursor-pointer"
            >
              <span>{activePujari ? 'ଲିଷ୍ଟ ତିଆରି କରନ୍ତୁ' : 'ପ୍ରବେଶ କରନ୍ତୁ'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Section 2: Order from Puja Store */}
        <div
          id="home-card-puja-store"
          onClick={onNavigateToStore}
          className="bg-gradient-to-br from-[#3b080b] via-[#701a1e] to-amber-950 text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[250px]"
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span>🚚</span>
                <span>Cash on Delivery (COD)</span>
              </span>
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/60 rounded-2xl flex items-center justify-center text-2xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                🛍️
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight">
                ୨- ପୂଜା ଦୋକାନରୁ କିଣନ୍ତୁ
              </h3>
              <p className="text-xs text-amber-200/90 font-bold mt-0.5">
                (Order from Puja Store)
              </p>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-2 leading-relaxed">
                ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ, ଯଜ୍ଞ କାଠ, ଘିଅ ଏବଂ ସମ୍ପୂର୍ଣ୍ଣ ପୂଜା କିଟ୍ ଘରେ ବସି ସହଜରେ ଅର୍ଡର୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-3 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300">
              📦 ସିଧାସଳଖ ଘରକୁ ହୋମ୍ ଡେଲିଭରୀ
            </span>
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:px-5 cursor-pointer"
            >
              <span>ଅର୍ଡର୍ କରନ୍ତୁ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ADDITIONAL SECTIONS: Unique Full-Width Feature Cards in Sequential 1-to-6 Order */}
      <div className="space-y-4 sm:space-y-5">
        {/* Section 3: Temple Puja & Jal Abhishek Booking */}
        <div
          id="home-card-temple-booking"
          onClick={onNavigateToTemple}
          className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#4a0b0e] text-white border-2 border-amber-400 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-black rounded-full text-xs inline-flex items-center gap-1.5">
              <span>🚩 ନୂତନ ସେବା (NEW)</span>
              <span>•</span>
              <span>Platform Fee ₹5</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight">
              ୩- ମନ୍ଦିର ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ (Temple Puja Booking)
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed">
              ଲିଙ୍ଗରାଜ, ଶ୍ରୀମନ୍ଦିର ଓ ସମଲେଶ୍ୱରୀ ପୀଠରେ ଜଳାଭିଷେକ ଓ ପୂଜା ବୁକିଂ କରନ୍ତୁ। ଅନୁମୋଦନ ପରେ ଅଫିସିଆଲ୍ JPG ରସିଦ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
            </p>
          </div>

          <button
            type="button"
            className="relative z-10 px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer border border-amber-200"
          >
            <span>🚩 ବୁକିଂ କରନ୍ତୁ (Book Now)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Section 4: Daily Odia Panchang */}
        <div
          id="home-card-panchang"
          onClick={onNavigateToPanchang}
          className="bg-gradient-to-r from-[#4d1014] via-[#7a181e] to-[#36080b] text-white border-2 border-amber-400 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-black rounded-full text-xs inline-flex items-center gap-1.5 backdrop-blur-xs">
              <span>📅 ଶ୍ରୀକ୍ଷେତ୍ର ପଞ୍ଜିକା</span>
              <span>•</span>
              <span>ଦୈନିକ ଶୁଭ ବେଳା ଓ ରାହୁକାଳ</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
              <span>୪- ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା (Daily Odia Panchang)</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed">
              ଆଜିର ତିଥି, ନକ୍ଷତ୍ର, ପକ୍ଷ, ଅମୃତ ବେଳା, ରାହୁକାଳ, ବ୍ରାହ୍ମ ମୁହୂର୍ତ୍ତ, ସୂର୍ଯ୍ୟୋଦୟ ଓ ପର୍ବପର୍ବାଣିର ସଠିକ୍ ସୂଚୀ।
            </p>
          </div>

          <button
            type="button"
            className="relative z-10 px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer border border-amber-200"
          >
            <span>📅 ପଞ୍ଜିକା ଦେଖନ୍ତୁ (View Panchang)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Section 5: Spiritual Stories & Vedic Blog */}
        <div
          id="home-card-blog"
          onClick={onNavigateToBlog}
          className="bg-gradient-to-r from-[#380b0e] via-[#66161b] to-[#250507] text-white border-2 border-amber-400 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-black rounded-full text-xs inline-flex items-center gap-1.5 backdrop-blur-xs">
              <span>📖 ପୁରାଣ ଓ ଲୀଳା</span>
              <span>•</span>
              <span>ଆଧ୍ୟାତ୍ମିକ ଜ୍ଞାନ ଭଣ୍ଡାର</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
              <span>୫- ଦିବ୍ୟ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ (Spiritual Stories & Blog)</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed">
              ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ଅଲୌକିକ ଲୀଳା, ଭକ୍ତ ସାଲବେଗ, ମାଣିକ ପାଟଣୀ ଓ ଶିବ ମହିମାର ପ୍ରେରଣାଦାୟୀ ଗାଥା ପଢ଼ନ୍ତୁ।
            </p>
          </div>

          <button
            type="button"
            className="relative z-10 px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer border border-amber-200"
          >
            <span>📖 କାହାଣୀ ପଢ଼ନ୍ତୁ (Read Stories)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Section 6: Temple Puja Shorts */}
        <div
          id="home-card-shorts"
          onClick={onNavigateToShorts}
          className="bg-gradient-to-r from-[#420d11] via-[#751118] to-[#2e0508] text-white border-2 border-amber-400 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-rose-600/30 border border-rose-400/70 text-rose-200 font-black rounded-full text-xs inline-flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>🎬 ଲାଇଭ୍ ଭିଡିଓ ଫିଡ୍ (Shorts / Reels)</span>
              <span>•</span>
              <span>HD Darshan</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
              <span>୬- ମନ୍ଦିର ପୂଜା ଭିଡିଓ (Temple Puja Shorts)</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed">
              ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର, ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ, ଏକାମ୍ର କ୍ଷେତ୍ର ଲିଙ୍ଗରାଜ ଓ ସମଲେଶ୍ୱରୀ ପୀଠର ଦିବ୍ୟ ଆରତି, ଜଳାଭିଷେକ ଏବଂ ପୂଜାର ସୁନ୍ଦର ଭର୍ଟିକାଲ୍ Shorts ଦର୍ଶନ କରନ୍ତୁ।
            </p>
          </div>

          <button
            type="button"
            className="relative z-10 px-5 py-3 bg-gradient-to-r from-rose-600 via-amber-500 to-amber-400 text-white hover:text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer border border-amber-300"
          >
            <span>▶️ ଭିଡିଓ ଦେଖନ୍ତୁ (Watch Shorts)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Pujari Account Status / Access Box (Single unified card) */}
      <div id="home-pujari-status-box">
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
    </div>
  );
};
