import { showCustomAlert } from '../lib/customAlert';
import React, { useRef, useState } from 'react';
import { PujaList } from '../types';
import { Download, Printer, Lock, ArrowLeft, ShieldAlert, QrCode } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { recordDownload } from '../lib/api';
import { isOfficeOpen } from '../lib/officeHours';
import { OfficeClosedModal } from './OfficeClosedModal';
import { handleFreeDownloadWithDoubleLock } from '../lib/deviceFingerprint';

interface PujaListPDFViewProps {
  list: PujaList;
  onBack?: () => void;
  onRequestUnlock?: () => void;
}

export const PujaListPDFView: React.FC<PujaListPDFViewProps> = ({
  list,
  onBack,
  onRequestUnlock,
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [officeClosedModalOpen, setOfficeClosedModalOpen] = useState(false);

  // Split items into 2 columns if more than 8 items for compact A4 layout
  const useTwoColumns = list.items.length > 8;
  const midPoint = Math.ceil(list.items.length / 2);
  const col1 = useTwoColumns ? list.items.slice(0, midPoint) : list.items;
  const col2 = useTwoColumns ? list.items.slice(midPoint) : [];

  const handleDownloadPDF = async () => {
    if (!isOfficeOpen()) {
      setOfficeClosedModalOpen(true);
      return;
    }
    if (!list.isUnlocked) return;
    const element = pdfRef.current || document.getElementById('pdf-content');
    if (!element) return;

    // For Free First Time lists, enforce Device Fingerprint & Voter PIN double lock
    if (list.paymentType === 'free_first_time') {
      const allowed = await handleFreeDownloadWithDoubleLock(
        async () => {},
        undefined,
        { listId: list.id, pujariId: list.pujariId }
      );
      if (!allowed) return;
    }

    try {
      setDownloading(true);

      // Ensure Noto Sans Odia font is loaded
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      const opt = {
        margin: 5,
        filename: `Puja_Samagri_${list.pujaName.replace(/\s+/g, '_')}_${list.yajamanaName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFBF0',
          windowWidth: 800,
          dpi: 300,
          letterRendering: true,
          onclone: (clonedDoc: Document) => {
            // Remove any potential shadows or oklch styles from cloned elements
            const pdfElem = clonedDoc.getElementById('pdf-content');
            if (pdfElem) {
              pdfElem.style.boxShadow = 'none';
              const allChildren = pdfElem.getElementsByTagName('*');
              for (let i = 0; i < allChildren.length; i++) {
                const el = allChildren[i] as HTMLElement;
                if (el.style) {
                  el.style.boxShadow = 'none';
                  el.style.textShadow = 'none';
                }
              }
            }
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      };

      // Generate PDF using html2pdf.js
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();

      // Log download to Firestore for Anti-Fraud proof
      await recordDownload(list.id);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showCustomAlert('PDF ଡାଉନଲୋଡ୍ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା। ଦୟାକରି Print ବଟନ୍ ବ୍ୟବହାର କରନ୍ତୁ।');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!isOfficeOpen()) {
      setOfficeClosedModalOpen(true);
      return;
    }
    if (!list.isUnlocked) return;
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Top Action Control Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-amber-300 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 text-slate-800 hover:text-amber-950 bg-slate-100 hover:bg-amber-100/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> ପଛକୁ ଫେରନ୍ତୁ
            </button>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{list.pujaName}</span>
              <span className="text-xs font-mono text-amber-800 font-bold">({list.id})</span>
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              ଯଜମାନ: <strong className="text-slate-900">{list.yajamanaName}</strong> | ତାରିଖ: {list.date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {list.isUnlocked ? (
            <>
              <button
                onClick={handlePrint}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-xs cursor-pointer min-h-[44px]"
              >
                <Printer className="w-4 h-4" /> ପ୍ରିଣ୍ଟ୍ କରନ୍ତୁ
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-5 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-amber-300" />
                {downloading ? 'PDF ତିଆରି ହେଉଛି...' : '୧-ପୃଷ୍ଠା PDF ଡାଉନଲୋଡ୍'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 bg-amber-100 text-amber-950 border-2 border-amber-400 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-4 h-4 text-amber-800 shrink-0" /> ପେମେଣ୍ଟ ଯାଞ୍ଚ ପେଣ୍ଡିଂ
              </span>
              {onRequestUnlock && (
                <button
                  onClick={onRequestUnlock}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-2 border-amber-600 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer shadow-md flex items-center gap-2 min-h-[44px]"
                >
                  <QrCode className="w-4 h-4" /> ପେମେଣ୍ଟ QR / UTR
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Massive Action Banner for Unpaid / Locked Lists */}
      {!list.isUnlocked && (
        <div className="mb-6 p-5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 border-2 border-amber-500 rounded-3xl text-slate-950 shadow-md print:hidden space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-950 text-amber-300 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-1.5">
                <span>👉 ଏହି ପୂଜା ସୂଚୀ ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ ପ୍ରଥମେ QR କୋଡ୍ ସ୍କାନ୍ କରି ₹୫ (କିମ୍ବା ₹୨) ପେମେଣ୍ଟ୍ କରନ୍ତୁ ଏବଂ UTR ନମ୍ବର ଦାଖଲ କରନ୍ତୁ।</span>
              </h3>
              <p className="text-xs font-black text-amber-950 mt-1">
                {list.paymentStatus === 'rejected'
                  ? `ଆପଣଙ୍କ ପେମେଣ୍ଟ ଅନୁରୋଧ ଗ୍ରହଣ ହେଲାନାହିଁ: "${list.rejectionReason || 'ଯାଞ୍ଚ ବିଫଳ'}। ଦୟାକରି ସଠିକ୍ UTR ନମ୍ବର ସହ ପୁନଃ-ଦାଖଲ କରନ୍ତୁ।"`
                  : 'ଦୟାକରି QR କୋଡ୍‌ରେ ପେମେଣ୍ଟ କରି ୧୨-ଅଙ୍କ UTR ନମ୍ବର ଦାଖଲ କରନ୍ତୁ। ଆଡମିନ୍ ଅନୁମୋଦନ କଲେ ୧-ପୃଷ୍ଠା PDF ଡାଉନଲୋଡ୍ ଅନଲୋକ୍ ହୋଇଯିବ।'}
              </p>
            </div>
          </div>

          {onRequestUnlock && (
            <button
              onClick={onRequestUnlock}
              className="w-full py-3.5 bg-amber-950 hover:bg-slate-900 text-amber-300 border-2 border-amber-500 rounded-2xl text-xs sm:text-sm font-black transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5 text-amber-400" />
              <span>ପେମେଣ୍ଟ QR ଦେଖନ୍ତୁ / UTR ନମ୍ବର ଦାଖଲ କରନ୍ତୁ (Submit UTR)</span>
            </button>
          )}
        </div>
      )}

      {/* Printable Single-Page Canvas Wrapper */}
      <div className="relative overflow-x-auto bg-slate-200 p-2 sm:p-4 rounded-2xl shadow-inner print:p-0 print:bg-white print:shadow-none">
        {/* Watermark Overlay when Locked */}
        {!list.isUnlocked && (
          <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center select-none print:hidden">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md border-2 border-amber-300">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-800">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">
                PDF ଡାଉନଲୋଡ୍ ଅନଲୋକ୍ ଆବଶ୍ୟକ
              </h4>
              <p className="text-xs text-slate-600 mb-5 font-medium">
                ଏହି ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ ଆଡମିନ୍ ପେମେଣ୍ଟ ଅନୁମୋଦନ ଆବଶ୍ୟକ।
              </p>
              {onRequestUnlock && (
                <button
                  onClick={onRequestUnlock}
                  className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> ପେମେଣ୍ଟ QR ଦେଖନ୍ତୁ / UTR ଦାଖଲ କରନ୍ତୁ
                </button>
              )}
            </div>
          </div>
        )}

        {/* 1-PAGE TARGET PRINTABLE ELEMENT - ONLY PURE INLINE CSS HEX COLORS FOR HTML2CANVAS COMPATIBILITY */}
        <div
          ref={pdfRef}
          id="pdf-content"
          style={{
            width: '794px',
            minWidth: '794px',
            boxSizing: 'border-box',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: '#FFFBF0',
            color: '#1e293b',
            fontSize: '12px',
            fontFamily: "'Noto Sans Odia', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Inner Decorative Frame Line */}
          <div
            className="pdf-kalash-watermark"
            style={{
              border: '2px solid #b45309',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
            }}
          >
            {/* Header Section */}
            <div>
              {/* Ganesh Mantra Header Centered */}
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #701a1e',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#701a1e',
                    marginBottom: '4px',
                    lineHeight: '1.4',
                  }}
                >
                  "ବକ୍ରତୁଣ୍ଡ ମହାକାୟ ସୂର୍ଯ୍ୟକୋଟି ସମପ୍ରଭ । ନିର୍ବିଘ୍ନଂ କୁରୁ ମେ ଦେବ ସର୍ବକାର୍ଯ୍ୟେଷୁ ସର୍ବଦା ॥"
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: '#701a1e',
                    fontWeight: '800',
                    fontSize: '22px',
                    marginTop: '4px',
                  }}
                >
                  <span>ॐ</span>
                  <span
                    style={{
                      fontWeight: '700',
                      letterSpacing: '0.025em',
                      fontSize: '24px',
                      color: '#701a1e',
                    }}
                  >
                    ଓଁ ଶ୍ରୀ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ
                  </span>
                  <span>卐</span>
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    color: '#78350f',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  PUJA SAMAGRI REQUISITION LIST • ID: {list.id}
                </div>
              </div>

              {/* Header Info Grid Box */}
              <div
                style={{
                  backgroundColor: '#fff9e6',
                  border: '2px solid #fcd34d',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  color: '#0f172a',
                }}
              >
                <div>
                  <span style={{ fontWeight: '800', color: '#701a1e' }}>ପୂଜା ନାମ (Puja Name):</span>{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{list.pujaName}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '800', color: '#701a1e' }}>ତାରିଖ ଓ ସମୟ (Date & Time):</span>{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>
                    {list.date} {list.time ? `(${list.time})` : ''}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '800', color: '#701a1e' }}>ଯଜମାନଙ୍କ ନାମ (Yajamana):</span>{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{list.yajamanaName}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '800', color: '#701a1e' }}>ଯୋଗାଯୋଗ ନମ୍ବର (Contact):</span>{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{list.contact || 'N/A'}</span>
                </div>
                {list.location && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontWeight: '800', color: '#701a1e' }}>ପୂଜା ସ୍ଥାନ / ଠିକଣା (Location):</span>{' '}
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{list.location}</span>
                  </div>
                )}
                {list.notes && (
                  <div style={{ gridColumn: 'span 2', fontSize: '12px', color: '#451a03', fontStyle: 'italic', fontWeight: '600' }}>
                    <span style={{ fontWeight: '700', color: '#701a1e' }}>ସ୍ୱତନ୍ତ୍ର ସୂଚନା:</span>{' '}
                    <span>{list.notes}</span>
                  </div>
                )}
              </div>

              {/* Items Section Banner */}
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: '12px',
                  color: '#701a1e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #fcd34d',
                  paddingBottom: '4px',
                  marginBottom: '8px',
                }}
              >
                — ଆବଶ୍ୟକ ପୂଜା ସାମଗ୍ରୀ ଓ ପରିମାଣ ସୂଚୀ (Samagri List) —
              </div>

              {/* Samagri Table Layout with Clean CSS Table Borders */}
              {!useTwoColumns ? (
                /* Single Column Table for <= 8 items */
                <table
                  style={{
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                    width: '100%',
                    border: '2px solid #f59e0b',
                    fontSize: '12px',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#701a1e', color: '#ffffff', fontWeight: 'bold' }}>
                      <th style={{ width: '10%', padding: '6px 8px', border: '1px solid #d97706', textAlign: 'center' }}>
                        କ୍ର.ସଂ.
                      </th>
                      <th style={{ width: '60%', padding: '6px 8px', border: '1px solid #d97706', textAlign: 'left' }}>
                        ସାମଗ୍ରୀ ନାମ (Item Name)
                      </th>
                      <th style={{ width: '30%', padding: '6px 8px', border: '1px solid #d97706', textAlign: 'center' }}>
                        ପରିମାଣ (Quantity)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {col1.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fdfbf3' }}
                      >
                        <td style={{ padding: '6px 8px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: 'bold', color: '#475569', wordBreak: 'break-word' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #fcd34d', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', wordBreak: 'break-word' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: '800', color: '#701a1e', wordBreak: 'break-word' }}>
                          {item.quantity} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* 2-Column Balanced Table for > 8 items */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Column 1 Table */}
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                      width: '100%',
                      border: '2px solid #f59e0b',
                      fontSize: '12px',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#701a1e', color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}>
                        <th style={{ width: '14%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'center' }}>
                          କ୍ର.ସଂ.
                        </th>
                        <th style={{ width: '56%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'left' }}>
                          ସାମଗ୍ରୀ ନାମ
                        </th>
                        <th style={{ width: '30%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'center' }}>
                          ପରିମାଣ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {col1.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fdfbf3' }}
                        >
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '11px', wordBreak: 'break-word' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', fontSize: '11px', wordBreak: 'break-word' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: '800', color: '#701a1e', fontSize: '11px', wordBreak: 'break-word' }}>
                            {item.quantity} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Column 2 Table */}
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                      width: '100%',
                      border: '2px solid #f59e0b',
                      fontSize: '12px',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#701a1e', color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}>
                        <th style={{ width: '14%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'center' }}>
                          କ୍ର.ସଂ.
                        </th>
                        <th style={{ width: '56%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'left' }}>
                          ସାମଗ୍ରୀ ନାମ
                        </th>
                        <th style={{ width: '30%', padding: '5px 6px', border: '1px solid #d97706', textAlign: 'center' }}>
                          ପରିମାଣ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {col2.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fdfbf3' }}
                        >
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '11px', wordBreak: 'break-word' }}>
                            {midPoint + idx + 1}
                          </td>
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', fontSize: '11px', wordBreak: 'break-word' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '5px 6px', border: '1px solid #fcd34d', textAlign: 'center', fontWeight: '800', color: '#701a1e', fontSize: '11px', wordBreak: 'break-word' }}>
                            {item.quantity} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Section in Odia */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '2px solid #701a1e',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#701a1e' }}>ପୂଜାରୀଙ୍କ ପରିଚୟ:</div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{list.pujariName}</div>
                  <div style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>ପୂଜାରୀ ID: {list.pujariId}</div>
                  <div style={{ fontSize: '12px', color: '#451a03', fontWeight: '700', fontStyle: 'italic', marginTop: '4px' }}>
                    "ସର୍ବେ ଭବନ୍ତୁ ସୁଖିନଃ ସର୍ବେ ସନ୍ତୁ ନିରାମୟାଃ"
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '144px' }}>
                  <div
                    style={{
                      borderBottom: '2px dashed #94a3b8',
                      paddingBottom: '8px',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#94a3b8',
                    }}
                  >
                    ସ୍ୱାକ୍ଷର / ମୋହର
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#701a1e' }}>
                    ପୂଜାରୀଙ୍କ ସ୍ୱାକ୍ଷର / ଯଜମାନଙ୍କ ସ୍ୱୀକୃତି
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#64748b',
                  borderTop: '1px solid #fcd34d',
                  paddingTop: '4px',
                }}
              >
                ପୂଜା ସାମଗ୍ରୀ ମ୍ୟାନେଜମେଣ୍ଟ ସିଷ୍ଟମ୍ ଦ୍ୱାରା ପ୍ରସ୍ତୁତ • Strictly 1-Page A4 Printable Document
              </div>
            </div>
          </div>
        </div>
      </div>

      <OfficeClosedModal
        isOpen={officeClosedModalOpen}
        onClose={() => setOfficeClosedModalOpen(false)}
      />
    </div>
  );
};
