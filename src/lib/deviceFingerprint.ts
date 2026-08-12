import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 1. Lightweight Canvas + Device Fingerprint Generator
 * Generates a unique, deterministic Device Hash string using Canvas fingerprinting,
 * screen resolution, color depth, userAgent, hardwareConcurrency, and timeZone.
 */
import { showCustomAlert } from './customAlert';

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'DEV_SERVER_DEFAULT';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    let canvasHash = '';
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial', 'Times New Roman', sans-serif";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('PujaSamagri#Odia1001', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('PujaSamagri#Odia1001', 4, 17);
      canvasHash = canvas.toDataURL();
    }

    const screenSpecs = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}_${window.devicePixelRatio || 1}`;
    const userAgent = navigator.userAgent || '';
    const lang = navigator.language || '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;

    const rawString = `${canvasHash}___${screenSpecs}___${userAgent}___${lang}___${timeZone}___${hardwareConcurrency}`;

    // Fast cyrb53 hash algorithm producing 16-character hexadecimal hash
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0, ch; i < rawString.length; i++) {
      ch = rawString.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const hexHash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    return `DEV_${hexHash.padStart(16, '0').slice(0, 16)}`;
  } catch (e) {
    console.warn('Fingerprinting fallback triggered:', e);
    return `DEV_FALLBACK_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * 2. Database Verification Logic (Firestore)
 * THE ULTIMATE RULE: Query database to check if this exact Device Hash exists.
 * If Device Hash exists in Firestore, immediately block download.
 * Also checks 4-Digit Voter ID PIN if provided.
 */
export async function checkDeviceOrVoterClaimed(
  deviceHash: string,
  voterIdPin?: string
): Promise<{ claimed: boolean; reason?: 'device' | 'voter' }> {
  const targetDeviceHash = deviceHash || getDeviceFingerprint();

  // RULE #1: Check Device Hash in Firestore first
  const deviceDocRef = doc(db, 'free_claims_devices', targetDeviceHash);
  const deviceSnap = await getDoc(deviceDocRef);
  if (deviceSnap.exists()) {
    // Found in database -> MUST BLOCK INSTANTLY
    return { claimed: true, reason: 'device' };
  }

  // RULE #2: Check 4-Digit Voter ID PIN in Firestore if provided
  if (voterIdPin) {
    const cleanVoterPin = voterIdPin.replace(/\D/g, '');
    if (cleanVoterPin && cleanVoterPin.length === 4) {
      const voterDocRef = doc(db, 'free_claims_voters', cleanVoterPin);
      const voterSnap = await getDoc(voterDocRef);
      if (voterSnap.exists()) {
        return { claimed: true, reason: 'voter' };
      }
    }
  }

  return { claimed: false };
}

/**
 * 3. Save Device Hash to Database
 * Immediately records new claims to prevent subsequent free downloads.
 */
export async function recordFreeDownloadClaim(
  deviceHash: string,
  voterIdPin?: string,
  metadata?: { listId?: string; pujariId?: string }
): Promise<void> {
  const cleanVoterPin = (voterIdPin || '0000').replace(/\D/g, '');
  const nowISO = new Date().toISOString();

  const claimData = {
    deviceHash,
    voterIdPin: cleanVoterPin,
    claimedAt: nowISO,
    createdAt: serverTimestamp(),
    ...metadata,
  };

  // Lock Device Hash permanently in Firestore (and Voter PIN if supplied)
  const tasks: Promise<any>[] = [
    setDoc(doc(db, 'free_claims_devices', deviceHash), claimData),
    setDoc(doc(db, 'free_download_claims', `${deviceHash}_${Date.now()}`), claimData),
  ];

  if (cleanVoterPin && cleanVoterPin !== '0000') {
    tasks.push(setDoc(doc(db, 'free_claims_voters', cleanVoterPin), claimData));
  }

  await Promise.all(tasks);
}

/**
 * Desktop / Laptop Device Detection
 * Checks if the device is a Desktop/Laptop (no mobile userAgent AND window width > 800)
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|MobileSafari/i.test(ua);
  const isLargeWidth = window.innerWidth > 800;

  return !isMobileUA && isLargeWidth;
}

/**
 * Centered Payment QR Modal for Desktop/Laptop Users
 */
export async function showDesktopPaymentModal(customQrUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    const existingModal = document.getElementById('desktop-payment-modal-overlay');
    if (existingModal) existingModal.remove();

    const finalQrUrl = customQrUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=pujasamagri@upi%26pn=Puja%20Samagri%26am=5%26cu=INR';

    const overlay = document.createElement('div');
    overlay.id = 'desktop-payment-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      border: 2px solid #b45309;
      position: relative;
    `;

    card.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">💻 ➔ 📱</div>
      <h3 style="margin: 0 0 12px 0; color: #701a1e; font-size: 17px; font-weight: 700; line-height: 1.4;">
        କମ୍ପ୍ୟୁଟର ବା ଲ୍ୟାପଟପ୍ରୁ ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ ଦୟାକରି ₹୫ ଟଙ୍କା ପେମେଣ୍ଟ୍ କରନ୍ତୁ।
      </h3>
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 13px; line-height: 1.5;">
        (ମାଗଣା ଡାଉନଲୋଡ୍ ସୁବିଧା କେବଳ ମୋବାଇଲ୍ ଡିଭାଇସ୍ ପାଇଁ ଉଦ୍ଦିଷ୍ଟ)
      </p>
      <div style="background: #fffdf5; padding: 12px; border-radius: 12px; border: 1px dashed #d97706; display: inline-block; margin-bottom: 16px;">
        <img src="${finalQrUrl}" alt="₹5 Payment QR Code" style="width: 200px; height: 200px; object-fit: contain; border-radius: 8px; display: block; margin: 0 auto;" />
        <div style="margin-top: 8px; font-weight: 700; color: #92400e; font-size: 15px;">
          ଦେୟ ପରିମାଣ: ₹୫
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">UPI ID: pujasamagri@upi</div>
      </div>
      <div>
        <button id="desktop-modal-close-btn" style="
          background-color: #701a1e;
          color: #ffffff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        ">
          ✕ ବନ୍ଦ କରନ୍ତୁ (Close)
        </button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const closeBtn = card.querySelector('#desktop-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.remove();
        resolve();
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve();
      }
    });
  });
}

/**
 * 4. Silent Device Fingerprint Download Handler
 * Steps:
 *  a. Checks if device is Desktop/Laptop -> STOP & Show ₹5 Payment QR Modal.
 *  b. Mobile Device: Generates unique Device Fingerprint Hash silently.
 *  c. Queries Firestore for this Device Hash in free_claims_devices collection.
 *  d. If Device Hash found in DB -> BLOCKS download instantly & shows Odia alert:
 *     "କ୍ଷମା କରିବେ, ଏହି ଡିଭାଇସ୍ରୁ ପୂର୍ବରୁ ମାଗଣା ଡାଉନଲୋଡ୍ କରାଯାଇଛି। ଦୟାକରି ଆକ୍ସେସ୍ ନିଅନ୍ତୁ।"
 *  e. If Device Hash NOT found -> Saves Device Hash silently to DB and allows download.
 */
export async function handleFreeDownloadWithDoubleLock(
  onSuccessDownload: () => void | Promise<void>,
  voterIdPinInput?: string,
  metadata?: { listId?: string; pujariId?: string }
): Promise<boolean> {
  // 0. DESKTOP / LAPTOP RESTRICTION: Block free download on Desktop and show ₹5 Payment QR
  if (isDesktopDevice()) {
    try {
      let qrUrl = '';
      const qrDoc = await getDoc(doc(db, 'config', 'qrConfig'));
      if (qrDoc.exists()) {
        qrUrl = qrDoc.data()?.newCreationQrUrl || '';
      }
      await showDesktopPaymentModal(qrUrl);
    } catch {
      await showDesktopPaymentModal();
    }
    return false; // STOP download immediately for desktop/laptop
  }

  // 1. MOBILE DEVICE: Generate unique Device Hash silently
  const deviceHash = getDeviceFingerprint();

  try {
    // 2. Query Database: Has this exact Device Hash already claimed a free download?
    const deviceSnap = await getDoc(doc(db, 'free_claims_devices', deviceHash));
    if (deviceSnap.exists()) {
      // BLOCK INSTANTLY with custom modal Odia alert
      await showCustomAlert('କ୍ଷମା କରିବେ, ଏହି ଡିଭାଇସ୍ରୁ ପୂର୍ବରୁ ମାଗଣା ଡାଉନଲୋଡ୍ କରାଯାଇଛି। ଦୟାକରି ଆକ୍ସେସ୍ ନିଅନ୍ତୁ।');
      return false;
    }

    // 3. First time (truly new mobile phone) -> Save Device Hash silently to database
    await recordFreeDownloadClaim(deviceHash, voterIdPinInput, metadata);

    // 4. Proceed with download
    await onSuccessDownload();
    return true;
  } catch (err: any) {
    console.error('Free download verification error:', err);
    await showCustomAlert(err.message || 'ଯାଞ୍ଚ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।');
    return false;
  }
}

