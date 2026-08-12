/**
 * Official Working Hours Utility
 * Office is OPEN ONLY under these conditions:
 * - Days: Monday to Saturday (Sunday is strictly a Holiday / closed).
 * - Time: 10:00 AM to 2:00 PM (10:00 to 14:00 local time).
 */

export const EXACT_OFFICE_CLOSED_MESSAGE =
  '⚠️ ବର୍ତ୍ତମାନ ଅଫିସ୍ ବନ୍ଦ ଅଛି। (କାର୍ଯ୍ୟ ସମୟ: ସକାଳ ୧୦ଟା ରୁ ଦିନ ୨ଟା, ରବିବାର ଛୁଟି)। ଆପଣଙ୍କର ଅନୁରୋଧ Pending ରଖାଗଲା। ଆସନ୍ତା କାର୍ଯ୍ୟ ଦିବସରେ ଅଫିସ୍ ଖୋଲିଲେ ଏହାକୁ Approve କରାଯିବ ଏବଂ ଆପଣ PDF ପାଇପାରିବେ।';

export function isOfficeOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1-6 is Mon-Sat
  const hour = now.getHours(); // 24-hour format

  // Office is open from 10:00 AM (10) to 1:59 PM (13) on Monday-Saturday
  return (day !== 0) && (hour >= 10 && hour < 14);
}

export function getOfficeStatusInfo() {
  const open = isOfficeOpen();
  const now = new Date();
  const day = now.getDay();

  let reason = '';
  if (day === 0) {
    reason = 'ଆଜି ରବିବାର (ଛୁଟି ଦିନ)';
  } else if (now.getHours() < 10) {
    reason = 'ସକାଳ ୧୦ଟା ପୂର୍ବରୁ ଅଫିସ୍ ବନ୍ଦ ରହେ';
  } else if (now.getHours() >= 14) {
    reason = 'ଦିନ ୨ଟା ପରେ ଅଫିସ୍ ବନ୍ଦ ରହେ';
  } else {
    reason = 'କାର୍ଯ୍ୟ ସମୟ ଚାଲୁଅଛି';
  }

  return {
    isOpen: open,
    reason,
    hoursText: 'ସକାଳ ୧୦:୦୦ ରୁ ଦିନ ୦୨:୦୦ (Mon - Sat)',
  };
}
