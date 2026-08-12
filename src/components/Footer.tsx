import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'odia' | 'english' | 'about' | 'complaint' | null>(null);

  return (
    <>
      <footer className="w-full bg-[#FAF5E6] border-t border-amber-200/80 text-amber-950/80 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs leading-relaxed font-sans">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright notice */}
          <div className="text-gray-600 text-xs font-medium text-center sm:text-left">
            © {new Date().getFullYear()} Puja Samagri Portal. All Rights Reserved.
          </div>

          {/* Links: About Us, Complaint, Privacy Policies */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="text-amber-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              ℹ️ About Us (ଆମ ବିଷୟରେ)
            </button>

            <span className="text-amber-300">|</span>

            <button
              type="button"
              onClick={() => setActiveModal('complaint')}
              className="text-amber-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              📩 Complaint & Support (ଅଭିଯୋଗ)
            </button>

            <span className="text-amber-300">|</span>

            <button
              type="button"
              onClick={() => setActiveModal('odia')}
              className="text-amber-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              🔒 ଗୋପନୀୟତା ନୀତି (Odia)
            </button>

            <span className="text-amber-300">|</span>

            <button
              type="button"
              onClick={() => setActiveModal('english')}
              className="text-amber-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              🔒 Privacy Policy (English)
            </button>
          </div>
        </div>
      </footer>

      {/* About Us Modal */}
      {activeModal === 'about' && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left text-gray-800 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                <h3 className="text-base font-bold text-amber-950">
                  ଆମ ବିଷୟରେ (About Puja Samagri Portal)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <p>
                <strong>ପୂଜା ସାମଗ୍ରୀ ପୋର୍ଟାଲ୍ (Puja Samagri Portal)</strong> ହେଉଛି ଓଡ଼ିଶାର ଏକମାତ୍ର ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ଏବଂ ପ୍ରତିଷ୍ଠିତ ପୂଜାରୀ ଓ ଶ୍ରଦ୍ଧାଳୁ ସେବା ପୋର୍ଟାଲ୍।
              </p>
              <p>
                ଆମର ମୂଳ ଲକ୍ଷ୍ୟ ହେଉଛି ସମସ୍ତ ପ୍ରକାର ପୂଜା ଫର୍ମାଟ୍, ସାମଗ୍ରୀ ତାଲିକା, ନାମଯଜ୍ଞ କାର୍ଡ ପ୍ରସ୍ତୁତି, ଏବଂ ଘରେ ବସି ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ ମଗାଇବାର ସୁବିଧା ପ୍ରଦାନ କରିବା।
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                ✕ ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint / Support Modal */}
      {activeModal === 'complaint' && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left text-gray-800 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📩</span>
                <h3 className="text-base font-bold text-amber-950">
                  ଅଭିଯୋଗ ଏବଂ ସହାୟତା (Complaint & Support)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <p>
                ଯଦି ଆପଣଙ୍କର କୌଣସି ଅଭିଯୋଗ, ସମସ୍ୟା, କିମ୍ବା ପରାମର୍ଶ ଅଛି, ତେବେ ଦୟାକରି ସିଧାସଳଖ ଆମର ଅଫିସିଆଲ୍ ଇମେଲ୍ ମାଧ୍ୟମରେ ଯୋଗାଯୋଗ କରନ୍ତୁ:
              </p>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                <span className="text-xs font-bold text-gray-600 block mb-1">Official Support Email:</span>
                <a
                  href="mailto:nayakjitu986@gmail.com"
                  className="font-mono font-bold text-amber-900 text-sm hover:underline"
                >
                  nayakjitu986@gmail.com
                </a>
              </div>

              <p className="text-gray-500 italic text-[11px]">
                ଆମର ସପୋର୍ଟ ଟିମ୍ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ ଆପଣଙ୍କ ଇମେଲ୍‌ର ଉତ୍ତର ଦେବେ।
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                ✕ ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Odia Privacy Policy Modal */}
      {activeModal === 'odia' && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left text-gray-800 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className="text-base font-bold text-amber-950">
                  ଗୋପନୀୟତା ନୀତି ଏବଂ ସର୍ତ୍ତାବଳୀ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  ୧. ତଥ୍ୟ ସଂଗ୍ରହ (Data Collection & Device Tracking):
                </h4>
                <p className="text-gray-600 pl-2">
                  ଆମର ସେବାକୁ ଦୁରୁପଯୋଗ (Abuse) ରୁ ରୋକିବା ପାଇଁ ଏବଂ ସମସ୍ତଙ୍କୁ ସୁରକ୍ଷିତ ସେବା ଯୋଗାଇବା ପାଇଁ, ଆମେ ଆପଣଙ୍କ ମୋବାଇଲ୍ ବା କମ୍ପ୍ୟୁଟରର 'ଡିଭାଇସ୍ ଆଇଡି' (Device Fingerprint), 'ଆଇପି ଆଡ୍ରେସ୍' (IP Address), ଏବଂ ସିକ୍ୟୁରିଟି ପିନ୍ ଆଦି ବ୍ୟାକଗ୍ରାଉଣ୍ଡରେ ସଂଗ୍ରହ କରୁ। ଏହା ଆମର ଏକ ସ୍ୱୟଂଚାଳିତ ସୁରକ୍ଷା ବ୍ୟବସ୍ଥା।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  ୨. ତଥ୍ୟର ବ୍ୟବହାର ଏବଂ ସୁରକ୍ଷା (Data Usage & Security):
                </h4>
                <p className="text-gray-600 pl-2">
                  ଆମେ ସଂଗ୍ରହ କରୁଥିବା ତଥ୍ୟ କେବଳ ଆମ ସିଷ୍ଟମ୍କୁ ହ୍ୟାକିଂ, ଚୋରି, ଏବଂ ବାରମ୍ବାର ମାଗଣା ଡାଉନଲୋଡ୍ କରୁଥିବା ବ୍ୟକ୍ତିଙ୍କ ଠାରୁ ବଞ୍ଚାଇବା ପାଇଁ ବ୍ୟବହାର କରାଯାଏ। ଆମେ ଆପଣଙ୍କର କୌଣସି ବି ତଥ୍ୟ କୌଣସି ତୃତୀୟ ପକ୍ଷ (Third Party) କୁ ବିକ୍ରି କିମ୍ବା ପ୍ରଦାନ କରୁନାହିଁ।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  ୩. ମାଗଣା ସେବା ଏବଂ ବ୍ଲକିଂ ନୀତି (Free Service & Anti-Fraud Policy):
                </h4>
                <p className="text-gray-600 pl-2">
                  ଆମର ମାଗଣା ସେବା (Free Download) କେବଳ ପ୍ରକୃତ ବ୍ୟବହାରକାରୀଙ୍କ ପାଇଁ ଉପଲବ୍ଧ। ଯଦି କୌଣସି ବ୍ୟକ୍ତି ଗୋଟିଏ ଡିଭାଇସ୍ରୁ ବାରମ୍ବାର ନମ୍ବର ବଦଳାଇ ବା ଅନ୍ୟ କୌଣସି ବେଆଇନ ଉପାୟରେ ସିଷ୍ଟମ୍କୁ ଠକିବାକୁ ଚେଷ୍ଟା କରନ୍ତି, ତେବେ ଆମର ସିକ୍ୟୁରିଟି ସିଷ୍ଟମ୍ ବିନା କୌଣସି ପୂର୍ବ ସୂଚନାରେ ସେହି ଡିଭାଇସ୍ କିମ୍ବା ବ୍ୟକ୍ତିଙ୍କୁ ସବୁଦିନ ପାଇଁ ବ୍ଲକ୍ (Block) କରିଦେବାର ପୂର୍ଣ୍ଣ ଅଧିକାର ରଖେ।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  ୪. ଦାୟିତ୍ୱହୀନତା (Limitation of Liability):
                </h4>
                <p className="text-gray-600 pl-2">
                  ଏହି ୱେବସାଇଟ୍ କିମ୍ବା ଆପ୍ ବ୍ୟବହାର କରୁଥିବା ସମୟରେ ୟୁଜର୍ଙ୍କର ନିଜସ୍ୱ ତ୍ରୁଟି କିମ୍ବା ଚାଲାକି କାରଣରୁ ତାଙ୍କ ଡିଭାଇସ୍ ବ୍ଲକ୍ ହେଲେ କିମ୍ବା ଆର୍ଥିକ କ୍ଷତି ହେଲେ, ଆମେ ଦାୟୀ ରହିବୁ ନାହିଁ। ଆମର ନିୟମ ଉଲ୍ଲଂଘନ କରି ବ୍ଲକ୍ ହୋଇଥିବା ବ୍ୟକ୍ତି ଆମ ବିରୁଦ୍ଧରେ କୌଣସି ଆଇନଗତ ପଦକ୍ଷେପ (Legal Action) ନେଇପାରିବେ ନାହିଁ।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  ୫. ୟୁଜର୍ ସମ୍ମତି (Consent):
                </h4>
                <p className="text-gray-600 pl-2">
                  ଏହି ୱେବସାଇଟ୍ ବା ଆପ୍କୁ ଖୋଲିବା ଏବଂ ଡାଉନଲୋଡ୍ ବଟନ୍ ଉପରେ କ୍ଲିକ୍ କରିବା ମାତ୍ରେ, ଆପଣ ଆମର ଉପରୋକ୍ତ ସମସ୍ତ ଗୋପନୀୟତା ନୀତି ଓ ସର୍ତ୍ତାବଳୀରେ ସମ୍ପୂର୍ଣ୍ଣ ସମ୍ମତ ଅଛନ୍ତି ବୋଲି ଗ୍ରହଣ କରାଯିବ।
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                ✕ ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* English Privacy Policy Modal */}
      {activeModal === 'english' && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left text-gray-800 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className="text-base font-bold text-amber-950">
                  Privacy Policy & Terms of Use
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  1. Data Collection:
                </h4>
                <p className="text-gray-600 pl-2">
                  To prevent abuse of our free service, we silently collect your 'Device Fingerprint' and IP Address as a security measure.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  2. Data Security:
                </h4>
                <p className="text-gray-600 pl-2">
                  We do not sell or share your device data with any third parties.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  3. Anti-Fraud Policy:
                </h4>
                <p className="text-gray-600 pl-2">
                  If a user attempts to bypass limits (e.g., using multiple numbers on the same device) for repeated free downloads, the system will permanently block the device without prior notice.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  4. Limitation of Liability:
                </h4>
                <p className="text-gray-600 pl-2">
                  Users blocked for violating our rules cannot take legal action against us. We are not liable for blocks resulting from fraudulent attempts.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-900 mb-0.5">
                  5. Consent:
                </h4>
                <p className="text-gray-600 pl-2">
                  By accessing this service and clicking download, you fully agree to these terms.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

