import { TempleBooking, Temple } from '../types';
import { getReceiptHeaderConfig } from './templeApi';

/**
 * Storage-Free On-the-Fly High-Resolution JPG Receipt Generator.
 * Renders the official receipt directly onto a 2D Canvas without saving
 * any image blobs or base64 data to localStorage or server memory.
 */
export function generateTempleReceiptJPG(booking: TempleBooking, temple?: Temple | null): void {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Unable to generate canvas receipt.');
    return;
  }

  // 1. Background Fill - Warm Sacred Ivory Paper (#FFFDF7)
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Dual Border Frame
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#701A1E'; // Deep Sacred Maroon
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#D97706'; // Golden Amber Accent
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Inner Background Pattern Frame
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(52, 52, width - 104, 180);

  // 3. Header Section - Sacred Title & Om Motif (Customizable from Admin Panel)
  const receiptConfig = getReceiptHeaderConfig();
  const topBannerText = (receiptConfig.topBanner || '').trim() || '🕉️ ଓଡ଼ିଶା ଅଫିସିଆଲ ମନ୍ଦିର ପୂଜା ସେବା 🕉️';
  const mainTitleText = (receiptConfig.mainTitle || '').trim() || 'TEMPLE PUJA & JAL ABHISHEK RECEIPT';
  const subTitleText = (receiptConfig.subTitle || '').trim() || '(ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ସ୍ୱୀକୃତି ରସିଦ୍)';

  ctx.textAlign = 'center';
  ctx.fillStyle = '#701A1E';
  ctx.font = 'bold 52px serif';
  ctx.fillText(topBannerText, width / 2, 115);

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(mainTitleText, width / 2, 165);

  ctx.fillStyle = '#451A03';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(subTitleText, width / 2, 205);

  // Decorative Horizontal Divider
  ctx.beginPath();
  ctx.moveTo(80, 250);
  ctx.lineTo(width - 80, 250);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D97706';
  ctx.stroke();

  // 4. Booking Reference Banner Box
  ctx.fillStyle = '#701A1E';
  ctx.beginPath();
  ctx.roundRect(80, 280, width - 160, 90, 20);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`RECEIPT NO: ${booking.id.toUpperCase()}`, 110, 335);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 22px sans-serif';
  const issueDate = booking.approvedAt ? new Date(booking.approvedAt).toLocaleDateString('or-IN') : new Date().toLocaleDateString('or-IN');
  ctx.fillText(`ତାରିଖ: ${issueDate}`, width - 110, 335);

  // 5. Main Content Details Table (2 Columns / Boxed Sections)
  let currentY = 420;

  const drawSectionHeader = (title: string, icon: string, yPos: number) => {
    ctx.fillStyle = '#701A1E';
    ctx.fillRect(80, yPos, width - 160, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${icon}  ${title}`, 100, yPos + 30);
  };

  const drawRow = (label: string, value: string, yPos: number, isHighlight = false) => {
    ctx.fillStyle = isHighlight ? '#FFFBEB' : '#FFFFFF';
    ctx.fillRect(80, yPos, width - 160, 56);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#FDE68A';
    ctx.strokeRect(80, yPos, width - 160, 56);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(label, 110, yPos + 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = isHighlight ? '#15803D' : '#1E293B';
    ctx.font = isHighlight ? 'bold 24px sans-serif' : 'bold 22px sans-serif';
    ctx.fillText(value, width - 110, yPos + 36);
  };

  // --- SECTION A: TEMPLE DETAILS ---
  const section1Title = (temple?.customSection1Heading || receiptConfig.section1Heading || '').trim() || 'ମନ୍ଦିର ତଥ୍ୟ (Temple Details)';
  drawSectionHeader(section1Title, '🏛️', currentY);
  currentY += 44;
  drawRow('ମନ୍ଦିର ନାମ (Temple Name):', booking.templeName, currentY);
  currentY += 56;
  drawRow('ଅବସ୍ଥିତି (Location Address):', temple?.location || booking.templeLocation || 'Odisha, India', currentY);
  currentY += 56;
  drawRow('ପୂଜକ ସମ୍ପର୍କ (Pujari Contact):', temple?.pujariPhone || booking.pujariPhone || 'N/A', currentY);
  currentY += 76;

  // --- SECTION B: DEVOTEE DETAILS ---
  drawSectionHeader('ଶ୍ରଦ୍ଧାଳୁ / ଭକ୍ତଙ୍କ ତଥ୍ୟ (Devotee Info)', '👤', currentY);
  currentY += 44;
  drawRow('ଭକ୍ତଙ୍କ ନାମ (Devotee Name):', booking.userName, currentY);
  currentY += 56;
  drawRow('ମୋବାଇଲ୍ (Mobile Number):', booking.userPhone, currentY);
  currentY += 56;
  drawRow('ଠିକଣା (Address):', booking.userAddress, currentY);
  currentY += 56;
  if (booking.gotraRasi) {
    drawRow('ଗୋତ୍ର / ରାଶି (Gotra & Rasi):', booking.gotraRasi, currentY);
    currentY += 56;
  }
  currentY += 20;

  // --- SECTION C: APPROVED PUJA DATE & TIME ---
  const section2Title = (temple?.customSection2Heading || receiptConfig.section2Heading || '').trim() || 'ନିର୍ଦ୍ଧାରିତ ପୂଜା / ଜଳାଭିଷେକ ସମୟ (Scheduled Date & Time)';
  drawSectionHeader(section2Title, '📅', currentY);
  currentY += 44;
  const assignedDateTime = booking.pujaDateTime || 'As scheduled with Pujari';
  drawRow('ପୂଜା/ଅଭିଷେକ ସମୟ (Puja Date & Time):', assignedDateTime, currentY, true);
  currentY += 76;

  // --- SECTION D: PAYMENT & FEE VERIFICATION ---
  drawSectionHeader('ଦେୟ ସମ୍ବନ୍ଧୀୟ ଯାଞ୍ଚ (Payment & Verification)', '💳', currentY);
  currentY += 44;
  drawRow('ପ୍ଲାଟଫର୍ମ ବୁକିଂ ଫି (Platform Fee):', '₹5 (Paid)', currentY, true);
  currentY += 56;
  drawRow('ପୂଜା ଦକ୍ଷିଣା (Puja Dakshina):', 'To be paid directly to the Pujari at the temple.', currentY);
  currentY += 56;
  drawRow('ୟୁଟିଆର୍ ନମ୍ବର (UTR Ref No):', booking.utrRef, currentY);
  currentY += 56;
  drawRow('ପୂଜାର ପ୍ରକାର (Puja Type):', booking.bookingType || 'Jal Abhishek (ଜଳାଭିଷେକ)', currentY, true);
  currentY += 80;

  // 6. OFFICIAL STATUS BADGE STAMP
  const statusUpper = (booking.status || 'APPROVED').toUpperCase();
  const isOkStatus = statusUpper === 'APPROVED' || statusUpper === 'RESCHEDULED';

  ctx.fillStyle = isOkStatus ? '#DCFCE7' : '#FEF3C7';
  ctx.strokeStyle = isOkStatus ? '#16A34A' : '#D97706';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(80, currentY, width - 160, 110, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isOkStatus ? '#15803D' : '#92400E';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`✓ STATUS: ${statusUpper} (ସ୍ୱୀକୃତ/ସ୍ଥିତି)`, width / 2, currentY + 45);

  ctx.fillStyle = isOkStatus ? '#166534' : '#78350F';
  ctx.font = 'bold 20px sans-serif';
  const subText = booking.adminReason
    ? `Remark/Reason: ${booking.adminReason}`
    : 'Platform Fee Paid: ₹5 (Verified) • Official Verification Complete';
  ctx.fillText(subText, width / 2, currentY + 85);

  currentY += 130;

  // 7. Footer Sacred Message & Instructions (Customizable from Admin Panel)
  const rawFooterText = (temple?.customFooterText || receiptConfig.footerText || '').trim() ||
    'ଦୟାକରି ଏହି ରସିଦ୍‌କୁ ମନ୍ଦିରରେ ଦର୍ଶାଇ ପୂଜା / ଜଳାଭିଷେକ ସମ୍ପନ୍ନ କରନ୍ତୁ । Generated on demand via Odisha Temple Puja Portal • All Rights Reserved';

  ctx.textAlign = 'center';
  if (rawFooterText.includes('\n')) {
    const lines = rawFooterText.split('\n').map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      ctx.fillStyle = idx === 0 ? '#701A1E' : '#78350F';
      ctx.font = idx === 0 ? 'bold 20px serif' : '18px sans-serif';
      ctx.fillText(line, width / 2, currentY + idx * 28);
    });
  } else if (rawFooterText.includes(' • ')) {
    const [line1, ...rest] = rawFooterText.split(' • ');
    ctx.fillStyle = '#701A1E';
    ctx.font = 'bold 20px serif';
    ctx.fillText(line1.trim(), width / 2, currentY);

    ctx.fillStyle = '#78350F';
    ctx.font = '18px sans-serif';
    ctx.fillText(rest.join(' • ').trim(), width / 2, currentY + 28);
  } else {
    ctx.fillStyle = '#701A1E';
    ctx.font = 'bold 20px serif';
    if (ctx.measureText(rawFooterText).width > width - 160) {
      let breakIdx = rawFooterText.indexOf('।');
      if (breakIdx === -1) breakIdx = rawFooterText.indexOf('|');
      if (breakIdx === -1) breakIdx = Math.floor(rawFooterText.length / 2);
      else breakIdx += 1;

      const line1 = rawFooterText.slice(0, breakIdx).trim();
      const line2 = rawFooterText.slice(breakIdx).trim();

      ctx.fillText(line1, width / 2, currentY);
      ctx.fillStyle = '#78350F';
      ctx.font = '18px sans-serif';
      ctx.fillText(line2, width / 2, currentY + 28);
    } else {
      ctx.fillText(rawFooterText, width / 2, currentY);
    }
  }

  // 8. Convert to High-Res JPG DataURL & Download Immediately
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `Temple_Puja_Receipt_${booking.userName.replace(/\s+/g, '_')}_${booking.id}.jpg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (err) {
    console.error('Error generating JPG receipt:', err);
    alert('ରସିଦ୍ ଡାଉନଲୋଡ୍ କରିବାରେ ତ୍ରୁଟି ହେଲା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।');
  }
}
