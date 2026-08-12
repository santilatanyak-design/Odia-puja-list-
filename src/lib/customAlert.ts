/**
 * Custom Alert Modal Utility
 * Replaces native browser alert() to eliminate browser domain headers ("...ai.studio says")
 */
export function showCustomAlert(message: string, title: string = 'ସୂଚନା (Notice)'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const existingOverlay = document.getElementById('custom-alert-modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-alert-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(3px);
      z-index: 999999;
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
      <div style="width: 48px; height: 48px; background-color: #fef3c7; color: #b45309; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; font-size: 24px;">
        ⚠️
      </div>
      <h3 style="margin: 0 0 12px 0; color: #701a1e; font-size: 18px; font-weight: 700; line-height: 1.4;">
        ${title}
      </h3>
      <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 15px; line-height: 1.6; font-weight: 500; white-space: pre-wrap;">
        ${message}
      </p>
      <div>
        <button id="custom-alert-close-btn" style="
          background-color: #701a1e;
          color: #ffffff;
          border: none;
          padding: 11px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          width: 100%;
        ">
          ଠିକ୍ ଅଛି (OK)
        </button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const closeBtn = card.querySelector('#custom-alert-close-btn');
    const closeHandler = () => {
      overlay.remove();
      resolve();
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeHandler);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeHandler();
      }
    });
  });
}
